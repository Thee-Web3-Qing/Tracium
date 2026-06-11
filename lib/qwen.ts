import type {
  RiskAnalysis,
  RiskCategory,
  DecisionExtraction,
  ActionItemExtraction,
  UnresolvedDiscussion,
  MemoryEntitiesExtraction,
  MemorySearchResult,
} from './types';

const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';
const QWEN_API_KEY = process.env.QWEN_API_KEY;

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponse {
  choices: { message: { content: string } }[];
}

async function callQwen(messages: QwenMessage[], jsonMode = true): Promise<string> {
  if (!QWEN_API_KEY) throw new Error('QWEN_API_KEY environment variable is required');

  const body: Record<string, unknown> = { model: QWEN_MODEL, messages };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${QWEN_API_KEY}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${err}`);
  }

  const data: QwenResponse = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from Qwen');
  return content;
}

// ── Risk analysis ────────────────────────────────────────────────────────────

export async function analyzeRisk(message: string, context?: string[]): Promise<RiskAnalysis> {
  const systemPrompt = `You are the Chief of Operations at a fast-moving tech company. You watch team conversations and speak up when you spot something that could genuinely hurt the team, the product, or the business.

Your job is NOT to produce formal risk reports. You are a senior operator with strong instincts who joins the conversation naturally — direct, practical, and human. You sound like someone the team actually respects and listens to.

When you respond:
- Write like you're in the Slack channel with the team, not filing a report
- Be conversational and brief — one to three short paragraphs at most
- Lead with the actual concern, not a preamble
- Give a concrete recommendation the team can act on today
- Never use risk scores, percentage chances, or formal categories
- Never say "Automated risk analysis", "risk score", "category", or "this is a risk"
- If the message is clearly low-stakes small talk or doesn't contain a real business risk, set isUnclearContext to true
- If the context is too vague to understand what's being discussed, set isUnclearContext to true and write exactly this as slackReply: "I've reviewed the conversation and I'm not sure what decision or issue you're referring to. Can you point me to the specific message you'd like me to review?"

Examples of good slackReply tone:
- "Hey, before we go down this path — shipping without a rollback plan has burned us before. Can we get a feature flag in place first?"
- "Worth flagging: if we bypass the security review here and something goes wrong, we own that. Thirty minutes with the security team now saves days of cleanup later."`;

  const contextBlock = context && context.length > 0
    ? `Recent conversation context (oldest → newest):\n${context.map((m, i) => `[${i + 1}] ${m}`).join('\n')}\n\n`
    : '';

  const userPrompt = `${contextBlock}Read this team message and assess whether it contains a real business risk worth raising:

"${message}"

Respond with a JSON object:
- riskScore: a number from 1 to 10 (internal only)
- category: one of "product", "engineering", "marketing", "operational", "launch", "security", "reputational"
- consequences: brief internal note (not shown to users)
- alternative: brief internal note (not shown to users)
- actionItem: one specific internal action item (not shown to users)
- slackReply: your actual conversational Slack response — human, direct, no scores or categories
- isUnclearContext: true if low-stakes or no real risk; false otherwise

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const a = JSON.parse(response);
  return {
    riskScore: Math.min(10, Math.max(1, Number(a.riskScore) || 5)),
    category: a.category as RiskCategory || 'engineering',
    consequences: a.consequences || 'Potential issues may arise',
    alternative: a.alternative || 'Consider reviewing the approach',
    actionItem: a.actionItem || 'Review with team before proceeding',
    slackReply: a.slackReply || 'Worth a quick team review before proceeding.',
    isUnclearContext: !!a.isUnclearContext,
  };
}

// ── Organizational memory — response generation ──────────────────────────────

/**
 * Generate a factual, memory-grounded response to a team question.
 * Prioritizes stored records over risk analysis.
 * Never invents information — says so when memory is insufficient.
 */
