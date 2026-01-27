-- Add new columns to drafts table for quality scoring and generation tracking
-- Generation timing columns
ALTER TABLE "drafts" ADD COLUMN "generation_started_at" timestamp with time zone;
ALTER TABLE "drafts" ADD COLUMN "generation_completed_at" timestamp with time zone;
ALTER TABLE "drafts" ADD COLUMN "generation_duration_ms" integer;

-- Quality scoring
ALTER TABLE "drafts" ADD COLUMN "quality_score" integer;

-- Meeting context detection
ALTER TABLE "drafts" ADD COLUMN "meeting_type" text;
ALTER TABLE "drafts" ADD COLUMN "tone_used" text;

-- Extracted content (JSON)
ALTER TABLE "drafts" ADD COLUMN "action_items" jsonb;
ALTER TABLE "drafts" ADD COLUMN "key_points_referenced" jsonb;

-- Retry tracking
ALTER TABLE "drafts" ADD COLUMN "retry_count" integer;

-- Make subject and body NOT NULL with empty string default for existing rows
UPDATE "drafts" SET "subject" = '' WHERE "subject" IS NULL;
UPDATE "drafts" SET "body" = '' WHERE "body" IS NULL;
ALTER TABLE "drafts" ALTER COLUMN "subject" SET NOT NULL;
ALTER TABLE "drafts" ALTER COLUMN "body" SET NOT NULL;

-- Make model NOT NULL with default for existing rows
UPDATE "drafts" SET "model" = 'unknown' WHERE "model" IS NULL;
ALTER TABLE "drafts" ALTER COLUMN "model" SET NOT NULL;

-- Make status NOT NULL (already has default)
ALTER TABLE "drafts" ALTER COLUMN "status" SET NOT NULL;

-- Create indexes for new columns
CREATE INDEX "drafts_quality_score_idx" ON "drafts" USING btree ("quality_score");
CREATE INDEX "drafts_meeting_type_idx" ON "drafts" USING btree ("meeting_type");

-- Remove old columns that are no longer in schema (optional - keep for now for safety)
-- ALTER TABLE "drafts" DROP COLUMN "prompt_type";
-- ALTER TABLE "drafts" DROP COLUMN "full_response";
-- ALTER TABLE "drafts" DROP COLUMN "latency_ms";
-- ALTER TABLE "drafts" DROP COLUMN "updated_at";
