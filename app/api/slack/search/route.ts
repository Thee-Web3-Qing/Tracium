import { NextRequest, NextResponse } from 'next/server';
import { searchSlackMessages, getConversationContext } from '@/lib/slack';

/**
 * GET /api/slack/search
 *
 * Real-time Slack message search.
 *
 * Query params:
 *   q        - (required) search query string
 *   count    - number of results to return (default: 20, max: 100)
 *   sort     - "score" (relevance) | "timestamp" (newest first) — default: score
 *
 * Requires SLACK_USER_TOKEN with search:read scope in environment variables.
 *
 * Example:
 *   GET /api/slack/search?q=hotfix+production&count=10&sort=timestamp
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? searchParams.get('query') ?? '';
    const count = Math.min(100, parseInt(searchParams.get('count') ?? '20', 10));
    const sort = (searchParams.get('sort') ?? 'score') as 'score' | 'timestamp';

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Missing required parameter: q' },
        { status: 400 }
      );
    }

    const results = await searchSlackMessages(query, count, sort);

    return NextResponse.json({
      ok: true,
      query,
      count: results.length,
      messages: results,
    });
  } catch (error) {
    console.error('[Tracium] /api/slack/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/slack/search
 *
 * Fetch conversation context from a specific channel or thread.
 * Useful for pulling context before running a risk analysis.
 *
 * Body:
 *   channel   - (required) Slack channel ID
 *   thread_ts - (optional) thread timestamp to fetch replies from
 *   limit     - number of messages to return (default: 12, max: 50)
 *
 * Requires SLACK_BOT_TOKEN with channels:history (or groups:history) scope.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { channel?: string; thread_ts?: string; limit?: number };
    const { channel, thread_ts, limit = 12 } = body;

    if (!channel) {
      return NextResponse.json(
        { error: 'Missing required field: channel' },
        { status: 400 }
      );
    }

    const messages = await getConversationContext(
      channel,
      thread_ts,
      Math.min(50, limit)
    );

    return NextResponse.json({
      ok: true,
      channel,
      thread_ts: thread_ts ?? null,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('[Tracium] /api/slack/search POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
