-- Shared recaps table: stores share tokens for public deal recap pages
CREATE TABLE IF NOT EXISTS "shared_recaps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "meeting_id" uuid NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "share_token" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for shared_recaps
CREATE UNIQUE INDEX IF NOT EXISTS "shared_recaps_share_token_idx" ON "shared_recaps" ("share_token");
CREATE INDEX IF NOT EXISTS "shared_recaps_meeting_id_idx" ON "shared_recaps" ("meeting_id");
CREATE INDEX IF NOT EXISTS "shared_recaps_user_id_idx" ON "shared_recaps" ("user_id");
