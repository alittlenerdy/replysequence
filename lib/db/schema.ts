import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Meeting status enum values
export type MeetingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Participant type for JSONB storage
export interface Participant {
  user_id?: string;
  user_name: string;
  email?: string;
}

// Speaker segment type for transcript JSONB storage
export interface SpeakerSegment {
  speaker: string;
  start_time: number; // milliseconds
  end_time: number; // milliseconds
  text: string;
}

// Meetings table
export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zoomMeetingId: varchar('zoom_meeting_id', { length: 255 }).notNull(),
    hostEmail: varchar('host_email', { length: 255 }).notNull(),
    topic: varchar('topic', { length: 500 }),
    startTime: timestamp('start_time', { withTimezone: true }),
    duration: integer('duration'), // in minutes
    participants: jsonb('participants').$type<Participant[]>().default([]),
    status: varchar('status', { length: 50 }).$type<MeetingStatus>().notNull().default('pending'),
    zoomEventId: varchar('zoom_event_id', { length: 255 }), // For idempotency tracking
    recordingDownloadUrl: text('recording_download_url'),
    transcriptDownloadUrl: text('transcript_download_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('meetings_zoom_meeting_id_idx').on(table.zoomMeetingId),
    index('meetings_host_email_idx').on(table.hostEmail),
    index('meetings_status_idx').on(table.status),
    index('meetings_created_at_idx').on(table.createdAt),
  ]
);

// Transcripts table
export const transcripts = pgTable(
  'transcripts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // Full transcript text
    speakerSegments: jsonb('speaker_segments').$type<SpeakerSegment[]>().default([]),
    source: varchar('source', { length: 50 }).notNull().default('zoom'), // 'zoom', 'manual', etc.
    language: varchar('language', { length: 10 }).default('en'),
    wordCount: integer('word_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transcripts_meeting_id_idx').on(table.meetingId),
    index('transcripts_source_idx').on(table.source),
  ]
);

// Type exports for use in application code
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
