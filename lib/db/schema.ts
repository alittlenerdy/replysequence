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
  boolean,
} from 'drizzle-orm/pg-core';

// Platform enum for multi-platform support
export const meetingPlatformEnum = pgEnum('meeting_platform', ['zoom', 'google_meet', 'microsoft_teams']);
export type MeetingPlatform = 'zoom' | 'google_meet' | 'microsoft_teams';

// Meeting status enum values
export type MeetingStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'failed';

// Processing step enum values for live progress tracking
export type ProcessingStep =
  | 'webhook_received'
  | 'meeting_fetched'
  | 'meeting_created'
  | 'transcript_download'
  | 'transcript_parse'
  | 'transcript_stored'
  | 'draft_generation'
  | 'completed'
  | 'failed';

// Processing log entry type
export interface ProcessingLogEntry {
  timestamp: string;
  step: ProcessingStep;
  message: string;
  duration_ms?: number;
}

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

// Meeting summary types
export interface MeetingDecision {
  decision: string;
  context?: string;
}

export interface MeetingTopic {
  topic: string;
  duration?: string; // e.g., "discussed briefly", "main focus"
}

// Sentiment analysis types
export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';
export type SentimentTrend = 'improving' | 'stable' | 'declining';

export interface SpeakerSentiment {
  name: string;
  score: number;        // -1.0 to 1.0
  label: SentimentLabel;
  tones: string[];
}

export interface MeetingSentiment {
  overall: {
    score: number;        // -1.0 to 1.0
    label: SentimentLabel;
    trend: SentimentTrend;
    tones: string[];
  };
  speakers: SpeakerSentiment[];
}

