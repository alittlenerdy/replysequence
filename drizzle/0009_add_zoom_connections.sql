-- Migration: Add zoom_connections table for OAuth token storage
-- Date: 2026-02-03

CREATE TABLE IF NOT EXISTS "zoom_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "zoom_user_id" varchar(255) NOT NULL,
  "zoom_email" varchar(255) NOT NULL,
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "access_token_expires_at" timestamp with time zone NOT NULL,
  "scopes" text NOT NULL,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_refreshed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "zoom_connections_user_id_idx" ON "zoom_connections" ("user_id");
CREATE INDEX IF NOT EXISTS "zoom_connections_zoom_user_id_idx" ON "zoom_connections" ("zoom_user_id");
CREATE INDEX IF NOT EXISTS "zoom_connections_expires_at_idx" ON "zoom_connections" ("access_token_expires_at");
