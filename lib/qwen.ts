import type { RiskAnalysis, RiskCategory, DecisionExtraction, ActionItemExtraction, UnresolvedDiscussion } from './types';

const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-plus';
const QWEN_API_KEY = process.env.QWEN_API_KEY;

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function callQwen(messages: QwenMessage[]): Promise<string> {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY environment variable is required');
  }

  const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${error}`);
  }

  const data: QwenResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Qwen');
  }

  return content;
}

/**
 * Analyze a message for risk. Optionally accepts conversation context
 * (recent channel messages) to ground the analysis in the full discussion.
 */
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
- "Worth flagging: if we bypass the security review here and something goes wrong, we own that. Thirty minutes with the security team now saves days of cleanup later."
- "I'd pump the brakes on this one. Skipping staging means we're essentially testing in production. What's the actual deadline pressure?"`;

  const contextBlock = context && context.length > 0
    ? `Recent conversation context (oldest → newest):\n${context.map((m, i) => `[${i + 1}] ${m}`).join('\n')}\n\n`
    : '';

  const userPrompt = `${contextBlock}Read this team message and assess whether it contains a real business risk worth raising:

"${message}"

Respond with a JSON object:
- riskScore: a number from 1 to 10 (used internally for storage only, not shown to users — be honest here)
- category: one of "product", "engineering", "marketing", "operational", "launch", "security", "reputational"
- consequences: a brief internal note on what could go wrong (1-2 sentences, not shown to users)
- alternative: a brief internal note on a safer approach (1-2 sentences, not shown to users)
- actionItem: one specific internal action item (1 sentence, not shown to users)
- slackReply: your actual conversational response to post in Slack — human, direct, practical, no scores or categories. If isUnclearContext is true, use the exact fallback phrase specified.
- isUnclearContext: true if the message is too vague, low-stakes, or you cannot identify a real risk; false otherwise

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const analysis = JSON.parse(response);

  return {
    riskScore: Math.min(10, Math.max(1, Number(analysis.riskScore) || 5)),
    category: analysis.category as RiskCategory || 'engineering',
    consequences: analysis.consequences || 'Potential issues may arise',
    alternative: analysis.alternative || 'Consider reviewing the approach',
    actionItem: analysis.actionItem || 'Review with team before proceeding',
    slackReply: analysis.slackReply || 'Worth a quick team review before proceeding.',
    isUnclearContext: !!analysis.isUnclearContext,
  };
}

export async function extractDecision(message: string): Promise<DecisionExtraction> {
  const systemPrompt = `You are Tracium, an AI Risk Intelligence Agent. You analyze team messages to extract decisions that have been made.`;

  const userPrompt = `Analyze this message and extract any decisions that were made:

"${message}"

A decision is a conclusion or resolution reached after consideration. Look for phrases like:
- "We decided to..."
- "The decision is..."
- "We're going with..."
- "Agreed on..."

Respond with a JSON object containing:
- hasDecision: true if a decision was made, false otherwise
- decision: The decision that was made (if any)
- owner: The person responsible (if mentioned)

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return JSON.parse(response);
}

export async function extractActionItem(message: string): Promise<ActionItemExtraction> {
  const systemPrompt = `You are Tracium, an AI Risk Intelligence Agent. You analyze team messages to extract action items and tasks.`;

  const userPrompt = `Analyze this message and extract any action items or tasks:

"${message}"

An action item is something that needs to be done. Look for phrases like:
- "We need to..."
- "TODO:"
- "Action:"
- "Next step is..."
- "Someone should..."

Respond with a JSON object containing:
- hasActionItem: true if an action item exists, false otherwise
- task: The action item or task description (if any)
- owner: The person responsible (if mentioned)

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return JSON.parse(response);
}

export async function detectUnresolvedDiscussion(message: string): Promise<UnresolvedDiscussion> {
  const systemPrompt = `You are Tracium, an AI Risk Intelligence Agent. You detect unresolved discussions that need follow-up.`;

  const userPrompt = `Analyze this message and detect if there's an unresolved discussion:

"${message}"

An unresolved discussion shows:
- Disagreement without resolution
- Open questions
- "Let's discuss later"
- No clear conclusion
- Multiple viewpoints still being debated

Respond with a JSON object containing:
- isUnresolved: true if the discussion seems unresolved, false otherwise
- topic: The topic being discussed (if unresolved)
- participants: Array of mentioned participants (if any)

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return JSON.parse(response);
}
