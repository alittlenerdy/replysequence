-- Webhook Retry System Migration
-- Adds tables for tracking failed webhooks and dead letter queue

-- Webhook failures table - stores failed webhooks for retry
CREATE TABLE IF NOT EXISTS "webhook_failures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "platform" "meeting_platform" NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "error" text NOT NULL,
  "attempts" integer NOT NULL DEFAULT 1,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "next_retry_at" timestamp with time zone,
  "last_attempt_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Dead letter queue table - stores webhooks that exhausted all retries
CREATE TABLE IF NOT EXISTS "dead_letter_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "platform" "meeting_platform" NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "error" text NOT NULL,
  "total_attempts" integer NOT NULL,
  "failure_history" jsonb NOT NULL DEFAULT '[]',
  "alert_sent" boolean NOT NULL DEFAULT false,
  "resolved" boolean NOT NULL DEFAULT false,
  "resolved_at" timestamp with time zone,
  "resolution_notes" text,
  "webhook_failure_id" uuid REFERENCES "webhook_failures"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Indexes for webhook_failures
CREATE INDEX IF NOT EXISTS "webhook_failures_platform_idx" ON "webhook_failures" ("platform");
CREATE INDEX IF NOT EXISTS "webhook_failures_status_idx" ON "webhook_failures" ("status");
CREATE INDEX IF NOT EXISTS "webhook_failures_next_retry_at_idx" ON "webhook_failures" ("next_retry_at");
CREATE INDEX IF NOT EXISTS "webhook_failures_created_at_idx" ON "webhook_failures" ("created_at");

-- Indexes for dead_letter_queue
CREATE INDEX IF NOT EXISTS "dead_letter_queue_platform_idx" ON "dead_letter_queue" ("platform");
CREATE INDEX IF NOT EXISTS "dead_letter_queue_resolved_idx" ON "dead_letter_queue" ("resolved");
CREATE INDEX IF NOT EXISTS "dead_letter_queue_created_at_idx" ON "dead_letter_queue" ("created_at");
CREATE INDEX IF NOT EXISTS "dead_letter_queue_alert_sent_idx" ON "dead_letter_queue" ("alert_sent");

-- Add RLS policies (matching existing pattern from 0004)
ALTER TABLE "webhook_failures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dead_letter_queue" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to webhook_failures"
  ON "webhook_failures"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to dead_letter_queue"
  ON "dead_letter_queue"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
