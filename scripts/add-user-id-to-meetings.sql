-- Migration: Add user_id column to meetings table for multi-tenant filtering
-- Run this script in your Supabase SQL editor or via psql

-- Add the user_id column (nullable to avoid breaking existing data)
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

-- Report: Show how many meetings were linked
SELECT
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as linked_meetings,
  COUNT(*) FILTER (WHERE user_id IS NULL) as unlinked_meetings,
  COUNT(*) as total_meetings
FROM meetings;
