CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zoom_meeting_id" varchar(255) NOT NULL,
	"host_email" varchar(255) NOT NULL,
	"topic" varchar(500),
	"start_time" timestamp with time zone,
	"duration" integer,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"zoom_event_id" varchar(255),
	"recording_download_url" text,
	"transcript_download_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"zoom_event_id" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'received' NOT NULL,
	"meeting_id" varchar(255),
	"end_time" timestamp with time zone,
	"recording_available" varchar(10),
	"transcript_available" varchar(10),
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"content" text NOT NULL,
	"speaker_segments" jsonb DEFAULT '[]'::jsonb,
	"source" varchar(50) DEFAULT 'zoom' NOT NULL,
	"language" varchar(10) DEFAULT 'en',
	"word_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_zoom_meeting_id_idx" ON "meetings" USING btree ("zoom_meeting_id");--> statement-breakpoint
CREATE INDEX "meetings_host_email_idx" ON "meetings" USING btree ("host_email");--> statement-breakpoint
CREATE INDEX "meetings_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meetings_created_at_idx" ON "meetings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_events_zoom_event_id_idx" ON "raw_events" USING btree ("zoom_event_id");--> statement-breakpoint
CREATE INDEX "raw_events_event_type_idx" ON "raw_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "raw_events_status_idx" ON "raw_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "raw_events_meeting_id_idx" ON "raw_events" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "raw_events_received_at_idx" ON "raw_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "transcripts_meeting_id_idx" ON "transcripts" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "transcripts_source_idx" ON "transcripts" USING btree ("source");