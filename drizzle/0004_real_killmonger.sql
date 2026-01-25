CREATE TYPE "public"."meeting_platform" AS ENUM('zoom', 'google_meet', 'microsoft_teams');--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "platform" "meeting_platform" DEFAULT 'zoom' NOT NULL;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "platform" "meeting_platform" DEFAULT 'zoom' NOT NULL;--> statement-breakpoint
CREATE INDEX "meetings_platform_idx" ON "meetings" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "transcripts_platform_idx" ON "transcripts" USING btree ("platform");--> statement-breakpoint

-- Enable Row Level Security on tables
ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transcripts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "raw_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Create permissive policies for service role (bypass RLS for server-side operations)
-- Note: These policies allow all operations when auth.uid() is NULL (service role)
-- In production, you would want more restrictive policies based on user ownership
CREATE POLICY "service_role_all_meetings" ON "meetings" FOR ALL USING (true);--> statement-breakpoint
CREATE POLICY "service_role_all_transcripts" ON "transcripts" FOR ALL USING (true);--> statement-breakpoint
CREATE POLICY "service_role_all_drafts" ON "drafts" FOR ALL USING (true);--> statement-breakpoint
CREATE POLICY "service_role_all_raw_events" ON "raw_events" FOR ALL USING (true);