// Meetings table
export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Link to user for multi-tenant filtering
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
    // Meeting summary fields (generated alongside draft)
    summary: text('summary'),
    keyDecisions: jsonb('key_decisions').$type<MeetingDecision[]>(),
    keyTopics: jsonb('key_topics').$type<MeetingTopic[]>(),
    actionItems: jsonb('action_items').$type<ActionItem[]>(),
    summaryGeneratedAt: timestamp('summary_generated_at', { withTimezone: true }),
    // Sentiment analysis fields (populated async by Haiku)
    sentimentAnalysis: jsonb('sentiment_analysis').$type<MeetingSentiment>(),
    sentimentAnalyzedAt: timestamp('sentiment_analyzed_at', { withTimezone: true }),
    // Processing progress tracking fields
    processingStep: text('processing_step').$type<ProcessingStep>(),
    processingProgress: integer('processing_progress').default(0),
    processingLogs: jsonb('processing_logs').$type<ProcessingLogEntry[]>().default([]),
    processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
    processingCompletedAt: timestamp('processing_completed_at', { withTimezone: true }),
    processingError: text('processing_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('meetings_zoom_meeting_id_idx').on(table.zoomMeetingId),
    index('meetings_user_id_idx').on(table.userId),
    index('meetings_host_email_idx').on(table.hostEmail),
    index('meetings_status_idx').on(table.status),
    index('meetings_platform_idx').on(table.platform),
    index('meetings_platform_meeting_id_idx').on(table.platform, table.platformMeetingId),
    index('meetings_created_at_idx').on(table.createdAt),
    index('meetings_processing_step_idx').on(table.processingStep),
    index('meetings_processing_started_at_idx').on(table.processingStartedAt),
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
    // Quality scoring (0-100) - heuristic-based
    qualityScore: integer('quality_score'),
    // AI Grading scores (0-100 each) - Claude Haiku based
    toneScore: integer('tone_score'),
    completenessScore: integer('completeness_score'),
    personalizationScore: integer('personalization_score'),
    accuracyScore: integer('accuracy_score'),
    gradingNotes: text('grading_notes'),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
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
    // Email engagement tracking
    trackingId: uuid('tracking_id').defaultRandom(), // Unique ID for tracking pixel/links
    openedAt: timestamp('opened_at', { withTimezone: true }), // First open time
    openCount: integer('open_count').default(0), // Total opens
    lastOpenedAt: timestamp('last_opened_at', { withTimezone: true }), // Most recent open
    clickedAt: timestamp('clicked_at', { withTimezone: true }), // First click time
    clickCount: integer('click_count').default(0), // Total link clicks
    repliedAt: timestamp('replied_at', { withTimezone: true }), // When recipient replied
    // User feedback on draft quality
    userRating: varchar('user_rating', { length: 10 }).$type<'up' | 'down'>(), // thumbs up/down
    userFeedback: text('user_feedback'), // optional text feedback
    feedbackAt: timestamp('feedback_at', { withTimezone: true }),
    // Conversational refinement tracking
    refinementCount: integer('refinement_count').default(0),
    lastRefinedAt: timestamp('last_refined_at', { withTimezone: true }),
    lastRefinementInstruction: text('last_refinement_instruction'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('drafts_meeting_id_idx').on(table.meetingId),
    index('drafts_transcript_id_idx').on(table.transcriptId),
    index('drafts_status_idx').on(table.status),
    index('drafts_created_at_idx').on(table.createdAt),
    index('drafts_quality_score_idx').on(table.qualityScore),
    index('drafts_meeting_type_idx').on(table.meetingType),
    index('drafts_tracking_id_idx').on(table.trackingId),
    index('drafts_sent_at_idx').on(table.sentAt),
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

// Subscription tier type
export type SubscriptionTier = 'free' | 'pro' | 'team' | 'agency';

// Subscription status from Stripe
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';

// Users table - tracks Clerk users and their platform connections
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    // Platform connection status (boolean in database)
    zoomConnected: boolean('zoom_connected').notNull().default(false),
    teamsConnected: boolean('teams_connected').notNull().default(false),
    meetConnected: boolean('meet_connected').notNull().default(false),
    // OAuth tokens (would be encrypted in production)
    zoomAccessToken: text('zoom_access_token'),
    zoomRefreshToken: text('zoom_refresh_token'),
    teamsAccessToken: text('teams_access_token'),
    teamsRefreshToken: text('teams_refresh_token'),
    meetAccessToken: text('meet_access_token'),
    meetRefreshToken: text('meet_refresh_token'),
    // Subscription fields
    subscriptionTier: text('subscription_tier').$type<SubscriptionTier>().default('free'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    subscriptionStatus: text('subscription_status').$type<SubscriptionStatus>(),
    subscriptionEndDate: timestamp('subscription_end_date', { withTimezone: true }),
    // AI draft preferences
    aiTone: text('ai_tone').$type<'professional' | 'casual' | 'friendly' | 'concise'>().default('professional'),
    aiCustomInstructions: text('ai_custom_instructions'), // User's custom prompt additions
    aiSignature: text('ai_signature'), // Email signature to append
    // ROI calculation preferences
    hourlyRate: integer('hourly_rate').default(100), // User's hourly rate for ROI calcs (default $100/hr)
    // User role for AI personalization
    userRole: text('user_role').$type<'founder' | 'ae' | 'csm' | 'consultant' | 'other'>(),
    // AI onboarding completion tracking
    aiOnboardingComplete: boolean('ai_onboarding_complete').notNull().default(false),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('users_clerk_id_idx').on(table.clerkId),
    index('users_email_idx').on(table.email),
    index('users_created_at_idx').on(table.createdAt),
    index('users_stripe_customer_id_idx').on(table.stripeCustomerId),
    index('users_subscription_tier_idx').on(table.subscriptionTier),
  ]
);

// Usage action types
export type UsageAction = 'draft_generated' | 'meeting_processed' | 'email_sent';

// Usage logs table - tracks user actions for free tier limits
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').$type<UsageAction>().notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('usage_logs_user_id_idx').on(table.userId),
    index('usage_logs_created_at_idx').on(table.createdAt),
    index('usage_logs_action_idx').on(table.action),
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

// Teams connections table - stores OAuth tokens for Microsoft Teams users
export const teamsConnections = pgTable(
  'teams_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Microsoft account info
    msUserId: varchar('ms_user_id', { length: 255 }).notNull(),
    msEmail: varchar('ms_email', { length: 255 }).notNull(),
    msDisplayName: varchar('ms_display_name', { length: 255 }),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(), // Space-separated list
    // Graph API subscription for webhook notifications
    graphSubscriptionId: varchar('graph_subscription_id', { length: 255 }),
    graphSubscriptionExpiresAt: timestamp('graph_subscription_expires_at', { withTimezone: true }),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('teams_connections_user_id_idx').on(table.userId),
    index('teams_connections_ms_user_id_idx').on(table.msUserId),
    index('teams_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

// Meet connections table - stores OAuth tokens for Google Meet users
export const meetConnections = pgTable(
  'meet_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Google account info
    googleUserId: varchar('google_user_id', { length: 255 }).notNull(),
    googleEmail: varchar('google_email', { length: 255 }).notNull(),
    googleDisplayName: varchar('google_display_name', { length: 255 }),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(), // Space-separated list
    // Multi-connection support
    isPrimary: boolean('is_primary').notNull().default(true),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('meet_connections_user_id_idx').on(table.userId),
    index('meet_connections_google_user_id_idx').on(table.googleUserId),
    index('meet_connections_expires_at_idx').on(table.accessTokenExpiresAt),
    uniqueIndex('meet_connections_user_google_idx').on(table.userId, table.googleUserId),
  ]
);

// HubSpot field mapping — maps a ReplySequence source field to a HubSpot meeting property
export interface HubSpotFieldMapping {
  sourceField: 'meeting_title' | 'meeting_body' | 'meeting_start' | 'meeting_end' | 'meeting_outcome' | 'timestamp' | 'sentiment_score' | 'sentiment_label' | 'emotional_tones';
  hubspotProperty: string;
  enabled: boolean;
}

// HubSpot CRM connections table - stores OAuth tokens for HubSpot integration
export const hubspotConnections = pgTable(
  'hubspot_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // HubSpot account info
    hubspotPortalId: varchar('hubspot_portal_id', { length: 255 }).notNull(),
    hubspotUserEmail: varchar('hubspot_user_email', { length: 255 }),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(), // Space-separated list
    // CRM field mapping configuration (which HubSpot properties to populate)
    fieldMappings: jsonb('field_mappings').$type<HubSpotFieldMapping[]>(),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('hubspot_connections_user_id_idx').on(table.userId),
    index('hubspot_connections_portal_id_idx').on(table.hubspotPortalId),
    index('hubspot_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

// Airtable CRM connections table - stores user-specific PAT and base ID
export const airtableConnections = pgTable(
  'airtable_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Encrypted Personal Access Token (AES-256-GCM)
    apiKeyEncrypted: text('api_key_encrypted').notNull(),
    // Airtable base ID (e.g., appXXXXXXXXXXXXXX)
    baseId: varchar('base_id', { length: 255 }).notNull(),
    // Table names (customizable, with defaults)
    contactsTable: varchar('contacts_table', { length: 255 }).notNull().default('Contacts'),
    meetingsTable: varchar('meetings_table', { length: 255 }).notNull().default('Meetings'),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('airtable_connections_user_id_idx').on(table.userId),
  ]
);

// Google Sheets CRM connections table - OAuth-based, syncs meeting data to a spreadsheet
export interface SheetsColumnMapping {
  sourceField: 'contact_email' | 'meeting_title' | 'meeting_date' | 'platform' | 'draft_subject' | 'draft_body' | 'sent_date';
  column: string; // Column letter (A, B, C, ...)
  header: string; // Header label
  enabled: boolean;
}

export const DEFAULT_SHEETS_COLUMNS: SheetsColumnMapping[] = [
  { sourceField: 'contact_email', column: 'A', header: 'Contact Email', enabled: true },
  { sourceField: 'meeting_title', column: 'B', header: 'Meeting Title', enabled: true },
  { sourceField: 'meeting_date', column: 'C', header: 'Meeting Date', enabled: true },
  { sourceField: 'platform', column: 'D', header: 'Platform', enabled: true },
  { sourceField: 'draft_subject', column: 'E', header: 'Email Subject', enabled: true },
  { sourceField: 'draft_body', column: 'F', header: 'Email Body', enabled: true },
  { sourceField: 'sent_date', column: 'G', header: 'Sent Date', enabled: true },
];

export const sheetsConnections = pgTable(
  'sheets_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Google account info
    googleUserId: varchar('google_user_id', { length: 255 }).notNull(),
    googleEmail: varchar('google_email', { length: 255 }).notNull(),
    googleDisplayName: varchar('google_display_name', { length: 255 }),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(),
    // Sheet configuration
    spreadsheetId: varchar('spreadsheet_id', { length: 255 }),
    spreadsheetName: varchar('spreadsheet_name', { length: 500 }),
    sheetTab: varchar('sheet_tab', { length: 255 }).default('ReplySequence'),
    columnMappings: jsonb('column_mappings').$type<SheetsColumnMapping[]>(),
    // Sync tracking
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sheets_connections_user_id_idx').on(table.userId),
    index('sheets_connections_google_user_id_idx').on(table.googleUserId),
  ]
);

// Salesforce field mapping — maps a ReplySequence source field to a Salesforce object field
export interface SalesforceFieldMapping {
  sourceField: 'meeting_title' | 'meeting_body' | 'meeting_start' | 'meeting_end' | 'meeting_outcome' | 'timestamp' | 'sentiment_score' | 'sentiment_label' | 'emotional_tones';
  salesforceField: string;
  enabled: boolean;
}

// Salesforce CRM connections table - stores OAuth tokens for Salesforce integration
export const salesforceConnections = pgTable(
  'salesforce_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Salesforce account info
    salesforceUserId: varchar('salesforce_user_id', { length: 255 }).notNull(),
    salesforceUserEmail: varchar('salesforce_user_email', { length: 255 }),
    salesforceOrgId: varchar('salesforce_org_id', { length: 255 }),
    instanceUrl: varchar('instance_url', { length: 500 }).notNull(), // e.g. https://yourorg.my.salesforce.com
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(),
    // CRM field mapping configuration
    fieldMappings: jsonb('field_mappings').$type<SalesforceFieldMapping[]>(),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('salesforce_connections_user_id_idx').on(table.userId),
    index('salesforce_connections_sf_user_id_idx').on(table.salesforceUserId),
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

// Waitlist types
export type WaitlistTier = 'standard' | 'priority' | 'vip';
export type WaitlistStatus = 'waiting' | 'invited' | 'accepted' | 'expired';

// Waitlist entries table - beta waitlist with referral tracking
export const waitlistEntries = pgTable(
  'waitlist_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    // Referral tracking
    referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
    referredBy: uuid('referred_by'),
    referralCount: integer('referral_count').notNull().default(0),
    // Tier and status
    tier: varchar('tier', { length: 20 }).$type<WaitlistTier>().notNull().default('standard'),
    status: varchar('status', { length: 20 }).$type<WaitlistStatus>().notNull().default('waiting'),
    position: integer('position'),
    // Source tracking
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    // Invite tracking
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),
    // Email engagement
    welcomeEmailSentAt: timestamp('welcome_email_sent_at', { withTimezone: true }),
    lastUpdateEmailAt: timestamp('last_update_email_at', { withTimezone: true }),
    // Metadata
    metadata: jsonb('metadata').$type<Record<string, string>>(),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('waitlist_entries_email_idx').on(table.email),
    index('waitlist_entries_referral_code_idx').on(table.referralCode),
    index('waitlist_entries_referred_by_idx').on(table.referredBy),
    index('waitlist_entries_status_idx').on(table.status),
    index('waitlist_entries_created_at_idx').on(table.createdAt),
  ]
);

// Type exports for use in application code
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;
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
export type TeamsConnection = typeof teamsConnections.$inferSelect;
export type NewTeamsConnection = typeof teamsConnections.$inferInsert;
export type MeetConnection = typeof meetConnections.$inferSelect;
export type NewMeetConnection = typeof meetConnections.$inferInsert;
export type HubSpotConnection = typeof hubspotConnections.$inferSelect;
export type NewHubSpotConnection = typeof hubspotConnections.$inferInsert;
export type AirtableConnection = typeof airtableConnections.$inferSelect;
export type NewAirtableConnection = typeof airtableConnections.$inferInsert;
export type SalesforceConnection = typeof salesforceConnections.$inferSelect;
export type NewSalesforceConnection = typeof salesforceConnections.$inferInsert;

// Calendar connections table - stores OAuth tokens for Google Calendar users (separate from Meet)
export const calendarConnections = pgTable(
  'calendar_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Google account info
    googleUserId: varchar('google_user_id', { length: 255 }).notNull(),
    googleEmail: varchar('google_email', { length: 255 }).notNull(),
    googleDisplayName: varchar('google_display_name', { length: 255 }),
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
    uniqueIndex('calendar_connections_user_id_idx').on(table.userId),
    index('calendar_connections_google_user_id_idx').on(table.googleUserId),
    index('calendar_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type NewCalendarConnection = typeof calendarConnections.$inferInsert;

// Outlook Calendar connections table - stores OAuth tokens for Outlook Calendar users
export const outlookCalendarConnections = pgTable(
  'outlook_calendar_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Microsoft account info
    msUserId: varchar('ms_user_id', { length: 255 }).notNull(),
    msEmail: varchar('ms_email', { length: 255 }).notNull(),
    msDisplayName: varchar('ms_display_name', { length: 255 }),
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
    uniqueIndex('outlook_calendar_connections_user_id_idx').on(table.userId),
    index('outlook_calendar_connections_ms_user_id_idx').on(table.msUserId),
    index('outlook_calendar_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

export type OutlookCalendarConnection = typeof outlookCalendarConnections.$inferSelect;
export type NewOutlookCalendarConnection = typeof outlookCalendarConnections.$inferInsert;

// Calendar event source type
export type CalendarEventSource = 'google_calendar' | 'outlook_calendar';

// Auto-process preference type
export type AutoProcessPreference = 'enabled' | 'disabled' | 'default';

// Calendar event attendee type for JSONB storage
export interface CalendarEventAttendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  organizer?: boolean;
}

// Calendar events table - caches synced calendar events for upcoming meetings widget
export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // External identifiers
    externalEventId: text('external_event_id').notNull(),
    calendarId: text('calendar_id').notNull().default('primary'),
    source: varchar('source', { length: 50 }).$type<CalendarEventSource>().notNull(),
    // Event details
    title: text('title').notNull(),
    description: text('description'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    // Meeting info
    meetingUrl: text('meeting_url'),
    meetingPlatform: meetingPlatformEnum('meeting_platform'),
    // Attendees (JSONB array)
    attendees: jsonb('attendees').$type<CalendarEventAttendee[]>().default([]),
    organizerEmail: text('organizer_email'),
    // Auto-process preference (per-meeting toggle)
    autoProcess: varchar('auto_process', { length: 20 }).$type<AutoProcessPreference>().default('default'),
    // Sync tracking
    syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('calendar_events_user_source_external_idx').on(
      table.userId,
      table.source,
      table.externalEventId
    ),
    index('calendar_events_user_id_idx').on(table.userId),
    index('calendar_events_start_time_idx').on(table.startTime),
    index('calendar_events_meeting_platform_idx').on(table.meetingPlatform),
  ]
);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

// Email event types for granular tracking
export type EmailEventType = 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';

// Email events table - stores granular tracking events for detailed analytics
export const emailEvents = pgTable(
  'email_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => drafts.id, { onDelete: 'cascade' }),
    trackingId: uuid('tracking_id').notNull(), // Links to draft.trackingId
    eventType: varchar('event_type', { length: 20 }).$type<EmailEventType>().notNull(),
    // For click events - which URL was clicked
    clickedUrl: text('clicked_url'),
    // Client info
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
    // Geolocation (optional, from IP lookup)
    country: varchar('country', { length: 2 }),
    city: varchar('city', { length: 100 }),
    // Timestamps
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_events_draft_id_idx').on(table.draftId),
    index('email_events_tracking_id_idx').on(table.trackingId),
    index('email_events_event_type_idx').on(table.eventType),
    index('email_events_occurred_at_idx').on(table.occurredAt),
  ]
);

export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;

// Onboarding step type
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

// Email preference type
export type EmailPreference = 'review' | 'auto_send';

// Platform type for onboarding
export type ConnectedPlatform = 'zoom' | 'teams' | 'meet' | null;

// User onboarding table - tracks onboarding progress
export const userOnboarding = pgTable(
  'user_onboarding',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    currentStep: integer('current_step').$type<OnboardingStep>().notNull().default(1),
    platformConnected: varchar('platform_connected', { length: 50 }).$type<ConnectedPlatform>(),
    calendarConnected: boolean('calendar_connected').notNull().default(false),
    emailConnected: boolean('email_connected').notNull().default(false),
    crmConnected: boolean('crm_connected').notNull().default(false),
    draftGenerated: boolean('draft_generated').notNull().default(false),
    emailPreference: varchar('email_preference', { length: 20 }).$type<EmailPreference>().default('review'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('user_onboarding_clerk_id_idx').on(table.clerkId),
    index('user_onboarding_completed_at_idx').on(table.completedAt),
  ]
);

// Onboarding events table - tracks analytics events
export const onboardingEvents = pgTable(
  'onboarding_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    stepNumber: integer('step_number'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('onboarding_events_clerk_id_idx').on(table.clerkId),
    index('onboarding_events_event_type_idx').on(table.eventType),
    index('onboarding_events_created_at_idx').on(table.createdAt),
  ]
);

export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type NewUserOnboarding = typeof userOnboarding.$inferInsert;
export type OnboardingEvent = typeof onboardingEvents.$inferSelect;
export type NewOnboardingEvent = typeof onboardingEvents.$inferInsert;

// Event subscription status type
export type EventSubscriptionStatus = 'active' | 'suspended' | 'expired';

// Meet event subscriptions table - tracks Workspace Events API subscriptions
export const meetEventSubscriptions = pgTable(
  'meet_event_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Google's subscription resource name (e.g., "subscriptions/abc123")
    subscriptionName: text('subscription_name').notNull(),
    // Target resource (e.g., "//cloudidentity.googleapis.com/users/123")
    targetResource: text('target_resource').notNull(),
    // Event types subscribed to (stored as JSON array)
    eventTypes: jsonb('event_types').$type<string[]>().notNull(),
    // Subscription state
    status: varchar('status', { length: 20 }).$type<EventSubscriptionStatus>().notNull().default('active'),
    // Expiration and renewal tracking
    expireTime: timestamp('expire_time', { withTimezone: true }).notNull(),
    lastRenewedAt: timestamp('last_renewed_at', { withTimezone: true }),
    renewalFailures: integer('renewal_failures').notNull().default(0),
    // Error tracking
    lastError: text('last_error'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('meet_event_subscriptions_user_id_idx').on(table.userId),
    index('meet_event_subscriptions_status_idx').on(table.status),
    index('meet_event_subscriptions_expire_time_idx').on(table.expireTime),
    index('meet_event_subscriptions_subscription_name_idx').on(table.subscriptionName),
  ]
);

export type MeetEventSubscription = typeof meetEventSubscriptions.$inferSelect;
export type NewMeetEventSubscription = typeof meetEventSubscriptions.$inferInsert;

// Calendar watch channels table - tracks Google Calendar push notification subscriptions
export const calendarWatchChannels = pgTable(
  'calendar_watch_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    meetConnectionId: uuid('meet_connection_id')
      .references(() => meetConnections.id, { onDelete: 'cascade' }),
    // Channel identifiers
    channelId: text('channel_id').notNull().unique(), // Our UUID for the channel
    resourceId: text('resource_id').notNull(), // Google's resource ID
    calendarId: text('calendar_id').notNull().default('primary'),
    // Expiration and sync tracking
    expiration: timestamp('expiration', { withTimezone: true }).notNull(),
    syncToken: text('sync_token'), // For incremental event fetching
    lastNotificationAt: timestamp('last_notification_at', { withTimezone: true }),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('calendar_watch_channels_user_id_idx').on(table.userId),
    index('calendar_watch_channels_channel_id_idx').on(table.channelId),
    index('calendar_watch_channels_expiration_idx').on(table.expiration),
    index('calendar_watch_channels_meet_connection_id_idx').on(table.meetConnectionId),
  ]
);

