-- Migration: Add quality scoring and meeting type detection fields
-- Date: 2025-01-26
-- Purpose: Support optimized draft generation with quality metrics

-- ============================================
-- Add new columns to drafts table
-- ============================================

-- Quality score (0-100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drafts' AND column_name = 'quality_score'
    ) THEN
        ALTER TABLE "drafts" ADD COLUMN "quality_score" integer;
    END IF;
END $$;

-- Meeting type detection
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drafts' AND column_name = 'meeting_type'
    ) THEN
        ALTER TABLE "drafts" ADD COLUMN "meeting_type" text;
    END IF;
END $$;

-- Tone used (formal/casual/neutral)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drafts' AND column_name = 'tone_used'
    ) THEN
        ALTER TABLE "drafts" ADD COLUMN "tone_used" text;
    END IF;
END $$;

-- Action items (JSON array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drafts' AND column_name = 'action_items'
    ) THEN
        ALTER TABLE "drafts" ADD COLUMN "action_items" jsonb;
    END IF;
END $$;

-- Key points referenced from transcript
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'drafts' AND column_name = 'key_points_referenced'
    ) THEN
        ALTER TABLE "drafts" ADD COLUMN "key_points_referenced" jsonb;
    END IF;
END $$;

-- ============================================
-- Add indexes for new columns
-- ============================================

CREATE INDEX IF NOT EXISTS "drafts_quality_score_idx" ON "drafts" ("quality_score");
CREATE INDEX IF NOT EXISTS "drafts_meeting_type_idx" ON "drafts" ("meeting_type");

-- ============================================
-- Verification queries
-- ============================================
-- Check columns:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'drafts'
--   ORDER BY ordinal_position;
--
-- Check indexes:
--   SELECT indexname FROM pg_indexes WHERE tablename = 'drafts';
