export const RISK_CATEGORIES = [
  'product',
  'engineering',
  'marketing',
  'operational',
  'launch',
  'security',
  'reputational',
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
  reputational: [
    'public backlash',
    'brand damage',
    'pr crisis',
    'negative press',
    'customer trust',
    'reputation risk',
    'public perception',
    'media attention',
    'press release',
    'bad press',
  ],
};

export interface RiskAnalysis {
  riskScore: number;
  category: RiskCategory;
  consequences: string;
  alternative: string;
  actionItem: string;
  slackReply: string;
  isUnclearContext?: boolean;
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

// ── Memory entity extractions ────────────────────────────────────────────────

export interface ExtractedDeadline {
  task: string;
  deadlineDate: string;
  owner?: string;
}

export interface ExtractedBlocker {
  description: string;
  blockedBy?: string;
  owner?: string;
}

export interface ExtractedOwnership {
  person: string;
  item: string;
}

export interface ExtractedLaunchDecision {
  decision: string;
  reason?: string;
  scheduledDate?: string;
}

export interface MemoryEntitiesExtraction {
  deadlines: ExtractedDeadline[];
  blockers: ExtractedBlocker[];
  ownership: ExtractedOwnership[];
  launchDecisions: ExtractedLaunchDecision[];
}

// ── Database record types ────────────────────────────────────────────────────

export interface SlackEvent {
  type: string;
  event_id?: string;
  challenge?: string;
  token?: string;
  event?: {
    type: string;
    channel_type?: string;
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

export interface DeadlineRecord {
  id: string;
  task: string;
  deadline_date: string | null;
  owner: string | null;
  channel: string;
  raw_message: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

export interface BlockerRecord {
  id: string;
  description: string;
  blocked_by: string | null;
  owner: string | null;
  status: string;
  channel: string;
  raw_message: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

export interface OwnershipRecord {
  id: string;
  person: string;
  item: string;
  channel: string;
  raw_message: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

export interface LaunchDecisionRecord {
  id: string;
  decision: string;
  reason: string | null;
  scheduled_date: string | null;
  channel: string;
  raw_message: string | null;
  slack_ts: string | null;
  slack_thread_ts: string | null;
  created_at: string;
}

export interface MemorySearchResult {
  decisions: DecisionRecord[];
  actionItems: ActionItemRecord[];
  deadlines: DeadlineRecord[];
  blockers: BlockerRecord[];
  ownership: OwnershipRecord[];
  launchDecisions: LaunchDecisionRecord[];
  earliestObservedAt: string | null;
}

// Future integration types (prepared but not implemented)
export const INTEGRATION_TYPES = ['jira', 'github', 'gitlab', 'linear'] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export interface IntegrationConfig {
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, string>;
}
