import { NextRequest, NextResponse } from 'next/server';
import { getSlackClient, verifySlackSignature, formatRiskReport, getConversationContext } from '@/lib/slack';
import {
  analyzeRisk,
  extractDecision,
  extractActionItem,
  detectUnresolvedDiscussion,
  extractMemoryEntities,
  generateMemoryResponse,
} from '@/lib/qwen';
import {
  saveRiskEvent,
  saveDecision,
  saveActionItem,
  saveDeadline,
  saveBlocker,
  saveOwnership,
  saveLaunchDecision,
  searchMemory,
} from '@/lib/db';
import { RISK_KEYWORDS, type SlackEvent } from '@/lib/types';

// In-memory deduplication — prevents duplicate processing when Slack retries events
const processedEventIds = new Set<string>();

const STRONG_RISK_THRESHOLD = 6;

function containsRiskKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.values(RISK_KEYWORDS).flat().some((kw) => lowerText.includes(kw));
}

async function postToSlack(channel: string, text: string, threadTs?: string): Promise<void> {
  const client = getSlackClient();
  try {
    await client.chat.postMessage({ channel, text, thread_ts: threadTs });
  } catch (err: unknown) {
    console.error('[Tracium] chat.postMessage failed:', JSON.stringify(err, null, 2));
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: SlackEvent = JSON.parse(rawBody);

    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';

    if (!verifySlackSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (body.type === 'url_verification' && body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    if (body.type === 'event_callback' && body.event) {

      // Deduplicate — Slack retries on timeout
      if (body.event_id) {
        if (processedEventIds.has(body.event_id)) {
          console.log(`[Tracium] Duplicate event ignored: ${body.event_id}`);
          return NextResponse.json({ status: 'duplicate' });
        }
        processedEventIds.add(body.event_id);
        if (processedEventIds.size > 5000) {
          const oldest = processedEventIds.values().next().value;
          if (oldest) processedEventIds.delete(oldest);
        }
      }

      const event = body.event;
      console.log(`[Tracium] event type: ${event.type}, channel_type: ${event.channel_type ?? 'n/a'}, text: ${event.text ?? '(none)'}`);

      if (event.bot_id || event.subtype === 'bot_message') {
        return NextResponse.json({ status: 'ignored', reason: 'bot_message' });
      }

      if (event.type !== 'app_mention' && event.type !== 'message') {
        return NextResponse.json({ status: 'ignored', reason: 'unhandled_event_type' });
      }

      if (!event.text || !event.channel || !event.ts) {
        return NextResponse.json({ status: 'ignored', reason: 'invalid_event' });
      }

      const messageText = event.text;
      const channel     = event.channel;
      const ts          = event.ts;
      const threadTs    = event.thread_ts;
      const replyThread = threadTs || ts;
      const isAppMention    = event.type === 'app_mention';
      const isChannelMessage = event.type === 'message';

      // Fetch conversation context and stored memory in parallel
      const [conversationContext, memory] = await Promise.all([
        getConversationContext(channel, threadTs),
        searchMemory(),
      ]);
      console.log(`[Tracium] context: ${conversationContext.length} msgs, memory: ${
        memory.decisions.length + memory.actionItems.length + memory.deadlines.length +
        memory.blockers.length + memory.ownership.length + memory.launchDecisions.length
      } records`);

      // ── app_mention: memory-first response ────────────────────────────────
      if (isAppMention) {
        // Acknowledge immediately
        try {
          await postToSlack(channel, '✅ Tracium is on it — checking the records...', replyThread);
        } catch { /* already logged */ }

        // Try memory-grounded response first
        let replied = false;
        try {
          const memoryReply = await generateMemoryResponse(messageText, memory, conversationContext);
          await postToSlack(channel, memoryReply, replyThread);
          replied = true;
          console.log('[Tracium] Memory response sent');
        } catch (err) {
          console.error('[Tracium] generateMemoryResponse failed:', err);
        }

        // If memory response failed, fall back to risk analysis
        if (!replied) {
          try {
            const riskAnalysis = await analyzeRisk(messageText, conversationContext);
            const reply = formatRiskReport(riskAnalysis);
            await postToSlack(channel, reply, replyThread);
            if (!riskAnalysis.isUnclearContext) {
              saveRiskEvent({
                channel, message: messageText,
                riskScore: riskAnalysis.riskScore, category: riskAnalysis.category,
                consequences: riskAnalysis.consequences, alternative: riskAnalysis.alternative,
                actionItem: riskAnalysis.actionItem, slackTs: ts, slackThreadTs: threadTs,
              }).catch((e) => console.error('[Tracium] saveRiskEvent failed:', e));
            }
          } catch (err) {
            console.error('[Tracium] Risk analysis fallback failed:', err);
            try {
              await postToSlack(channel, '⚠️ I ran into an issue completing the analysis. Please try again or flag this manually.', replyThread);
            } catch { /* already logged */ }
          }
        }
      }

      // ── channel messages: only reply on strong risk ────────────────────────
      if (isChannelMessage && containsRiskKeywords(messageText)) {
        try {
          const riskAnalysis = await analyzeRisk(messageText, conversationContext);
          console.log(`[Tracium] channel risk score: ${riskAnalysis.riskScore}, unclear: ${riskAnalysis.isUnclearContext}`);
          if (!riskAnalysis.isUnclearContext && riskAnalysis.riskScore >= STRONG_RISK_THRESHOLD) {
            await postToSlack(channel, formatRiskReport(riskAnalysis), replyThread);
            saveRiskEvent({
              channel, message: messageText,
              riskScore: riskAnalysis.riskScore, category: riskAnalysis.category,
              consequences: riskAnalysis.consequences, alternative: riskAnalysis.alternative,
              actionItem: riskAnalysis.actionItem, slackTs: ts, slackThreadTs: threadTs,
            }).catch((e) => console.error('[Tracium] saveRiskEvent failed:', e));
          }
        } catch (err) {
          console.error('[Tracium] channel risk analysis failed:', err);
        }
      }

      // ── Extract and store all organizational memory entities ───────────────
      const [decisionResult, actionItemResult, , memoryEntities] = await Promise.all([
        extractDecision(messageText).catch((e) => {
          console.error('[Tracium] extractDecision failed:', e);
          return { hasDecision: false, decision: undefined, owner: undefined };
        }),
        extractActionItem(messageText).catch((e) => {
          console.error('[Tracium] extractActionItem failed:', e);
          return { hasActionItem: false, task: undefined, owner: undefined };
        }),
        detectUnresolvedDiscussion(messageText).catch((e) => {
          console.error('[Tracium] detectUnresolvedDiscussion failed:', e);
          return { isUnresolved: false };
        }),
        extractMemoryEntities(messageText).catch((e) => {
          console.error('[Tracium] extractMemoryEntities failed:', e);
          return { deadlines: [], blockers: [], ownership: [], launchDecisions: [] };
        }),
      ]);

      const storagePromises: Promise<unknown>[] = [];

      if (decisionResult.hasDecision && decisionResult.decision) {
        storagePromises.push(
          saveDecision({ channel, decision: decisionResult.decision, owner: decisionResult.owner, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      if (actionItemResult.hasActionItem && actionItemResult.task) {
        storagePromises.push(
          saveActionItem({ channel, task: actionItemResult.task, owner: actionItemResult.owner, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      for (const d of memoryEntities.deadlines) {
        storagePromises.push(
          saveDeadline({ task: d.task, deadlineDate: d.deadlineDate, owner: d.owner ?? undefined, channel, rawMessage: messageText, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      for (const b of memoryEntities.blockers) {
        storagePromises.push(
          saveBlocker({ description: b.description, blockedBy: b.blockedBy ?? undefined, owner: b.owner ?? undefined, channel, rawMessage: messageText, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      for (const o of memoryEntities.ownership) {
        storagePromises.push(
          saveOwnership({ person: o.person, item: o.item, channel, rawMessage: messageText, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      for (const l of memoryEntities.launchDecisions) {
        storagePromises.push(
          saveLaunchDecision({ decision: l.decision, reason: l.reason ?? undefined, scheduledDate: l.scheduledDate ?? undefined, channel, rawMessage: messageText, slackTs: ts, slackThreadTs: threadTs })
        );
      }

      await Promise.all(storagePromises);

      console.log(`[Tracium] stored: decisions=${decisionResult.hasDecision ? 1 : 0}, actions=${actionItemResult.hasActionItem ? 1 : 0}, deadlines=${memoryEntities.deadlines.length}, blockers=${memoryEntities.blockers.length}, ownership=${memoryEntities.ownership.length}, launches=${memoryEntities.launchDecisions.length}`);

      return NextResponse.json({
        status: 'processed',
        eventType: event.type,
        contextMessages: conversationContext.length,
        memoryRecords: memory.decisions.length + memory.actionItems.length,
        extracted: {
          decision: decisionResult.hasDecision,
          actionItem: actionItemResult.hasActionItem,
          deadlines: memoryEntities.deadlines.length,
          blockers: memoryEntities.blockers.length,
          ownership: memoryEntities.ownership.length,
          launchDecisions: memoryEntities.launchDecisions.length,
        },
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'unknown_event_type' });
  } catch (error) {
    console.error('[Tracium] Error processing Slack event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
