-- Migration: Add subscription management fields
-- Date: 2026-02-04
-- Purpose: Track Stripe subscriptions and usage for free tier limits

-- Add subscription fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Create usage tracking table for free tier limits
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'draft_generated', 'meeting_processed', 'email_sent'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Add documentation comments
COMMENT ON TABLE usage_logs IS 'Tracks user actions for free tier limits and analytics';
COMMENT ON COLUMN users.subscription_tier IS 'Values: free, pro, team';
COMMENT ON COLUMN users.subscription_status IS 'Stripe status: active, canceled, past_due, trialing, unpaid';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN usage_logs.action IS 'Action types: draft_generated, meeting_processed, email_sent';
