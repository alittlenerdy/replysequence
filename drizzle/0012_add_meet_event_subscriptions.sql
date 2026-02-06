-- Add Meet Event Subscriptions table
-- Tracks Google Workspace Events API subscriptions for receiving Meet events

CREATE TABLE IF NOT EXISTS "meet_event_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subscription_name" text NOT NULL,
  "target_resource" text NOT NULL,
  "event_types" jsonb NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "expire_time" timestamp with time zone NOT NULL,
  "last_renewed_at" timestamp with time zone,
  "renewal_failures" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "meet_event_subscriptions_user_id_idx" ON "meet_event_subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "meet_event_subscriptions_status_idx" ON "meet_event_subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "meet_event_subscriptions_expire_time_idx" ON "meet_event_subscriptions" ("expire_time");
CREATE INDEX IF NOT EXISTS "meet_event_subscriptions_subscription_name_idx" ON "meet_event_subscriptions" ("subscription_name");
