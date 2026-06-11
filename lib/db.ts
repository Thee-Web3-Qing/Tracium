import { getSupabaseClient } from './supabase';
import type {
  RiskCategory,
  DecisionRecord,
  ActionItemRecord,
  RiskEventRecord,
  DeadlineRecord,
  BlockerRecord,
  OwnershipRecord,
  LaunchDecisionRecord,
  MemorySearchResult,
} from './types';

// ── Risk events ──────────────────────────────────────────────────────────────

export async function saveRiskEvent(params: {
  channel: string;
  message: string;
  riskScore: number;
  category: RiskCategory;
  consequences: string;
  alternative: string;
  actionItem: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<RiskEventRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('risk_events')
    .insert({
      channel: params.channel,
      message: params.message,
      risk_score: params.riskScore,
      category: params.category,
      consequences: params.consequences,
      alternative: params.alternative,
      action_item: params.actionItem,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Decisions ────────────────────────────────────────────────────────────────

export async function saveDecision(params: {
  channel: string;
  decision: string;
  owner?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<DecisionRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      channel: params.channel,
      decision: params.decision,
      owner: params.owner || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentDecisions(channel?: string, limit = 50): Promise<DecisionRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('decisions').select('*').order('created_at', { ascending: false }).limit(limit);
  if (channel) query = query.eq('channel', channel);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Action items ─────────────────────────────────────────────────────────────

export async function saveActionItem(params: {
  channel: string;
  task: string;
  owner?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<ActionItemRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('action_items')
    .insert({
      channel: params.channel,
      task: params.task,
      owner: params.owner || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActionItems(channel?: string, status?: string, limit = 50): Promise<ActionItemRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('action_items').select('*').order('created_at', { ascending: false }).limit(limit);
  if (channel) query = query.eq('channel', channel);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateActionItemStatus(id: string, status: string): Promise<ActionItemRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('action_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Deadlines ────────────────────────────────────────────────────────────────

export async function saveDeadline(params: {
  task: string;
  deadlineDate?: string;
  owner?: string;
  channel: string;
  rawMessage?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<DeadlineRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('deadlines')
    .insert({
      task: params.task,
      deadline_date: params.deadlineDate || null,
      owner: params.owner || null,
      channel: params.channel,
      raw_message: params.rawMessage || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Blockers ─────────────────────────────────────────────────────────────────

export async function saveBlocker(params: {
  description: string;
  blockedBy?: string;
  owner?: string;
  channel: string;
  rawMessage?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<BlockerRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('blockers')
    .insert({
      description: params.description,
      blocked_by: params.blockedBy || null,
      owner: params.owner || null,
      status: 'open',
      channel: params.channel,
      raw_message: params.rawMessage || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Ownership assignments ────────────────────────────────────────────────────

export async function saveOwnership(params: {
  person: string;
  item: string;
  channel: string;
  rawMessage?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<OwnershipRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ownership_assignments')
    .insert({
      person: params.person,
      item: params.item,
      channel: params.channel,
      raw_message: params.rawMessage || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Launch decisions ─────────────────────────────────────────────────────────

export async function saveLaunchDecision(params: {
  decision: string;
  reason?: string;
  scheduledDate?: string;
  channel: string;
  rawMessage?: string;
  slackTs?: string;
  slackThreadTs?: string;
}): Promise<LaunchDecisionRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('launch_decisions')
    .insert({
      decision: params.decision,
      reason: params.reason || null,
      scheduled_date: params.scheduledDate || null,
      channel: params.channel,
      raw_message: params.rawMessage || null,
      slack_ts: params.slackTs,
      slack_thread_ts: params.slackThreadTs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Memory search ────────────────────────────────────────────────────────────

/**
 * Fetch recent records from all memory tables to answer an organizational
 * memory query. Returns a structured snapshot of what Tracium has observed.
 */
export async function searchMemory(limit = 50): Promise<MemorySearchResult> {
  const supabase = getSupabaseClient();

  const [
    decisionsRes,
    actionItemsRes,
    deadlinesRes,
    blockersRes,
    ownershipRes,
    launchRes,
  ] = await Promise.all([
    supabase.from('decisions').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('action_items').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('deadlines').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('blockers').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('ownership_assignments').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('launch_decisions').select('*').order('created_at', { ascending: false }).limit(limit),
  ]);

  // Surface errors as warnings but don't crash — return whatever we have
  if (decisionsRes.error)    console.error('[Tracium] searchMemory decisions error:', decisionsRes.error);
  if (actionItemsRes.error)  console.error('[Tracium] searchMemory action_items error:', actionItemsRes.error);
  if (deadlinesRes.error)    console.error('[Tracium] searchMemory deadlines error:', deadlinesRes.error);
  if (blockersRes.error)     console.error('[Tracium] searchMemory blockers error:', blockersRes.error);
  if (ownershipRes.error)    console.error('[Tracium] searchMemory ownership error:', ownershipRes.error);
  if (launchRes.error)       console.error('[Tracium] searchMemory launch_decisions error:', launchRes.error);

  const allRecords = [
    ...(decisionsRes.data ?? []),
    ...(actionItemsRes.data ?? []),
    ...(deadlinesRes.data ?? []),
    ...(blockersRes.data ?? []),
    ...(ownershipRes.data ?? []),
    ...(launchRes.data ?? []),
  ];

  const timestamps = allRecords
    .map((r) => r.created_at as string)
    .filter(Boolean)
    .sort();

  return {
    decisions:       (decisionsRes.data   ?? []) as DecisionRecord[],
    actionItems:     (actionItemsRes.data ?? []) as ActionItemRecord[],
    deadlines:       (deadlinesRes.data   ?? []) as DeadlineRecord[],
    blockers:        (blockersRes.data    ?? []) as BlockerRecord[],
    ownership:       (ownershipRes.data   ?? []) as OwnershipRecord[],
    launchDecisions: (launchRes.data      ?? []) as LaunchDecisionRecord[],
    earliestObservedAt: timestamps.length > 0 ? timestamps[0] : null,
  };
}

export async function getRecentRisks(channel?: string, limit = 50): Promise<RiskEventRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('risk_events').select('*').order('created_at', { ascending: false }).limit(limit);
  if (channel) query = query.eq('channel', channel);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
