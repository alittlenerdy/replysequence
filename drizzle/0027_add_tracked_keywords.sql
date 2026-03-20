-- Tracked keywords table: user-defined keywords/topics to monitor across meetings
CREATE TABLE IF NOT EXISTS "tracked_keywords" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "keyword" text NOT NULL,
  "category" varchar(20) NOT NULL DEFAULT 'custom',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Keyword mentions table: records where tracked keywords appear in transcripts
CREATE TABLE IF NOT EXISTS "keyword_mentions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "keyword_id" uuid NOT NULL REFERENCES "tracked_keywords"("id") ON DELETE CASCADE,
  "meeting_id" uuid NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "context" text NOT NULL,
  "timestamp" integer,
  "speaker_name" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for tracked_keywords
CREATE INDEX IF NOT EXISTS "tracked_keywords_user_id_idx" ON "tracked_keywords" ("user_id");
CREATE INDEX IF NOT EXISTS "tracked_keywords_category_idx" ON "tracked_keywords" ("category");
CREATE UNIQUE INDEX IF NOT EXISTS "tracked_keywords_user_keyword_idx" ON "tracked_keywords" ("user_id", "keyword");

-- Indexes for keyword_mentions
CREATE INDEX IF NOT EXISTS "keyword_mentions_keyword_id_idx" ON "keyword_mentions" ("keyword_id");
CREATE INDEX IF NOT EXISTS "keyword_mentions_meeting_id_idx" ON "keyword_mentions" ("meeting_id");
CREATE INDEX IF NOT EXISTS "keyword_mentions_created_at_idx" ON "keyword_mentions" ("created_at");
