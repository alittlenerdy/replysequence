import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
  decimal,
} from 'drizzle-orm/pg-core';

// Platform enum for multi-platform support
export const meetingPlatformEnum = pgEnum('meeting_platform', ['zoom', 'google_meet', 'microsoft_teams']);
export type MeetingPlatform = 'zoom' | 'google_meet' | 'microsoft_teams';

// Meeting status enum values
export type MeetingStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'failed';

// Transcript status enum values
export type TranscriptStatus = 'pending' | 'fetching' | 'ready' | 'failed';

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
    platform: meetingPlatformEnum('platform').notNull().default('zoom'),
    zoomMeetingId: varchar('zoom_meeting_id', { length: 255 }).notNull(), // Legacy: kept for backwards compatibility
    platformMeetingId: varchar('platform_meeting_id', { length: 255 }), // Generic external ID (Zoom UUID, Google Meet code, Teams ID)
    hostEmail: varchar('host_email', { length: 255 }).notNull(),
    topic: varchar('topic', { length: 500 }),
    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
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
    index('meetings_platform_idx').on(table.platform),
    index('meetings_platform_meeting_id_idx').on(table.platform, table.platformMeetingId),
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
    platform: meetingPlatformEnum('platform').notNull().default('zoom'),
    content: text('content').notNull(), // Full transcript text (parsed)
    vttContent: text('vtt_content'), // Raw VTT content from Zoom
    speakerSegments: jsonb('speaker_segments').$type<SpeakerSegment[]>().default([]),
    source: varchar('source', { length: 50 }).notNull().default('zoom'), // 'zoom', 'manual', etc.
    language: varchar('language', { length: 10 }).default('en'),
    wordCount: integer('word_count'),
    status: varchar('status', { length: 20 }).$type<TranscriptStatus>().notNull().default('pending'),
    fetchAttempts: integer('fetch_attempts').notNull().default(0),
    lastFetchError: text('last_fetch_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transcripts_meeting_id_idx').on(table.meetingId),
    index('transcripts_platform_idx').on(table.platform),
    index('transcripts_source_idx').on(table.source),
    index('transcripts_status_idx').on(table.status),
  ]
);

// Raw event status enum values
export type RawEventStatus = 'received' | 'processing' | 'processed' | 'failed';

// Raw events table - stores incoming webhook payloads for audit and reprocessing
export const rawEvents = pgTable(
  'raw_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    zoomEventId: varchar('zoom_event_id', { length: 255 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: text('status').notNull().default('pending'),
    // Extracted fields for quick access
    meetingId: varchar('meeting_id', { length: 255 }),
    endTime: timestamp('end_time', { withTimezone: true }),
    recordingAvailable: varchar('recording_available', { length: 10 }),
    transcriptAvailable: varchar('transcript_available', { length: 10 }),
    // Error tracking
    errorMessage: text('error_message'),
    // Timestamps
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('raw_events_zoom_event_id_idx').on(table.zoomEventId),
    index('raw_events_event_type_idx').on(table.eventType),
    index('raw_events_status_idx').on(table.status),
    index('raw_events_meeting_id_idx').on(table.meetingId),
    index('raw_events_received_at_idx').on(table.receivedAt),
  ]
);

// Draft status enum values
export type DraftStatus = 'pending' | 'generating' | 'generated' | 'sent' | 'failed';

// Meeting type for context-aware drafts
export type DetectedMeetingType = 'sales_call' | 'internal_sync' | 'client_review' | 'technical_discussion' | 'general';

// Tone type for drafts
export type DraftTone = 'formal' | 'casual' | 'neutral';

// Action item structure
export interface ActionItem {
  owner: string;
  task: string;
  deadline: string;
}

// Drafts table - stores AI-generated email drafts
export const drafts = pgTable(
  'drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    transcriptId: uuid('transcript_id')
      .notNull()
      .references(() => transcripts.id, { onDelete: 'cascade' }),
    // Generated content
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    // Status tracking
    status: text('status').$type<DraftStatus>().notNull(),
    // Model and cost tracking
    model: text('model').notNull(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    costUsd: decimal('cost_usd', { precision: 10, scale: 6 }),
    // Generation timing
    generationStartedAt: timestamp('generation_started_at', { withTimezone: true }),
    generationCompletedAt: timestamp('generation_completed_at', { withTimezone: true }),
    generationDurationMs: integer('generation_duration_ms'),
    // Quality scoring (0-100)
    qualityScore: integer('quality_score'),
    // Meeting context detection
    meetingType: text('meeting_type').$type<DetectedMeetingType>(),
    toneUsed: text('tone_used').$type<DraftTone>(),
    // Extracted action items (JSON array)
    actionItems: jsonb('action_items').$type<ActionItem[]>(),
    // Key points referenced from transcript
    keyPointsReferenced: jsonb('key_points_referenced').$type<string[]>(),
    // Error tracking
    errorMessage: text('error_message'),
    retryCount: integer('retry_count'),
    // Email sending tracking
    sentAt: timestamp('sent_at', { withTimezone: true }),
    sentTo: text('sent_to'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('drafts_meeting_id_idx').on(table.meetingId),
    index('drafts_transcript_id_idx').on(table.transcriptId),
    index('drafts_status_idx').on(table.status),
    index('drafts_created_at_idx').on(table.createdAt),
    index('drafts_quality_score_idx').on(table.qualityScore),
    index('drafts_meeting_type_idx').on(table.meetingType),
  ]
);

// App settings table - stores application-level settings
// Used for features like viral email signature toggle for paid users
export const appSettings = pgTable(
  'app_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Settings key (e.g., 'email_signature', 'default_tone')
    settingKey: varchar('setting_key', { length: 100 }).notNull().unique(),
    // Settings value stored as JSONB for flexibility
    settingValue: jsonb('setting_value').notNull(),
    // Optional: associate with a specific host email (for per-user settings)
    hostEmail: varchar('host_email', { length: 255 }),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('app_settings_key_host_idx').on(table.settingKey, table.hostEmail),
    index('app_settings_host_email_idx').on(table.hostEmail),
  ]
);

