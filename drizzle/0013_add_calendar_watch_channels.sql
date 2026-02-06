-- Add Calendar Watch Channels table
-- Tracks Google Calendar push notification subscriptions for Meet detection

CREATE TABLE IF NOT EXISTS "calendar_watch_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "channel_id" text UNIQUE NOT NULL,
  "resource_id" text NOT NULL,
  "calendar_id" text NOT NULL DEFAULT 'primary',
  "expiration" timestamp with time zone NOT NULL,
  "sync_token" text,
  "last_notification_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_watch_channels_user_id_idx" ON "calendar_watch_channels" ("user_id");
CREATE INDEX IF NOT EXISTS "calendar_watch_channels_channel_id_idx" ON "calendar_watch_channels" ("channel_id");
CREATE INDEX IF NOT EXISTS "calendar_watch_channels_expiration_idx" ON "calendar_watch_channels" ("expiration");
