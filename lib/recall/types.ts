/**
 * Recall.ai API Types
 * Based on Recall.ai API documentation
 */

// Bot status lifecycle
export type BotStatus =
  | 'ready'           // Bot created, waiting to join
  | 'joining_call'    // Bot is joining the meeting
  | 'in_waiting_room' // Bot is in meeting waiting room
  | 'in_call_not_recording' // In call but not recording yet
  | 'in_call_recording'     // Actively recording
  | 'call_ended'      // Meeting has ended
  | 'done'            // Bot processing complete
  | 'fatal'           // Unrecoverable error
  | 'analysis_done';  // Post-processing complete

// Meeting platform types supported by Recall
export type RecallPlatform = 'zoom' | 'google_meet' | 'microsoft_teams' | 'webex' | 'slack_huddles' | 'goto_meeting';

// Bot creation request
export interface CreateBotRequest {
  meeting_url: string;
  bot_name?: string;
  join_at?: string; // ISO timestamp for scheduled join
  transcription_options?: TranscriptionOptions;
  recording_mode?: 'speaker_view' | 'gallery_view' | 'audio_only';
  real_time_transcription?: RealTimeTranscriptionConfig;
  automatic_leave?: AutomaticLeaveConfig;
  metadata?: Record<string, string>;
}

export interface TranscriptionOptions {
  provider?: 'recall' | 'deepgram' | 'assembly_ai' | 'rev' | 'meeting_captions';
  language?: string;
}

export interface RealTimeTranscriptionConfig {
  destination_url: string; // Webhook URL for real-time transcripts
  partial_results?: boolean;
}

export interface AutomaticLeaveConfig {
  waiting_room_timeout?: number; // Seconds to wait in waiting room
  noone_joined_timeout?: number; // Seconds to wait if no one joins
  everyone_left_timeout?: number; // Seconds to wait after everyone leaves
}

// Bot response from API
export interface Bot {
  id: string;
  meeting_url: string;
  bot_name: string;
  status_changes: BotStatusChange[];
  meeting_metadata?: MeetingMetadata;
  video_url?: string;
  recording?: RecordingInfo;
  transcript?: TranscriptInfo;
  metadata?: Record<string, string>;
  created_at: string;
  join_at?: string;
}

export interface BotStatusChange {
  code: BotStatus;
  message?: string;
  created_at: string;
}

export interface MeetingMetadata {
  title?: string;
  start_time?: string;
  end_time?: string;
}

export interface RecordingInfo {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  media_shortcuts?: MediaShortcuts;
}

export interface MediaShortcuts {
  video_mixed?: string;
  video_mixed_mp4?: string;
  audio_mixed?: string;
  audio_mixed_mp3?: string;
}

export interface TranscriptInfo {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

// Transcript data structure
export interface Transcript {
  id: string;
  bot_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  words?: TranscriptWord[];
  speakers?: TranscriptSpeaker[];
}

export interface TranscriptWord {
  text: string;
  start_time: number; // milliseconds
  end_time: number;
  speaker_id?: string;
  confidence?: number;
}

export interface TranscriptSpeaker {
  id: string;
  name?: string;
}

// Webhook event types
export type WebhookEventType =
  | 'bot.status_change'
  | 'bot.transcription'
  | 'bot.done'
  | 'recording.done'
  | 'transcript.done';

// Webhook payload structure
export interface WebhookPayload {
  event: WebhookEventType;
  data: WebhookData;
}

export interface WebhookData {
  bot_id: string;
  status?: BotStatusChange;
  transcript?: RealTimeTranscriptData;
  recording?: RecordingInfo;
}

// Real-time transcription webhook data
export interface RealTimeTranscriptData {
  words: TranscriptWord[];
  is_final: boolean;
  speaker?: TranscriptSpeaker;
}

// Calendar integration types
export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  platform?: RecallPlatform;
}

// Bot scheduling record for database
export interface ScheduledBot {
  id: string;
  userId: string;
  calendarEventId: string;
  recallBotId?: string;
  meetingUrl: string;
  scheduledJoinAt: Date;
  status: 'pending' | 'scheduled' | 'joined' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// API error response
export interface RecallApiError {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}
