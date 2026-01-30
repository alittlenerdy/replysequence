-- Add app_settings table for application-level configuration
-- Used for features like viral email signature toggle for paid users

CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "setting_key" varchar(100) NOT NULL UNIQUE,
  "setting_value" jsonb NOT NULL,
  "host_email" varchar(255),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX "app_settings_key_host_idx" ON "app_settings" USING btree ("setting_key", "host_email");
CREATE INDEX "app_settings_host_email_idx" ON "app_settings" USING btree ("host_email");

-- Insert default email signature setting (enabled by default)
INSERT INTO "app_settings" ("setting_key", "setting_value")
VALUES ('email_signature_default', '{"includeSignature": true}')
ON CONFLICT ("setting_key") DO NOTHING;
