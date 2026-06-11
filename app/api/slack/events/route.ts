import { NextRequest, NextResponse } from 'next/server';
import { getSlackClient, verifySlackSignature, formatRiskReport } from '@/lib/slack';
import { analyzeRisk, extractDecision, extractActionItem, detectUnresolvedDiscussion } from '@/lib/qwen';
import { saveRiskEvent, saveDecision, saveActionItem } from '@/lib/db';
import { RISK_KEYWORDS, type SlackEvent } from '@/lib/types';

// In-memory deduplication — prevents duplicate processing when Slack retries events
const processedEventIds = new Set<string>();

const STRONG_RISK_THRESHOLD = 6;

function containsRiskKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.values(RISK_KEYWORDS)
    .flat()
    .some((keyword) => lowerText.includes(keyword));
}

async function postToSlack(channel: string, text: string, threadTs?: string): Promise<void> {
  const slackClient = getSlackClient();
  try {
    await slackClient.chat.postMessage({
      channel,
      text,
      thread_ts: threadTs,
    });
  } catch (err: unknown) {
    console.error('[Tracium] Slack chat.postMessage failed:', JSON.stringify(err, null, 2));
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: SlackEvent = JSON.parse(rawBody);

    // Verify Slack signature
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';

    if (!verifySlackSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle URL verification during Slack app setup
    if (body.type === 'url_verification' && body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle event callbacks
    if (body.type === 'event_callback' && body.event) {

      // Deduplicate using event_id — Slack retries events on 200 timeout
      if (body.event_id) {
        if (processedEventIds.has(body.event_id)) {
          console.log(`[Tracium] Duplicate event ignored: ${body.event_id}`);
          return NextResponse.json({ status: 'duplicate' });
        }
        processedEventIds.add(body.event_id);
        // Prevent unbounded memory growth
        if (processedEventIds.size > 5000) {
          const oldest = processedEventIds.values().next().value;
          if (oldest) processedEventIds.delete(oldest);
        }
      }

      const event = body.event;

      // Log the full incoming event type and text for debugging
      console.log(`[Tracium] Incoming event type: ${event.type}, channel_type: ${event.channel_type ?? 'n/a'}, text: ${event.text ?? '(none)'}`);

      // Ignore bot messages (including our own) to avoid loops
      if (event.bot_id || event.subtype === 'bot_message') {
        console.log('[Tracium] Ignoring bot message');
        return NextResponse.json({ status: 'ignored', reason: 'bot_message' });
      }

      // Only handle app_mention and message events
      if (event.type !== 'app_mention' && event.type !== 'message') {
        console.log(`[Tracium] Ignoring unhandled event type: ${event.type}`);
        return NextResponse.json({ status: 'ignored', reason: 'unhandled_event_type' });
      }

      // Require text and channel
      if (!event.text || !event.channel || !event.ts) {
        console.log('[Tracium] Ignoring event: missing text, channel, or ts');
        return NextResponse.json({ status: 'ignored', reason: 'invalid_event' });
      }

      const messageText = event.text;
      const channel = event.channel;
      const ts = event.ts;
      const threadTs = event.thread_ts;
      const replyThread = threadTs || ts;
      const isAppMention = event.type === 'app_mention';
      // message.channels events have event.type === 'message'
      const isChannelMessage = event.type === 'message';

      // --- app_mention: always acknowledge and analyze ---
      if (isAppMention) {
        console.log('[Tracium] app_mention received — sending acknowledgment');
        try {
          await postToSlack(channel, '✅ Tracium received your message. Analyzing risk now...', replyThread);
        } catch {
          // Acknowledgment failed — log already happened in postToSlack, continue anyway
        }

        let riskAnalysis = null;
        try {
          riskAnalysis = await analyzeRisk(messageText);
          console.log(`[Tracium] Risk analysis complete — score: ${riskAnalysis.riskScore}, unclear: ${riskAnalysis.isUnclearContext}`);
        } catch (qwenErr) {
          console.error('[Tracium] Qwen risk analysis failed:', qwenErr);
          try {
            await postToSlack(
              channel,
              '⚠️ I ran into an issue completing the analysis. Please try again or flag this manually for the team.',
              replyThread
            );
          } catch { /* already logged */ }
        }

        if (riskAnalysis) {
          const reply = formatRiskReport(riskAnalysis);
          try {
            await postToSlack(channel, reply, replyThread);
          } catch { /* already logged */ }

          // Store risk event regardless of isUnclearContext
          if (!riskAnalysis.isUnclearContext) {
            saveRiskEvent({
              channel,
              message: messageText,
              riskScore: riskAnalysis.riskScore,
              category: riskAnalysis.category,
              consequences: riskAnalysis.consequences,
              alternative: riskAnalysis.alternative,
              actionItem: riskAnalysis.actionItem,
              slackTs: ts,
              slackThreadTs: threadTs,
            }).catch((err) => console.error('[Tracium] saveRiskEvent failed:', err));
          }
        }
      }

      // --- message.channels: only reply on strong detected risk ---
      if (isChannelMessage) {
        const hasRiskKeywords = containsRiskKeywords(messageText);
        console.log(`[Tracium] Channel message — keywords detected: ${hasRiskKeywords}`);

        if (hasRiskKeywords) {
          let riskAnalysis = null;
          try {
            riskAnalysis = await analyzeRisk(messageText);
            console.log(`[Tracium] Channel risk analysis — score: ${riskAnalysis.riskScore}, unclear: ${riskAnalysis.isUnclearContext}`);
          } catch (qwenErr) {
            console.error('[Tracium] Qwen channel analysis failed:', qwenErr);
          }

          if (riskAnalysis && !riskAnalysis.isUnclearContext && riskAnalysis.riskScore >= STRONG_RISK_THRESHOLD) {
            const reply = formatRiskReport(riskAnalysis);
            try {
              await postToSlack(channel, reply, replyThread);
            } catch { /* already logged */ }

            saveRiskEvent({
              channel,
              message: messageText,
              riskScore: riskAnalysis.riskScore,
              category: riskAnalysis.category,
              consequences: riskAnalysis.consequences,
              alternative: riskAnalysis.alternative,
              actionItem: riskAnalysis.actionItem,
              slackTs: ts,
              slackThreadTs: threadTs,
            }).catch((err) => console.error('[Tracium] saveRiskEvent failed:', err));
          } else {
            console.log('[Tracium] Channel message risk below threshold or unclear — no reply sent');
          }
        }
      }

      // --- Always extract and store decisions + action items for both event types ---
      const [decisionResult, actionItemResult, unresolvedResult] = await Promise.all([
        extractDecision(messageText).catch((err) => {
          console.error('[Tracium] extractDecision failed:', err);
          return { hasDecision: false, decision: undefined, owner: undefined };
        }),
        extractActionItem(messageText).catch((err) => {
          console.error('[Tracium] extractActionItem failed:', err);
          return { hasActionItem: false, task: undefined, owner: undefined };
        }),
        detectUnresolvedDiscussion(messageText).catch((err) => {
          console.error('[Tracium] detectUnresolvedDiscussion failed:', err);
          return { isUnresolved: false, topic: undefined, participants: [] };
        }),
      ]);

      const storagePromises: Promise<unknown>[] = [];

      if (decisionResult.hasDecision && decisionResult.decision) {
        storagePromises.push(
          saveDecision({
            channel,
            decision: decisionResult.decision,
            owner: decisionResult.owner,
            slackTs: ts,
            slackThreadTs: threadTs,
          })
        );
      }

      if (actionItemResult.hasActionItem && actionItemResult.task) {
        storagePromises.push(
          saveActionItem({
            channel,
            task: actionItemResult.task,
            owner: actionItemResult.owner,
            slackTs: ts,
            slackThreadTs: threadTs,
          })
        );
      }

      await Promise.all(storagePromises);

      return NextResponse.json({
        status: 'processed',
        eventType: event.type,
        decisionExtracted: decisionResult.hasDecision,
        actionItemExtracted: actionItemResult.hasActionItem,
        unresolvedDiscussion: unresolvedResult.isUnresolved,
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'unknown_event_type' });
  } catch (error) {
    console.error('[Tracium] Error processing Slack event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
