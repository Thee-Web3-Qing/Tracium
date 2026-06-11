-- Deadlines table
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task TEXT NOT NULL,
  deadline_date TEXT,
  owner TEXT,
  channel TEXT NOT NULL,
  raw_message TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockers table
CREATE TABLE IF NOT EXISTS blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  blocked_by TEXT,
  owner TEXT,
  status TEXT DEFAULT 'open',
  channel TEXT NOT NULL,
  raw_message TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ownership assignments table
CREATE TABLE IF NOT EXISTS ownership_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person TEXT NOT NULL,
  item TEXT NOT NULL,
  channel TEXT NOT NULL,
  raw_message TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Launch decisions table
CREATE TABLE IF NOT EXISTS launch_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision TEXT NOT NULL,
  reason TEXT,
  scheduled_date TEXT,
  channel TEXT NOT NULL,
  raw_message TEXT,
  slack_ts TEXT,
  slack_thread_ts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: deadlines
CREATE POLICY "select_deadlines" ON deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_deadlines" ON deadlines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_deadlines" ON deadlines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_deadlines" ON deadlines FOR DELETE TO authenticated USING (true);

-- RLS Policies: blockers
CREATE POLICY "select_blockers" ON blockers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_blockers" ON blockers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_blockers" ON blockers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_blockers" ON blockers FOR DELETE TO authenticated USING (true);

-- RLS Policies: ownership_assignments
CREATE POLICY "select_ownership_assignments" ON ownership_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_ownership_assignments" ON ownership_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_ownership_assignments" ON ownership_assignments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_ownership_assignments" ON ownership_assignments FOR DELETE TO authenticated USING (true);

-- RLS Policies: launch_decisions
CREATE POLICY "select_launch_decisions" ON launch_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_launch_decisions" ON launch_decisions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_launch_decisions" ON launch_decisions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_launch_decisions" ON launch_decisions FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_deadlines_channel ON deadlines(channel);
CREATE INDEX idx_deadlines_created_at ON deadlines(created_at DESC);
CREATE INDEX idx_blockers_channel ON blockers(channel);
CREATE INDEX idx_blockers_status ON blockers(status);
CREATE INDEX idx_blockers_created_at ON blockers(created_at DESC);
CREATE INDEX idx_ownership_channel ON ownership_assignments(channel);
CREATE INDEX idx_ownership_person ON ownership_assignments(person);
CREATE INDEX idx_ownership_created_at ON ownership_assignments(created_at DESC);
CREATE INDEX idx_launch_decisions_channel ON launch_decisions(channel);
CREATE INDEX idx_launch_decisions_created_at ON launch_decisions(created_at DESC);
