-- Migration: Add processing progress tracking fields to meetings table
-- This enables real-time progress UI for meeting processing

-- Processing step enum for type safety
DO $$ BEGIN
  CREATE TYPE processing_step_type AS ENUM (
    'webhook_received',
    'meeting_fetched',
    'meeting_created',
    'transcript_download',
    'transcript_parse',
    'transcript_stored',
    'draft_generation',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add processing progress columns to meetings table
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS processing_step TEXT,
ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
ADD COLUMN IF NOT EXISTS processing_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Add index for querying processing meetings
CREATE INDEX IF NOT EXISTS meetings_processing_step_idx ON meetings(processing_step);
CREATE INDEX IF NOT EXISTS meetings_processing_started_at_idx ON meetings(processing_started_at);

-- Comment for documentation
COMMENT ON COLUMN meetings.processing_step IS 'Current processing step (webhook_received, transcript_download, draft_generation, etc.)';
COMMENT ON COLUMN meetings.processing_progress IS 'Processing progress percentage (0-100)';
COMMENT ON COLUMN meetings.processing_logs IS 'Array of processing log entries [{timestamp, step, message, duration_ms}]';
COMMENT ON COLUMN meetings.processing_started_at IS 'When processing began';
COMMENT ON COLUMN meetings.processing_completed_at IS 'When processing finished (success or failure)';
COMMENT ON COLUMN meetings.processing_error IS 'Error message if processing failed';