export async function generateMemoryResponse(
  question: string,
  memory: MemorySearchResult,
  context?: string[]
): Promise<string> {
  const totalRecords =
    memory.decisions.length +
    memory.actionItems.length +
    memory.deadlines.length +
    memory.blockers.length +
    memory.ownership.length +
    memory.launchDecisions.length;

  const earliestDate = memory.earliestObservedAt
    ? new Date(memory.earliestObservedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sections: string[] = [];

  if (memory.decisions.length > 0) {
    sections.push('DECISIONS:\n' + memory.decisions.map(d =>
      `- [${formatDate(d.created_at)}] ${d.decision}${d.owner ? ` (owner: ${d.owner})` : ''} in #${d.channel}`
    ).join('\n'));
  }

  if (memory.actionItems.length > 0) {
    sections.push('ACTION ITEMS:\n' + memory.actionItems.map(a =>
      `- [${formatDate(a.created_at)}] ${a.task}${a.owner ? ` (owner: ${a.owner})` : ''} — status: ${a.status} in #${a.channel}`
    ).join('\n'));
  }

  if (memory.deadlines.length > 0) {
    sections.push('DEADLINES:\n' + memory.deadlines.map(d =>
      `- [${formatDate(d.created_at)}] ${d.task}${d.deadline_date ? ` — due: ${d.deadline_date}` : ''}${d.owner ? ` (owner: ${d.owner})` : ''} in #${d.channel}`
    ).join('\n'));
  }

  if (memory.blockers.length > 0) {
    sections.push('BLOCKERS:\n' + memory.blockers.map(b =>
      `- [${formatDate(b.created_at)}] ${b.description}${b.blocked_by ? ` (blocked by: ${b.blocked_by})` : ''} — status: ${b.status} in #${b.channel}`
    ).join('\n'));
  }

  if (memory.ownership.length > 0) {
    sections.push('OWNERSHIP:\n' + memory.ownership.map(o =>
      `- [${formatDate(o.created_at)}] ${o.person} owns "${o.item}" in #${o.channel}`
    ).join('\n'));
  }

  if (memory.launchDecisions.length > 0) {
    sections.push('LAUNCH DECISIONS:\n' + memory.launchDecisions.map(l =>
      `- [${formatDate(l.created_at)}] ${l.decision}${l.reason ? ` — reason: ${l.reason}` : ''}${l.scheduled_date ? ` — date: ${l.scheduled_date}` : ''} in #${l.channel}`
    ).join('\n'));
  }

  const memoryBlock = sections.length > 0
    ? sections.join('\n\n')
    : '(no records stored yet)';

  const contextBlock = context && context.length > 0
    ? `\nRecent conversation context:\n${context.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`
    : '';

  const systemPrompt = `You are Tracium — the organizational memory for this team. You have observed real Slack conversations and stored what you saw. You answer questions about past decisions, ownership, deadlines, blockers, and launch decisions.

Rules you must follow:
1. Only reference information present in the stored records below — never invent dates, names, or decisions
2. Be specific: cite dates, channels, and owners exactly as recorded
3. If the stored memory answers the question, give a clear factual response in plain conversational language
4. If memory is insufficient or doesn't cover the question, say exactly: "I don't have a record of that in my memory yet.${earliestDate ? ` I've been observing conversations since ${earliestDate}.` : ''} You may want to check with the team directly."
5. Do not say "based on my analysis" or "it appears" — speak with the directness of someone who was there
6. If the question is about a risk rather than a factual recall, you may address the risk after answering the factual question
7. Keep responses concise — two to four sentences unless more detail is genuinely needed`;

  const userPrompt = `Stored organizational memory (${totalRecords} total records):

${memoryBlock}
${contextBlock}

Team question: "${question}"

Answer based only on the stored records above.`;

  const response = await callQwen(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    false // plain text response, not JSON
  );

  return response.trim();
}

// ── Entity extraction ────────────────────────────────────────────────────────

export async function extractDecision(message: string): Promise<DecisionExtraction> {
  const response = await callQwen([
    { role: 'system', content: 'You are Tracium, an AI Risk Intelligence Agent. You analyze team messages to extract decisions that have been made.' },
    {
      role: 'user', content: `Analyze this message and extract any decisions that were made:

"${message}"

A decision is a conclusion or resolution reached after consideration. Look for: "We decided to...", "The decision is...", "We're going with...", "Agreed on..."

Respond with JSON: { hasDecision: boolean, decision?: string, owner?: string }`,
    },
  ]);
  return JSON.parse(response);
}

export async function extractActionItem(message: string): Promise<ActionItemExtraction> {
  const response = await callQwen([
    { role: 'system', content: 'You are Tracium, an AI Risk Intelligence Agent. You extract action items from team messages.' },
    {
      role: 'user', content: `Extract any action items from this message:

"${message}"

Look for: "We need to...", "TODO:", "Action:", "Next step is...", "Someone should..."

Respond with JSON: { hasActionItem: boolean, task?: string, owner?: string }`,
    },
  ]);
  return JSON.parse(response);
}

export async function detectUnresolvedDiscussion(message: string): Promise<UnresolvedDiscussion> {
  const response = await callQwen([
    { role: 'system', content: 'You are Tracium, an AI Risk Intelligence Agent. You detect unresolved discussions.' },
    {
      role: 'user', content: `Does this message contain an unresolved discussion?

"${message}"

Signs: disagreement without resolution, open questions, "Let's discuss later", no clear conclusion.

Respond with JSON: { isUnresolved: boolean, topic?: string, participants?: string[] }`,
    },
  ]);
  return JSON.parse(response);
}

/**
 * Single Qwen call that extracts all four new memory entity types at once.
 * More efficient than four separate calls.
 */
export async function extractMemoryEntities(message: string): Promise<MemoryEntitiesExtraction> {
  const response = await callQwen([
    {
      role: 'system',
      content: `You are Tracium, an organizational memory system. You extract structured facts from team Slack messages so they can be stored and recalled later.`,
    },
    {
      role: 'user',
      content: `Extract all of the following from this message. Return empty arrays if nothing relevant is found.

Message: "${message}"

Extract:
1. deadlines — tasks with a due date or time constraint mentioned
2. blockers — anything blocking progress, waiting on someone, or preventing work
3. ownership — explicit ownership/responsibility assignments ("X owns Y", "X is responsible for Y", "X will handle Y")
4. launchDecisions — decisions specifically about launching, delaying a launch, or cancelling a release

Respond with JSON:
{
  "deadlines": [{ "task": string, "deadlineDate": string, "owner": string | null }],
  "blockers": [{ "description": string, "blockedBy": string | null, "owner": string | null }],
  "ownership": [{ "person": string, "item": string }],
  "launchDecisions": [{ "decision": string, "reason": string | null, "scheduledDate": string | null }]
}`,
    },
  ]);

  const parsed = JSON.parse(response);
  return {
    deadlines:       Array.isArray(parsed.deadlines)       ? parsed.deadlines       : [],
    blockers:        Array.isArray(parsed.blockers)        ? parsed.blockers        : [],
    ownership:       Array.isArray(parsed.ownership)       ? parsed.ownership       : [],
    launchDecisions: Array.isArray(parsed.launchDecisions) ? parsed.launchDecisions : [],
  };
}