export type CalendarWatchChannel = typeof calendarWatchChannels.$inferSelect;
export type NewCalendarWatchChannel = typeof calendarWatchChannels.$inferInsert;

// Recall bot status enum values
export type RecallBotStatus = 'pending' | 'scheduled' | 'joining' | 'in_call' | 'recording' | 'completed' | 'failed' | 'cancelled';

// Recall bots table - tracks bots scheduled to join meetings
export const recallBots = pgTable(
  'recall_bots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Recall.ai bot info
    recallBotId: text('recall_bot_id').unique(), // Recall's bot ID
    // Meeting info
    meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'set null' }), // Link to our meeting record
    calendarEventId: text('calendar_event_id'), // External calendar event ID
    meetingUrl: text('meeting_url').notNull(),
    meetingTitle: text('meeting_title'),
    platform: meetingPlatformEnum('platform'),
    // Scheduling
    scheduledJoinAt: timestamp('scheduled_join_at', { withTimezone: true }).notNull(),
    actualJoinAt: timestamp('actual_join_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    // Status tracking
    status: varchar('status', { length: 50 }).$type<RecallBotStatus>().notNull().default('pending'),
    lastStatusCode: text('last_status_code'), // Recall's status code
    lastStatusMessage: text('last_status_message'),
    // Transcript info
    transcriptId: text('transcript_id'), // Recall's transcript ID
    transcriptStatus: varchar('transcript_status', { length: 50 }),
    // Recording info
    recordingId: text('recording_id'), // Recall's recording ID
    recordingUrl: text('recording_url'),
    // Metadata
    metadata: jsonb('metadata').$type<Record<string, string>>(),
    // Error tracking
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('recall_bots_recall_bot_id_idx').on(table.recallBotId),
    index('recall_bots_user_id_idx').on(table.userId),
    index('recall_bots_meeting_id_idx').on(table.meetingId),
    index('recall_bots_status_idx').on(table.status),
    index('recall_bots_scheduled_join_at_idx').on(table.scheduledJoinAt),
    index('recall_bots_calendar_event_id_idx').on(table.calendarEventId),
  ]
);

