import crypto from 'crypto';
import { WebClient } from '@slack/web-api';

export function getSlackClient(): WebClient {
  return new WebClient(process.env.SLACK_BOT_TOKEN);
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

  // Create the base string
  const baseString = `v0:${timestamp}:${body}`;

  // Calculate the signature
  const calculatedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`;

  // Compare signatures
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
