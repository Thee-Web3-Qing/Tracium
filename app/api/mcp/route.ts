import { NextRequest, NextResponse } from 'next/server';
import { searchSlackMessages, getConversationContext } from '@/lib/slack';
import { analyzeRisk } from '@/lib/qwen';

/**
 * Tracium MCP (Model Context Protocol) Server
 *
 * Exposes Slack search and risk analysis as AI-callable tools via JSON-RPC 2.0.
 * Compatible with Claude, Cursor, and any MCP-compliant AI client.
 *
 * Endpoint: POST /api/mcp
 *
 * Tools available:
 *   slack_search           — full-text search across Slack (requires SLACK_USER_TOKEN)
 *   slack_channel_history  — fetch recent messages from a channel or thread
 *   slack_analyze_risk     — analyze a message for operational/business risks
 *
 * MCP spec: https://modelcontextprotocol.io
 */

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

const TOOLS: McpTool[] = [
  {
    name: 'slack_search',
    description: 'Search across all Slack messages the bot has access to. Returns matching messages with author, timestamp, channel, and permalink. Requires SLACK_USER_TOKEN with search:read scope.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (supports Slack search operators like "in:#channel", "from:@user", "before:2024-01-01")' },
        count: { type: 'number', description: 'Number of results to return (default: 20, max: 100)' },
        sort: { type: 'string', enum: ['score', 'timestamp'], description: 'Sort order: "score" for relevance, "timestamp" for newest first (default: score)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'slack_channel_history',
    description: 'Fetch recent messages from a Slack channel or thread. Use this to get conversation context before analyzing a risk or decision.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Slack channel ID (e.g. C01234ABCD)' },
        thread_ts: { type: 'string', description: 'Thread timestamp to fetch replies from a specific thread (optional)' },
        limit: { type: 'number', description: 'Number of messages to return (default: 12, max: 50)' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'slack_analyze_risk',
    description: 'Analyze a Slack message for operational, product, engineering, security, launch, or reputational risks. Optionally provide conversation context for a more accurate analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The message text to analyze' },
        context: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of recent messages from the same channel/thread to provide conversation context',
        },
      },
      required: ['message'],
    },
  },
];

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } });
}

function jsonRpcResult(id: string | number | null, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

export async function GET() {
  return NextResponse.json({
    name: 'tracium-mcp',
    version: '1.0.0',
    description: 'Tracium MCP server — Slack search and risk analysis tools',
    endpoint: '/api/mcp',
    protocol: 'JSON-RPC 2.0',
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  });
}

export async function POST(request: NextRequest) {
  let rpc: JsonRpcRequest;

  try {
    rpc = await request.json() as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, 'Parse error');
  }

  if (!rpc.jsonrpc || rpc.jsonrpc !== '2.0') {
    return jsonRpcError(rpc.id ?? null, -32600, 'Invalid Request: jsonrpc must be "2.0"');
  }

  const { id, method, params = {} } = rpc;

  // ── initialize ────────────────────────────────────────────────────────────
  if (method === 'initialize') {
    return jsonRpcResult(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'tracium-mcp', version: '1.0.0' },
    });
  }

  // ── tools/list ────────────────────────────────────────────────────────────
  if (method === 'tools/list') {
    return jsonRpcResult(id, { tools: TOOLS });
  }

  // ── tools/call ────────────────────────────────────────────────────────────
  if (method === 'tools/call') {
    const toolName = params.name as string;
    const args = (params.arguments ?? {}) as Record<string, unknown>;

    if (!toolName) {
      return jsonRpcError(id, -32602, 'Invalid params: name is required');
    }

    try {
      // ── slack_search ────────────────────────────────────────────────────
      if (toolName === 'slack_search') {
        const query = args.query as string;
        if (!query) return jsonRpcError(id, -32602, 'Invalid params: query is required');

        const count = Math.min(100, Number(args.count ?? 20));
        const sort = (args.sort as 'score' | 'timestamp') ?? 'score';
        const results = await searchSlackMessages(query, count, sort);

        return jsonRpcResult(id, {
          content: [
            {
              type: 'text',
              text: results.length === 0
                ? 'No messages found matching that query. Make sure SLACK_USER_TOKEN is set with search:read scope.'
                : JSON.stringify(results, null, 2),
            },
          ],
        });
      }

      // ── slack_channel_history ───────────────────────────────────────────
      if (toolName === 'slack_channel_history') {
        const channel = args.channel as string;
        if (!channel) return jsonRpcError(id, -32602, 'Invalid params: channel is required');

        const threadTs = args.thread_ts as string | undefined;
        const limit = Math.min(50, Number(args.limit ?? 12));
        const messages = await getConversationContext(channel, threadTs, limit);

        return jsonRpcResult(id, {
          content: [
            {
              type: 'text',
              text: messages.length === 0
                ? 'No messages found. Check that the bot has been invited to this channel and has channels:history scope.'
                : messages.map((m, i) => `[${i + 1}] ${m}`).join('\n'),
            },
          ],
        });
      }

      // ── slack_analyze_risk ──────────────────────────────────────────────
      if (toolName === 'slack_analyze_risk') {
        const message = args.message as string;
        if (!message) return jsonRpcError(id, -32602, 'Invalid params: message is required');

        const context = Array.isArray(args.context)
          ? (args.context as string[])
          : undefined;

        const analysis = await analyzeRisk(message, context);

        return jsonRpcResult(id, {
          content: [
            {
              type: 'text',
              text: analysis.isUnclearContext
                ? analysis.slackReply
                : [
                    analysis.slackReply,
                    '',
                    `_Internal — riskScore: ${analysis.riskScore}/10, category: ${analysis.category}_`,
                    `_Consequences: ${analysis.consequences}_`,
                    `_Action item: ${analysis.actionItem}_`,
                  ].join('\n'),
            },
          ],
        });
      }

      return jsonRpcError(id, -32601, `Method not found: tool "${toolName}" does not exist`);
    } catch (err) {
      console.error(`[Tracium MCP] Tool "${toolName}" failed:`, err);
      return jsonRpcError(id, -32603, `Internal error executing tool "${toolName}"`);
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}
