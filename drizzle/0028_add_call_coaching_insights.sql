CREATE TABLE IF NOT EXISTS "call_coaching_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "meeting_id" uuid NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "talk_ratio" jsonb NOT NULL,
  "question_count" integer NOT NULL DEFAULT 0,
  "open_question_count" integer NOT NULL DEFAULT 0,
  "filler_word_count" integer NOT NULL DEFAULT 0,
  "longest_monologue" integer NOT NULL DEFAULT 0,
  "next_step_set" boolean NOT NULL DEFAULT false,
  "objection_handled" boolean NOT NULL DEFAULT false,
  "overall_score" integer NOT NULL DEFAULT 0,
  "suggestions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "call_coaching_meeting_id_idx" ON "call_coaching_insights" ("meeting_id");
CREATE INDEX IF NOT EXISTS "call_coaching_user_id_idx" ON "call_coaching_insights" ("user_id");
CREATE INDEX IF NOT EXISTS "call_coaching_created_at_idx" ON "call_coaching_insights" ("created_at");
