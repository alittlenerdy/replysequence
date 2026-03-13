-- Add draft_type column to drafts table for multi-format document generation
-- Supports: email (default), proposal, recap, crm_notes, internal_summary
ALTER TABLE "drafts" ADD COLUMN "draft_type" text DEFAULT 'email';

-- Index for filtering by document type
CREATE INDEX IF NOT EXISTS "drafts_draft_type_idx" ON "drafts" ("draft_type");
