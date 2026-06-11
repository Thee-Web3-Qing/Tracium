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

      // Ignore bot messages (including our own)
      if (event.bot_id || event.subtype === 'bot_message') {
        return NextResponse.json({ status: 'ignored', reason: 'bot_message' });
      }

      // Only process regular messages with text
      if (!event.text || !event.channel || !event.ts) {
        return NextResponse.json({ status: 'ignored', reason: 'invalid_event' });
      }

      const messageText = event.text;
      const channel = event.channel;
      const ts = event.ts;
      const threadTs = event.thread_ts;

      // Run extractions in parallel for efficiency
      const [
        riskDetected,
        decisionResult,
        actionItemResult,
        unresolvedResult,
      ] = await Promise.all([
        containsRiskKeywords(messageText) ? analyzeRisk(messageText) : null,
        extractDecision(messageText),
        extractActionItem(messageText),
        detectUnresolvedDiscussion(messageText),
      ]);

      // Store extracted data
      const storagePromises: Promise<unknown>[] = [];

      // Handle risk analysis
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

        // Reply in Slack thread with risk report
        const riskReport = formatRiskReport(riskDetected);
        const slackClient = getSlackClient();

        await slackClient.chat.postMessage({
          channel,
          text: riskReport,
          thread_ts: threadTs || ts,
        });
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

      // Wait for all storage operations to complete
      await Promise.all(storagePromises);

      return NextResponse.json({
        status: 'processed',
        riskDetected: !!riskDetected,
        decisionExtracted: decisionResult.hasDecision,
        actionItemExtracted: actionItemResult.hasActionItem,
        unresolvedDiscussion: unresolvedResult.isUnresolved,
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'unknown_event_type' });
  } catch (error) {
    console.error('Error processing Slack event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