// Email signature settings type
export interface EmailSignatureSettings {
  includeSignature: boolean;
  customTagline?: string;
}

// Users table - tracks Clerk users and their platform connections
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    // Platform connection status
    zoomConnected: varchar('zoom_connected', { length: 10 }).notNull().default('false'),
    teamsConnected: varchar('teams_connected', { length: 10 }).notNull().default('false'),
    meetConnected: varchar('meet_connected', { length: 10 }).notNull().default('false'),
    // OAuth tokens (would be encrypted in production)
    zoomAccessToken: text('zoom_access_token'),
    zoomRefreshToken: text('zoom_refresh_token'),
    teamsAccessToken: text('teams_access_token'),
    teamsRefreshToken: text('teams_refresh_token'),
    meetAccessToken: text('meet_access_token'),
    meetRefreshToken: text('meet_refresh_token'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('users_clerk_id_idx').on(table.clerkId),
    index('users_email_idx').on(table.email),
    index('users_created_at_idx').on(table.createdAt),
  ]
);

// Zoom connections table - stores OAuth tokens for Zoom users
export const zoomConnections = pgTable(
  'zoom_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Zoom account info
    zoomUserId: varchar('zoom_user_id', { length: 255 }).notNull(),
    zoomEmail: varchar('zoom_email', { length: 255 }).notNull(),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(), // Space-separated list
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('zoom_connections_user_id_idx').on(table.userId),
    index('zoom_connections_zoom_user_id_idx').on(table.zoomUserId),
    index('zoom_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

// Webhook failure status enum values
export type WebhookFailureStatus = 'pending' | 'retrying' | 'completed' | 'dead_letter';

// Failure history entry for tracking retry attempts
export interface FailureHistoryEntry {
  attempt: number;
  error: string;
  timestamp: string;
}

// Webhook failures table - stores failed webhooks for retry
export const webhookFailures = pgTable(
  'webhook_failures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: meetingPlatformEnum('platform').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    error: text('error').notNull(),
    attempts: integer('attempts').notNull().default(1),
    maxAttempts: integer('max_attempts').notNull().default(3),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }).notNull().defaultNow(),
    status: varchar('status', { length: 20 }).$type<WebhookFailureStatus>().notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('webhook_failures_platform_idx').on(table.platform),
    index('webhook_failures_status_idx').on(table.status),
    index('webhook_failures_next_retry_at_idx').on(table.nextRetryAt),
    index('webhook_failures_created_at_idx').on(table.createdAt),
  ]
);

// Dead letter queue table - stores webhooks that exhausted all retries
export const deadLetterQueue = pgTable(
  'dead_letter_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: meetingPlatformEnum('platform').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    error: text('error').notNull(),
    totalAttempts: integer('total_attempts').notNull(),
    failureHistory: jsonb('failure_history').$type<FailureHistoryEntry[]>().notNull().default([]),
    alertSent: varchar('alert_sent', { length: 10 }).notNull().default('false'),
    resolved: varchar('resolved', { length: 10 }).notNull().default('false'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    webhookFailureId: uuid('webhook_failure_id').references(() => webhookFailures.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('dead_letter_queue_platform_idx').on(table.platform),
    index('dead_letter_queue_resolved_idx').on(table.resolved),
    index('dead_letter_queue_created_at_idx').on(table.createdAt),
    index('dead_letter_queue_alert_sent_idx').on(table.alertSent),
  ]
);

// Type exports for use in application code
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
export type RawEvent = typeof rawEvents.$inferSelect;
export type NewRawEvent = typeof rawEvents.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type WebhookFailure = typeof webhookFailures.$inferSelect;
export type NewWebhookFailure = typeof webhookFailures.$inferInsert;
export type DeadLetter = typeof deadLetterQueue.$inferSelect;
export type NewDeadLetter = typeof deadLetterQueue.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ZoomConnection = typeof zoomConnections.$inferSelect;
export type NewZoomConnection = typeof zoomConnections.$inferInsert;
