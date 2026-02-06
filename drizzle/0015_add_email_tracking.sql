-- Migration: Add Email Engagement Tracking Fields
-- Description: Adds tracking fields to drafts table for opens, clicks, and replies

-- Add tracking fields to drafts table
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "tracking_id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "opened_at" timestamp with time zone;
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "open_count" integer DEFAULT 0;
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "last_opened_at" timestamp with time zone;
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "clicked_at" timestamp with time zone;
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "click_count" integer DEFAULT 0;
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "replied_at" timestamp with time zone;

-- Create indexes for tracking queries
CREATE INDEX IF NOT EXISTS "drafts_tracking_id_idx" ON "drafts" ("tracking_id");
CREATE INDEX IF NOT EXISTS "drafts_sent_at_idx" ON "drafts" ("sent_at");
