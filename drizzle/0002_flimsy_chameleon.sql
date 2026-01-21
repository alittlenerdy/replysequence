ALTER TABLE "transcripts" ADD COLUMN "vtt_content" text;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "fetch_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "last_fetch_error" text;--> statement-breakpoint
CREATE INDEX "transcripts_status_idx" ON "transcripts" USING btree ("status");