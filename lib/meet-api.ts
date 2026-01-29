/**
 * Google Meet API Client
 *
 * Handles OAuth2 authentication and API calls for fetching Meet transcripts.
 * Uses OAuth2 with refresh tokens for authentication.
 */

import type {
  GoogleTokenResponse,
  GoogleApiError,
  ConferenceRecord,
  MeetTranscript,
  TranscriptEntry,
  MeetParticipant,
  ListResponse,
} from './meet/types';

// Configuration from environment
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// API endpoints
const MEET_API_BASE = 'https://meet.googleapis.com/v2';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Logger helper for structured JSON logging
 */
function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'meet-api',
      ...data,
    })
  );
}

/**
 * Get an access token using refresh token
 * Caches token until 5 minutes before expiration
 */
export async function getAccessToken(): Promise<string> {
  // Check cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    return cachedToken.token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('Google Meet credentials not configured');
  }

  log('info', '[MEET-2] Fetching new Google API access token');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('error', '[MEET-2] Failed to get access token', {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data: GoogleTokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  log('info', '[MEET-2] Google API token obtained', {
    expiresIn: data.expires_in,
  });

  return data.access_token;
}

/**
 * Make an authenticated request to Meet API
 */
async function meetRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const url = endpoint.startsWith('http') ? endpoint : `${MEET_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData: GoogleApiError = await response.json().catch(() => ({
      error: { code: response.status, message: response.statusText, status: 'UNKNOWN' },
    }));

    log('error', '[MEET-4] Meet API request failed', {
      endpoint,
      status: response.status,
      error: errorData.error?.message,
      code: errorData.error?.code,
    });

    throw new Error(`Meet API error: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get a conference record by name
 */
export async function getConferenceRecord(
  conferenceRecordName: string
): Promise<ConferenceRecord> {
  log('info', '[MEET-4] Fetching conference record', { conferenceRecordName });

  // Extract just the ID if full name provided
  const recordId = conferenceRecordName.replace('conferenceRecords/', '');
  return meetRequest<ConferenceRecord>(`/conferenceRecords/${recordId}`);
}

/**
 * List transcripts for a conference record
 */
export async function listTranscripts(
  conferenceRecordName: string
): Promise<MeetTranscript[]> {
  log('info', '[MEET-5] Listing transcripts', { conferenceRecordName });

  const recordId = conferenceRecordName.replace('conferenceRecords/', '');
  const response = await meetRequest<ListResponse<MeetTranscript>>(
    `/conferenceRecords/${recordId}/transcripts`
  );

  return (response.transcripts as MeetTranscript[]) || [];
}

/**
 * Get a specific transcript
 */
export async function getTranscript(
  transcriptName: string
): Promise<MeetTranscript> {
  log('info', '[MEET-5] Fetching transcript', { transcriptName });

  // The name is already in format conferenceRecords/{record}/transcripts/{transcript}
  return meetRequest<MeetTranscript>(`/${transcriptName}`);
}

/**
 * List transcript entries
 */
export async function listTranscriptEntries(
  transcriptName: string
): Promise<TranscriptEntry[]> {
  log('info', '[MEET-6] Listing transcript entries', { transcriptName });

  const response = await meetRequest<ListResponse<TranscriptEntry>>(
    `/${transcriptName}/entries`
  );

  return (response.entries as TranscriptEntry[]) || [];
}

/**
 * Get a specific transcript entry
 */
export async function getTranscriptEntry(
  entryName: string
): Promise<TranscriptEntry> {
  return meetRequest<TranscriptEntry>(`/${entryName}`);
}

/**
 * List participants for a conference record
 */
export async function listParticipants(
  conferenceRecordName: string
): Promise<MeetParticipant[]> {
  log('info', '[MEET-4] Listing participants', { conferenceRecordName });

  const recordId = conferenceRecordName.replace('conferenceRecords/', '');
  const response = await meetRequest<ListResponse<MeetParticipant>>(
    `/conferenceRecords/${recordId}/participants`
  );

  return (response.participants as MeetParticipant[]) || [];
}

/**
 * Get participant by name
 */
export async function getParticipant(
  participantName: string
): Promise<MeetParticipant> {
  return meetRequest<MeetParticipant>(`/${participantName}`);
}

/**
 * Parse conference record name from various formats
 */
export function parseConferenceRecordName(input: string): string {
  if (input.startsWith('conferenceRecords/')) {
    return input;
  }
  return `conferenceRecords/${input}`;
}

/**
 * Extract participant display name from participant resource
 */
export function getParticipantDisplayName(participant: MeetParticipant): string {
  if (participant.signedinUser?.displayName) {
    return participant.signedinUser.displayName;
  }
  if (participant.anonymousUser?.displayName) {
    return participant.anonymousUser.displayName;
  }
  if (participant.phoneUser?.displayName) {
    return participant.phoneUser.displayName;
  }
  return 'Unknown';
}

/**
 * Check if Meet API is configured
 */
export function isMeetConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

/**
 * Validate Pub/Sub push message
 * In production, verify the JWT bearer token from Google
 */
export function validatePubSubMessage(
  authHeader: string | null,
  expectedAudience?: string
): boolean {
  // For initial implementation, we accept messages
  // TODO: Add JWT validation for production security
  // The Authorization header contains a bearer token signed by Google
  if (!authHeader) {
    log('warn', '[MEET-2] No authorization header in Pub/Sub message');
    return true; // Allow for testing, tighten in production
  }

  // Basic check that it's a bearer token
  if (!authHeader.startsWith('Bearer ')) {
    log('warn', '[MEET-2] Invalid authorization header format');
    return false;
  }

  // TODO: Decode and verify JWT signature
  // For now, we trust messages from the configured subscription
  return true;
}

/**
 * Convert transcript entries to VTT format
 * This allows reuse of existing VTT parser
 */
export function entriesToVTT(
  entries: TranscriptEntry[],
  participantNames: Map<string, string>
): string {
  const lines: string[] = ['WEBVTT', ''];

  entries.forEach((entry, index) => {
    const speakerName = participantNames.get(entry.participant) || 'Unknown';
    const startTime = formatVTTTime(entry.startTime);
    const endTime = formatVTTTime(entry.endTime);

    lines.push(`${index + 1}`);
    lines.push(`${startTime} --> ${endTime}`);
    lines.push(`${speakerName}: ${entry.text}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format ISO timestamp to VTT time format (HH:MM:SS.mmm)
 */
function formatVTTTime(isoTime: string): string {
  const date = new Date(isoTime);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds}.${ms}`;
}
