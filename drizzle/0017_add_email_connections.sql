-- Email connections table for sending emails via user's own Gmail or Outlook account
CREATE TABLE IF NOT EXISTS "email_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(20) NOT NULL,
  "email" varchar(255) NOT NULL,
  "display_name" varchar(255),
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "access_token_expires_at" timestamp with time zone NOT NULL,
  "scopes" text NOT NULL,
  "is_default" boolean NOT NULL DEFAULT true,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_refreshed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "email_connections_user_provider_idx" ON "email_connections" USING btree ("user_id", "provider");
CREATE INDEX IF NOT EXISTS "email_connections_user_id_idx" ON "email_connections" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "email_connections_provider_idx" ON "email_connections" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "email_connections_expires_at_idx" ON "email_connections" USING btree ("access_token_expires_at");
