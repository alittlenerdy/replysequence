-- Add enrichment fields to contacts table for Clearbit integration
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "linkedin_url" varchar(500);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "enriched_at" timestamp with time zone;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "enrichment_source" varchar(50);
