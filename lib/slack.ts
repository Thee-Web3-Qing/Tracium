import crypto from 'crypto';
import { WebClient } from '@slack/web-api';

export function getSlackClient(): WebClient {
  return new WebClient(process.env.SLACK_BOT_TOKEN);
}

function getUserClient(): WebClient {
  return new WebClient(process.env.SLACK_USER_TOKEN);
}

export function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.warn('SLACK_SIGNING_SECRET not set, skipping signature verification');
    return true;
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);

  if (Math.abs(currentTime - requestTime) > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const calculatedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}

export function formatRiskReport(analysis: {
  slackReply?: string;
  riskScore: number;
  category: string;
  consequences: string;
  alternative: string;
  actionItem: string;
}): string {
  if (analysis.slackReply) {
    return analysis.slackReply;
  }

  // Fallback if slackReply is not present
  return `⚠️ Heads up — there's something worth reviewing here.\n\n${analysis.consequences}\n\n*Recommended action:* ${analysis.actionItem}`;
}

/**
 * Fetch recent messages from a channel or thread for conversation context.
 * Uses the bot token — no extra scopes required beyond channels:history.
 */
export async function getConversationContext(
  channel: string,
  threadTs?: string,
  limit = 12
): Promise<string[]> {
  const client = getSlackClient();
  try {
    if (threadTs) {
      const result = await client.conversations.replies({
        channel,
        ts: threadTs,
        limit,
      });
      return (result.messages ?? [])
        .filter((m) => !m.bot_id && m.subtype !== 'bot_message')
        .map((m) => m.text ?? '')
        .filter(Boolean)
        .reverse();
    } else {
      const result = await client.conversations.history({
        channel,
        limit,
      });
      return (result.messages ?? [])
        .filter((m) => !m.bot_id && m.subtype !== 'bot_message')
        .map((m) => m.text ?? '')
        .filter(Boolean)
        .reverse();
    }
  } catch (err) {
    console.error('[Tracium] getConversationContext failed:', JSON.stringify(err, null, 2));
    return [];
  }
}

export interface SlackSearchResult {
  text: string;
  user: string;
  ts: string;
  channel: string;
  channelName: string;
  permalink: string;
}

/**
 * Full-text search across all Slack messages the authed user can see.
 * Requires SLACK_USER_TOKEN with search:read scope.
 * Falls back gracefully if the token is missing.
 */
export async function searchSlackMessages(
  query: string,
  count = 20,
  sortBy: 'score' | 'timestamp' = 'score'
): Promise<SlackSearchResult[]> {
  const userToken = process.env.SLACK_USER_TOKEN;
  if (!userToken) {
    console.warn('[Tracium] SLACK_USER_TOKEN not set — search.messages requires a user token with search:read scope');
    return [];
  }

  const client = getUserClient();
  try {
    const result = await client.search.messages({
      query,
      count,
      sort: sortBy,
    });

    const matches = result.messages?.matches ?? [];
    return matches.map((m) => ({
      text: m.text ?? '',
      user: m.username ?? m.user ?? 'unknown',
      ts: m.ts ?? '',
      channel: m.channel?.id ?? '',
      channelName: m.channel?.name ?? '',
      permalink: m.permalink ?? '',
    }));
  } catch (err) {
    console.error('[Tracium] searchSlackMessages failed:', JSON.stringify(err, null, 2));
    return [];
  }
}
