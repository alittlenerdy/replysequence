-- Migration: Disable RLS warnings and add platform_meeting_id
-- Date: 2025-01-26
-- Purpose:
--   1. Disable RLS on all tables (no auth yet, will re-enable with Clerk)
--   2. Add platform_meeting_id for multi-platform support (Zoom, Google Meet, Teams)

-- ============================================
-- STEP 1: Disable Row Level Security
-- ============================================

-- Drop existing permissive policies first
DROP POLICY IF EXISTS "service_role_all_meetings" ON "meetings";
DROP POLICY IF EXISTS "service_role_all_transcripts" ON "transcripts";
DROP POLICY IF EXISTS "service_role_all_drafts" ON "drafts";
DROP POLICY IF EXISTS "service_role_all_raw_events" ON "raw_events";

-- Disable RLS on all tables
ALTER TABLE "meetings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "transcripts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "drafts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "raw_events" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Add platform_meeting_id column
-- ============================================
-- This is a generic external ID field that can store:
-- - Zoom: meeting UUID (e.g., "abc123-def456")
-- - Google Meet: meeting code (e.g., "abc-defg-hij")
-- - Microsoft Teams: meeting ID

-- Add platform_meeting_id column to meetings (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'meetings' AND column_name = 'platform_meeting_id'
    ) THEN
        ALTER TABLE "meetings" ADD COLUMN "platform_meeting_id" varchar(255);
    END IF;
END $$;

-- Backfill platform_meeting_id from zoom_meeting_id for existing records
UPDATE "meetings"
SET "platform_meeting_id" = "zoom_meeting_id"
WHERE "platform_meeting_id" IS NULL AND "zoom_meeting_id" IS NOT NULL;

-- ============================================
-- STEP 3: Create indexes for platform queries
-- ============================================

-- Composite index for platform + platform_meeting_id lookups
CREATE INDEX IF NOT EXISTS "meetings_platform_meeting_id_idx"
ON "meetings" USING btree ("platform", "platform_meeting_id");

-- ============================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================
-- Check RLS status:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- Check platform_meeting_id column:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'meetings' AND column_name = 'platform_meeting_id';
--
-- Check indexes:
--   SELECT indexname FROM pg_indexes WHERE tablename = 'meetings';
