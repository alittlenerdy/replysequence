-- Migration: Sync schema to add missing columns
-- Run this script in your Supabase SQL editor or via psql
-- This fixes the draft insert error and adds multi-tenant user_id

-- ============================================
-- 1. MEETINGS TABLE - Add user_id column
-- ============================================

-- Add the user_id column for multi-tenant filtering
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON meetings(user_id);

-- Backfill: Link existing meetings to users by matching host_email to user email
UPDATE meetings m
SET user_id = u.id
FROM users u
WHERE m.user_id IS NULL
  AND m.host_email = u.email;

-- Also try matching via zoom_connections
UPDATE meetings m
SET user_id = zc.user_id
FROM zoom_connections zc
WHERE m.user_id IS NULL
  AND m.platform = 'zoom'
  AND m.host_email = zc.zoom_email;

-- Also try matching via meet_connections
UPDATE meetings m
SET user_id = mc.user_id
FROM meet_connections mc
WHERE m.user_id IS NULL
  AND m.platform = 'google_meet'
  AND m.host_email = mc.google_email;

-- ============================================
-- 2. DRAFTS TABLE - Add missing email tracking columns
-- ============================================

-- Add tracking_id column (UUID for tracking pixel/links)
ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS tracking_id UUID DEFAULT gen_random_uuid();

-- Add email open tracking columns
ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;

ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE;

-- Add email click tracking columns
ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Add reply tracking column
ALTER TABLE drafts
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Create index for tracking_id lookups
CREATE INDEX IF NOT EXISTS drafts_tracking_id_idx ON drafts(tracking_id);

-- Create index for sent_at queries
CREATE INDEX IF NOT EXISTS drafts_sent_at_idx ON drafts(sent_at);

-- ============================================
-- 3. VERIFICATION - Show column status
-- ============================================

-- Check meetings table columns
SELECT 'MEETINGS TABLE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meetings'
  AND column_name IN ('user_id', 'platform_meeting_id')
ORDER BY column_name;

-- Check drafts table columns
SELECT 'DRAFTS TABLE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drafts'
  AND column_name IN ('tracking_id', 'open_count', 'click_count', 'replied_at')
ORDER BY column_name;

-- Show meetings linked status
SELECT 'MEETINGS LINKED STATUS:' as info;
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked_meetings,
  COUNT(*) FILTER (WHERE user_id IS NULL) as unlinked_meetings,
  COUNT(*) as total_meetings
FROM meetings;
