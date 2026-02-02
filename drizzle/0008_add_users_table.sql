-- Add users table for tracking platform connections
-- Links Clerk users to their platform integrations

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_id" varchar(255) NOT NULL UNIQUE,
  "email" varchar(255) NOT NULL,
  "name" varchar(255),
  -- Platform connection status
  "zoom_connected" boolean NOT NULL DEFAULT false,
  "teams_connected" boolean NOT NULL DEFAULT false,
  "meet_connected" boolean NOT NULL DEFAULT false,
  -- OAuth tokens (encrypted in production)
  "zoom_access_token" text,
  "zoom_refresh_token" text,
  "teams_access_token" text,
  "teams_refresh_token" text,
  "meet_access_token" text,
  "meet_refresh_token" text,
  -- Timestamps
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "users_clerk_id_idx" ON "users" ("clerk_id");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");

-- RLS policies
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to users"
  ON "users"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
