import { getSupabaseClient } from './supabase';
import type {
  RiskCategory,
  DecisionRecord,
  ActionItemRecord,
  RiskEventRecord
} from './types';

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

export async function getRecentRisks(
  channel?: string,
  limit = 50
): Promise<RiskEventRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('risk_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRecentDecisions(
  channel?: string,
  limit = 50
): Promise<DecisionRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('decisions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getActionItems(
  channel?: string,
  status?: string,
  limit = 50
): Promise<ActionItemRecord[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('action_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (channel) {
    query = query.eq('channel', channel);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateActionItemStatus(
  id: string,
  status: string
): Promise<ActionItemRecord> {
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
