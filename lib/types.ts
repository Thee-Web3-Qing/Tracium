export const RISK_CATEGORIES = [
  'product',
  'engineering',
  'marketing',
  'operational',
  'launch',
  'security',
] as const;

export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_KEYWORDS: Record<RiskCategory, string[]> = {
  product: [
    'skip user research',
    'no user testing',
    'ignore feedback',
    'launch anyway',
    'remove validation',
  ],
  engineering: [
    'disable',
    'bypass',
    'skip tests',
    'no tests',
    'skip review',
    'hack',
    'workaround',
    'technical debt',
    'quick fix',
    'temporary solution',
  ],
  marketing: [
    'oversell',
    'exaggerate',
    'fake reviews',
    'mislead',
    'hide limitations',
  ],
  operational: [
    'ignore alert',
    'skip process',
    'bypass approval',
    'no documentation',
    'manual only',
  ],
  launch: [
    'launch anyway',
    'skip staging',
    'no rollback',
    'force deploy',
    'hotfix production',
    'release without',
  ],
  security: [
    'disable auth',
    'skip security',
    'open access',
    'no encryption',
    'hardcode password',
    'disable firewall',
    'ignore vulnerability',
  ],
};

export interface RiskAnalysis {
  riskScore: number;
  category: RiskCategory;
  consequences: string;
  alternative: string;
  actionItem: string;
}

export interface DecisionExtraction {
  hasDecision: boolean;
  decision?: string;
  owner?: string;
}

export interface ActionItemExtraction {
  hasActionItem: boolean;
  task?: string;
  owner?: string;
}

export interface UnresolvedDiscussion {
  isUnresolved: boolean;
  topic?: string;
  participants?: string[];
}

export interface SlackEvent {
  type: string;
  challenge?: string;
  token?: string;
  event?: {
    type: string;
    user?: string;
    text?: string;
    ts?: string;
    channel?: string;
    thread_ts?: string;
    bot_id?: string;
    subtype?: string;
  };
}

export interface DecisionRecord {
  id: string;
  channel: string;
  decision: string;
  owner: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

export interface ActionItemRecord {
  id: string;
  channel: string;
  task: string;
  owner: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RiskEventRecord {
  id: string;
  channel: string;
  message: string;
  risk_score: number;
  category: string;
  consequences: string | null;
  alternative: string | null;
  action_item: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

// Future integration types (prepared but not implemented)
export const INTEGRATION_TYPES = ['jira', 'github', 'gitlab', 'linear'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export interface IntegrationConfig {
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, string>;
}
