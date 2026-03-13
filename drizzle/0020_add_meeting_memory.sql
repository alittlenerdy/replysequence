-- AI Meeting Memory tables
-- contact_memories: per-contact accumulated insights across meetings
-- meeting_memories: per-meeting extracted insights linked to contact

CREATE TABLE IF NOT EXISTS "contact_memories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "contact_email" varchar(255) NOT NULL,
  "contact_name" varchar(255),
  "company_name" varchar(500),
  "company_domain" varchar(255),
  "role" varchar(255),
  "topics" jsonb DEFAULT '[]',
  "preferences" jsonb DEFAULT '[]',
  "objections" jsonb DEFAULT '[]',
  "commitments" jsonb DEFAULT '[]',
  "personal_notes" jsonb DEFAULT '[]',
  "communication_style" text,
  "meeting_count" integer NOT NULL DEFAULT 0,
  "last_meeting_id" uuid REFERENCES "meetings"("id") ON DELETE SET NULL,
  "last_meeting_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "contact_memories_user_id_idx" ON "contact_memories" ("user_id");
CREATE INDEX IF NOT EXISTS "contact_memories_contact_email_idx" ON "contact_memories" ("contact_email");
CREATE INDEX IF NOT EXISTS "contact_memories_company_domain_idx" ON "contact_memories" ("company_domain");
CREATE INDEX IF NOT EXISTS "contact_memories_last_meeting_at_idx" ON "contact_memories" ("last_meeting_at");
CREATE UNIQUE INDEX IF NOT EXISTS "contact_memories_user_contact_idx" ON "contact_memories" ("user_id", "contact_email");

CREATE TABLE IF NOT EXISTS "meeting_memories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "meeting_id" uuid NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "contact_memory_id" uuid REFERENCES "contact_memories"("id") ON DELETE SET NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "summary" text NOT NULL,
  "key_insights" jsonb DEFAULT '[]',
  "topics_discussed" jsonb DEFAULT '[]',
  "objections_raised" jsonb DEFAULT '[]',
  "commitments_given" jsonb DEFAULT '[]',
  "questions_asked" jsonb DEFAULT '[]',
  "sentiment_trend" varchar(20),
  "contact_email" varchar(255),
  "contact_name" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "meeting_memories_meeting_id_idx" ON "meeting_memories" ("meeting_id");
CREATE INDEX IF NOT EXISTS "meeting_memories_contact_memory_id_idx" ON "meeting_memories" ("contact_memory_id");
CREATE INDEX IF NOT EXISTS "meeting_memories_user_id_idx" ON "meeting_memories" ("user_id");
CREATE INDEX IF NOT EXISTS "meeting_memories_contact_email_idx" ON "meeting_memories" ("contact_email");
CREATE INDEX IF NOT EXISTS "meeting_memories_created_at_idx" ON "meeting_memories" ("created_at");
