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

export async function analyzeRisk(message: string): Promise<RiskAnalysis> {
  const systemPrompt = `You are Tracium, an AI Risk Intelligence Agent. You analyze team messages to identify risks in software development and operations.

Your role is NOT to be a chatbot. You are a monitoring agent that identifies risks in these categories:
- product: Risks related to product decisions, user experience, market fit
- engineering: Technical risks, code quality, architecture concerns
- marketing: Marketing claims, messaging integrity, competitive risks
- operational: Process risks, team coordination, operational efficiency
- launch: Release risks, deployment concerns, go-to-market risks
- security: Security vulnerabilities, access control, data protection

Analyze messages objectively and provide actionable insights.`;

  const userPrompt = `Analyze this message for risks:

"${message}"

Respond with a JSON object containing:
- riskScore: A number from 1 to 10 (1 = minimal risk, 10 = critical risk)
- category: One of "product", "engineering", "marketing", "operational", "launch", "security"
- consequences: A brief description of what could go wrong (1-2 sentences)
- alternative: A safer alternative approach (1-2 sentences)
- actionItem: One specific action the team should take before proceeding (1 sentence)

Only respond with valid JSON.`;

  const response = await callQwen([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const analysis = JSON.parse(response);

  // Validate and normalize the response
  return {
    riskScore: Math.min(10, Math.max(1, Number(analysis.riskScore) || 5)),
    category: analysis.category as RiskCategory || 'engineering',
    consequences: analysis.consequences || 'Potential issues may arise',
    alternative: analysis.alternative || 'Consider reviewing the approach',
    actionItem: analysis.actionItem || 'Review with team before proceeding',
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
