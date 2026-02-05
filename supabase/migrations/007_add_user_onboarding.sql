-- Add user onboarding table for tracking onboarding progress
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 1,
  platform_connected VARCHAR(50),
  calendar_connected BOOLEAN NOT NULL DEFAULT false,
  draft_generated BOOLEAN NOT NULL DEFAULT false,
  email_preference VARCHAR(20) DEFAULT 'review',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS user_onboarding_clerk_id_idx ON user_onboarding(clerk_id);
CREATE INDEX IF NOT EXISTS user_onboarding_completed_at_idx ON user_onboarding(completed_at);

-- Add onboarding events table for analytics
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  step_number INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for events
CREATE INDEX IF NOT EXISTS onboarding_events_clerk_id_idx ON onboarding_events(clerk_id);
CREATE INDEX IF NOT EXISTS onboarding_events_event_type_idx ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS onboarding_events_created_at_idx ON onboarding_events(created_at);
