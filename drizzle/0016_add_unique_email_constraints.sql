-- Migration: Add unique constraints on connection email fields
-- Prevents duplicate platform accounts from being connected by multiple users
-- Date: 2026-02-16

-- Step 1: Deduplicate existing zoom connections (keep most recent per email)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY LOWER(zoom_email)
    ORDER BY created_at DESC
  ) as rn
  FROM zoom_connections
)
DELETE FROM zoom_connections WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Deduplicate existing teams connections
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY LOWER(ms_email)
    ORDER BY created_at DESC
  ) as rn
  FROM teams_connections
)
DELETE FROM teams_connections WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Deduplicate existing meet connections
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY LOWER(google_email)
    ORDER BY created_at DESC
  ) as rn
  FROM meet_connections
)
DELETE FROM meet_connections WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 4: Add unique indexes on LOWER(email) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "zoom_connections_zoom_email_unique_idx"
  ON "zoom_connections" (LOWER("zoom_email"));

CREATE UNIQUE INDEX IF NOT EXISTS "teams_connections_ms_email_unique_idx"
  ON "teams_connections" (LOWER("ms_email"));

CREATE UNIQUE INDEX IF NOT EXISTS "meet_connections_google_email_unique_idx"
  ON "meet_connections" (LOWER("google_email"));
