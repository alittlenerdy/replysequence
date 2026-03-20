-- Add global AI pause toggle and notification preferences to users table
ALTER TABLE "users" ADD COLUMN "ai_paused" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "notification_prefs" jsonb;
