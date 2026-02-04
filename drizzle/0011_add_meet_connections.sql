-- Migration: Add Meet Connections Table
-- Description: Stores OAuth tokens for Google Meet users (following Zoom/Teams pattern)

-- Create meet_connections table
CREATE TABLE IF NOT EXISTS "meet_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "google_user_id" varchar(255) NOT NULL,
  "google_email" varchar(255) NOT NULL,
  "google_display_name" varchar(255),
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "access_token_expires_at" timestamp with time zone NOT NULL,
  "scopes" text NOT NULL,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_refreshed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "meet_connections_user_id_idx" ON "meet_connections" ("user_id");
CREATE INDEX IF NOT EXISTS "meet_connections_google_user_id_idx" ON "meet_connections" ("google_user_id");
CREATE INDEX IF NOT EXISTS "meet_connections_expires_at_idx" ON "meet_connections" ("access_token_expires_at");
