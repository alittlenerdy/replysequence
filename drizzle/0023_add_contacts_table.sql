-- Contacts table: persistent contact records created from meeting participants
CREATE TABLE IF NOT EXISTS "contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "name" varchar(255),
  "company" varchar(255),
  "title" varchar(255),
  "meeting_count" integer NOT NULL DEFAULT 0,
  "last_meeting_at" timestamp with time zone,
  "last_meeting_id" uuid REFERENCES "meetings"("id"),
  "emails_sent" integer NOT NULL DEFAULT 0,
  "last_emailed_at" timestamp with time zone,
  "notes" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "contacts_user_id_idx" ON "contacts" ("user_id");
CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_user_id_email_idx" ON "contacts" ("user_id", "email");
CREATE INDEX IF NOT EXISTS "contacts_last_meeting_at_idx" ON "contacts" ("last_meeting_at");
CREATE INDEX IF NOT EXISTS "contacts_company_idx" ON "contacts" ("company");