export type RecallBot = typeof recallBots.$inferSelect;
export type NewRecallBot = typeof recallBots.$inferInsert;

// Email provider type
export type EmailProvider = 'gmail' | 'outlook';

// Email connections table - stores OAuth tokens for sending emails via user's own account
export const emailConnections = pgTable(
  'email_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Email provider
    provider: varchar('provider', { length: 20 }).$type<EmailProvider>().notNull(),
    // Account info
    email: varchar('email', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    // Encrypted tokens (AES-256-GCM)
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    // Token expiration
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
    // Scopes granted
    scopes: text('scopes').notNull(), // Space-separated list
    // Default email account for this user
    isDefault: boolean('is_default').notNull().default(true),
    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('email_connections_user_provider_idx').on(table.userId, table.provider),
    index('email_connections_user_id_idx').on(table.userId),
    index('email_connections_provider_idx').on(table.provider),
    index('email_connections_expires_at_idx').on(table.accessTokenExpiresAt),
  ]
);

export type EmailConnection = typeof emailConnections.$inferSelect;
export type NewEmailConnection = typeof emailConnections.$inferInsert;

// Template section type for custom template sections
export interface TemplateSectionDef {
  name: string;
  description: string;
  required: boolean;
}

// Email templates table - stores user-created custom templates
export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    meetingType: varchar('meeting_type', { length: 50 }), // null = all types
    promptInstructions: text('prompt_instructions').notNull(),
    sections: jsonb('sections').$type<TemplateSectionDef[]>(),
    icon: varchar('icon', { length: 50 }).default('general'),
    isDefault: boolean('is_default').notNull().default(false),
    isSystem: boolean('is_system').notNull().default(false), // true = built-in, false = user-created
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('email_templates_user_id_idx').on(table.userId),
    index('email_templates_meeting_type_idx').on(table.meetingType),
    index('email_templates_is_default_idx').on(table.userId, table.isDefault),
  ]
);

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

// Chat message role type
export type ChatRole = 'user' | 'assistant';

// Source meeting reference in chat messages
export interface ChatSourceMeeting {
  meetingId: string;
  topic: string;
  date: string; // ISO string
  platform: MeetingPlatform;
}

// Chat conversations table - stores conversation sessions for "Ask your meetings" feature
export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull().default('New conversation'),
    // Optional: scope to a single meeting
    meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'set null' }),
    messageCount: integer('message_count').notNull().default(0),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('chat_conversations_user_id_idx').on(table.userId),
    index('chat_conversations_meeting_id_idx').on(table.meetingId),
    index('chat_conversations_last_message_at_idx').on(table.lastMessageAt),
  ]
);

// Chat messages table - stores individual messages in a conversation
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).$type<ChatRole>().notNull(),
    content: text('content').notNull(),
    // Source meetings referenced in assistant responses
    sourceMeetings: jsonb('source_meetings').$type<ChatSourceMeeting[]>(),
    // Token tracking
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('chat_messages_conversation_id_idx').on(table.conversationId),
    index('chat_messages_created_at_idx').on(table.createdAt),
  ]
);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
