// Zoom webhook event types
export type ZoomEventType =
  | 'endpoint.url_validation'
  | 'meeting.ended'
  | 'meeting.started'
  | 'recording.completed'
  | 'recording.started'
  | 'recording.stopped'
  | 'recording.paused'
  | 'recording.resumed'
  | 'recording.transcript_completed';

// Recording file types
export type RecordingFileType =
  | 'MP4'
  | 'M4A'
  | 'CHAT'
  | 'TRANSCRIPT'
  | 'CC'
  | 'CSV'
  | 'TIMELINE';

// Recording file status
export type RecordingFileStatus = 'completed' | 'processing';

// Participant information
export interface ZoomParticipant {
  id?: string;
  user_id?: string;
  name: string;
  user_email?: string;
}

// Recording file information
export interface RecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: RecordingFileType;
  file_extension: string;
  file_size: number;
  play_url?: string;
  download_url: string;
  status: RecordingFileStatus;
  recording_type?: string;
}

// Recording object in webhook payload
export interface RecordingObject {
  uuid: string;
  id: number;
  account_id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  timezone: string;
  duration: number;
  total_size: number;
  recording_count: number;
  share_url?: string;
  recording_files: RecordingFile[];
  participant_audio_files?: RecordingFile[];
  password?: string;
  host_email?: string;
}

// URL validation event payload
export interface UrlValidationPayload {
  event: 'endpoint.url_validation';
  payload: {
    plainToken: string;
  };
  event_ts: number;
}

// Recording completed event payload
export interface RecordingCompletedPayload {
  event: 'recording.completed';
  event_ts: number;
  payload: {
    account_id: string;
    object: RecordingObject;
  };
}

// Recording transcript completed event payload
// Sent when transcript processing finishes (after recording.completed)
export interface RecordingTranscriptCompletedPayload {
  event: 'recording.transcript_completed';
  event_ts: number;
  payload: {
    account_id: string;
    object: RecordingObject; // Contains recording_files with TRANSCRIPT type
  };
}

// Meeting object in meeting.ended webhook payload
export interface MeetingEndedObject {
  uuid: string;
  id: number;
  host_id: string;
  topic: string;
  type: number; // 1=instant, 2=scheduled, 3=recurring, 4=PMI, 8=recurring fixed
  start_time: string;
  end_time: string;
  timezone: string;
  duration: number;
  host_email?: string;
  participant_count?: number;
  // Indicates if recording/transcript will be available
  // Note: actual files come via recording.completed event
}

// Meeting ended event payload
export interface MeetingEndedPayload {
  event: 'meeting.ended';
  event_ts: number;
  payload: {
    account_id: string;
    operator?: string;
    operator_id?: string;
    object: MeetingEndedObject;
  };
}

// Union type for all webhook payloads
export type ZoomWebhookPayload =
  | UrlValidationPayload
  | RecordingCompletedPayload
  | RecordingTranscriptCompletedPayload
  | MeetingEndedPayload;

// Extracted meeting metadata for database storage
export interface ExtractedMeetingMetadata {
  zoomMeetingId: string;
  hostEmail: string;
  topic: string;
  startTime: Date;
  duration: number;
  participants: Array<{
    user_id?: string;
    user_name: string;
    email?: string;
  }>;
  transcriptDownloadUrl: string | null;
  recordingDownloadUrl: string | null;
}

// Extracted data from meeting.ended event
export interface ExtractedMeetingEndedData {
  meetingId: string;
  endTime: Date;
  recordingAvailable: 'pending' | 'no'; // pending = we expect recording.completed later
  transcriptAvailable: 'pending' | 'no'; // pending = we expect it with recording
}
