import { NextRequest, NextResponse } from 'next/server';
import { getSlackClient, verifySlackSignature, formatRiskReport } from '@/lib/slack';
import { analyzeRisk, extractDecision, extractActionItem, detectUnresolvedDiscussion } from '@/lib/qwen';
import { saveRiskEvent, saveDecision, saveActionItem } from '@/lib/db';
import { RISK_KEYWORDS, type SlackEvent } from '@/lib/types';

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

    // Handle message events
    if (body.type === 'event_callback' && body.event) {
      const event = body.event;

      // Log the full incoming event type and text for debugging
      console.log(`[Tracium] Incoming event type: ${event.type}, text: ${event.text ?? '(none)'}`);

      // Ignore bot messages (including our own) to avoid loops
      if (event.bot_id || event.subtype === 'bot_message') {
        console.log('[Tracium] Ignoring bot message');
        return NextResponse.json({ status: 'ignored', reason: 'bot_message' });
      }

      // Only handle app_mention and message event types
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

      // For app_mention: always send an immediate acknowledgment first
      if (isAppMention) {
        console.log('[Tracium] app_mention received — sending acknowledgment');
        try {
          await postToSlack(channel, '✅ Tracium received your message. Analyzing risk now...', replyThread);
        } catch {
          // Acknowledgment failed — log already happened in postToSlack, continue anyway
        }
      }

      // Run Qwen risk analysis
      // For app_mention: always analyze regardless of keywords
      // For regular messages: only analyze if risk keywords are present
      let riskDetected = null;
      const shouldAnalyzeRisk = isAppMention || containsRiskKeywords(messageText);

      if (shouldAnalyzeRisk) {
        try {
          riskDetected = await analyzeRisk(messageText);
          console.log(`[Tracium] Risk analysis complete — score: ${riskDetected.riskScore}, category: ${riskDetected.category}`);
        } catch (qwenErr) {
          console.error('[Tracium] Qwen risk analysis failed:', qwenErr);

          // Fallback risk response so Slack never goes silent
          const fallbackMessage =
            '⚠️ *Tracium Risk Alert*\n\nI was unable to complete a full AI risk analysis right now, but your message has been flagged for review.\n\n*Recommended action:* Review this message with your team before proceeding.\n\n_Automated fallback response — please retry if needed._';

          try {
            await postToSlack(channel, fallbackMessage, replyThread);
          } catch {
            // Already logged inside postToSlack
          }
        }
      }

      // Run decision, action item, and unresolved discussion extractions in parallel
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

      // Store extracted data
      const storagePromises: Promise<unknown>[] = [];

      // Handle risk analysis result — post full report and save
      if (riskDetected) {
        storagePromises.push(
          saveRiskEvent({
            channel,
            message: messageText,
            riskScore: riskDetected.riskScore,
            category: riskDetected.category,
            consequences: riskDetected.consequences,
            alternative: riskDetected.alternative,
            actionItem: riskDetected.actionItem,
            slackTs: ts,
            slackThreadTs: threadTs,
          })
        );

        const riskReport = formatRiskReport(riskDetected);
        try {
          await postToSlack(channel, riskReport, replyThread);
        } catch {
          // Already logged inside postToSlack
        }
      }

      // Store decisions
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

      // Store action items
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
        riskDetected: !!riskDetected,
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
