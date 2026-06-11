-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  decision TEXT NOT NULL,
  owner TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Events table
CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  risk_score DECIMAL(3,1) NOT NULL,
  category TEXT NOT NULL,
  consequences TEXT,
  alternative TEXT,
  action_item TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decisions
CREATE POLICY "select_decisions" ON decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_decisions" ON decisions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_decisions" ON decisions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_decisions" ON decisions FOR DELETE TO authenticated USING (true);

-- RLS Policies for action_items
CREATE POLICY "select_action_items" ON action_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_action_items" ON action_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_action_items" ON action_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_action_items" ON action_items FOR DELETE TO authenticated USING (true);

-- RLS Policies for risk_events
CREATE POLICY "select_risk_events" ON risk_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_risk_events" ON risk_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_risk_events" ON risk_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_risk_events" ON risk_events FOR DELETE TO authenticated USING (true);

-- Indexes for better query performance
CREATE INDEX idx_decisions_channel ON decisions(channel);
CREATE INDEX idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX idx_action_items_channel ON action_items(channel);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_created_at ON action_items(created_at DESC);
CREATE INDEX idx_risk_events_channel ON risk_events(channel);
CREATE INDEX idx_risk_events_category ON risk_events(category);
CREATE INDEX idx_risk_events_created_at ON risk_events(created_at DESC);
