-- Agent Actions table: AI transparency feed
-- Records every top-level agent execution for user visibility

CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  agent_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  meeting_id UUID,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  duration_ms INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feed queries and meeting detail views
CREATE INDEX IF NOT EXISTS agent_actions_user_id_created_at_idx ON agent_actions (user_id, created_at);
CREATE INDEX IF NOT EXISTS agent_actions_meeting_id_idx ON agent_actions (meeting_id);
CREATE INDEX IF NOT EXISTS agent_actions_agent_name_idx ON agent_actions (agent_name);

-- RLS disabled for agent_actions (service-role writes only, read via API with user filter)
