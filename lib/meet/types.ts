/**
 * Google Meet API Types
 *
 * Types for Google Meet API responses and Pub/Sub notifications.
 */

/**
 * Google Cloud Pub/Sub push message envelope
 * Received at webhook endpoint
 */
export interface PubSubPushMessage {
  message: {
    data: string; // Base64-encoded event data
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

/**
 * Google Workspace Events API event for Meet
 * Decoded from Pub/Sub message data
 */
export interface MeetWorkspaceEvent {
  eventType: string; // e.g., 'google.workspace.meet.conference.v2.ended'
  eventTime: string; // ISO 8601 timestamp
  conferenceRecord: ConferenceRecordEvent;
}

/**
 * Conference record event data from Workspace Events
 */
export interface ConferenceRecordEvent {
  name: string; // e.g., 'conferenceRecords/abc123'
  conferenceRecordName: string;
  space?: {
    name: string;
    meetingCode?: string;
    meetingUri?: string;
  };
  startTime?: string;
  endTime?: string;
}

/**
 * Conference record from Meet REST API
 */
export interface ConferenceRecord {
  name: string; // Format: conferenceRecords/{conference_record}
  startTime: string;
  endTime?: string;
  space: {
    name: string;
    meetingCode?: string;
    meetingUri?: string;
  };
  expireTime?: string;
}

/**
 * Transcript resource from Meet REST API
 */
export interface MeetTranscript {
  name: string; // Format: conferenceRecords/{record}/transcripts/{transcript}
  state: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED';
  startTime?: string;
  endTime?: string;
  docsDestination?: {
    document: string; // Google Docs document ID
    exportUri: string; // URL to download/view
  };
}

/**
 * Transcript entry from Meet REST API
 */
export interface TranscriptEntry {
  name: string; // Format: conferenceRecords/{record}/transcripts/{transcript}/entries/{entry}
  participant: string; // Format: conferenceRecords/{record}/participants/{participant}
  text: string;
  languageCode: string;
  startTime: string;
  endTime: string;
}

/**
 * Participant from Meet REST API
 */
export interface MeetParticipant {
  name: string; // Format: conferenceRecords/{record}/participants/{participant}
  earliestStartTime?: string;
  latestEndTime?: string;
  signedinUser?: {
    user: string; // Format: users/{user}
    displayName?: string;
  };
  anonymousUser?: {
    displayName: string;
  };
  phoneUser?: {
    displayName: string;
  };
}

/**
 * Recording from Meet REST API
 */
export interface MeetRecording {
  name: string; // Format: conferenceRecords/{record}/recordings/{recording}
  state: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED';
  startTime?: string;
  endTime?: string;
  driveDestination?: {
    file: string; // Google Drive file ID
    exportUri: string; // URL to download
  };
}

/**
 * List response wrapper from Meet API
 */
export interface ListResponse<T> {
  [key: string]: T[] | string | undefined;
  nextPageToken?: string;
}

/**
 * OAuth2 token response from Google
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

/**
 * Google API error response
 */
export interface GoogleApiError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: unknown[];
  };
}

/**
 * Processed Meet event for internal use
 */
export interface ProcessedMeetEvent {
  eventType: 'conference.ended' | 'transcript.ready' | 'recording.ready';
  conferenceRecordName: string;
  meetingCode?: string;
  meetingUri?: string;
  startTime?: Date;
  endTime?: Date;
  timestamp: Date;
}
