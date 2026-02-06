/**
 * Google Meet API Client
 *
 * Handles OAuth2 authentication and API calls for fetching Meet transcripts.
 * Uses OAuth2 with refresh tokens for authentication.
 */

import * as jose from 'jose';
import type {
  GoogleTokenResponse,
  GoogleApiError,
  ConferenceRecord,
  MeetTranscript,
  TranscriptEntry,
  MeetParticipant,
  ListResponse,
} from './meet/types';

// Google's JWKS endpoint for JWT verification
const GOOGLE_JWKS = jose.createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

// Expected issuer for Google tokens
const GOOGLE_ISSUER = 'https://accounts.google.com';

// Default audience (can be overridden by env var)
const DEFAULT_AUDIENCE = process.env.GOOGLE_PUBSUB_AUDIENCE?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, '') + '/api/webhooks/meet' ||
  'https://replysequence.vercel.app/api/webhooks/meet';

// Configuration from environment (trim to prevent newline issues)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN?.trim();

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
 * JWT Validation Result
 */
export interface JWTValidationResult {
  valid: boolean;
  error?: string;
  email?: string;
  audience?: string;
}

/**
 * Validate Pub/Sub push message JWT
 * Verifies the bearer token from Google using their public keys
 *
 * @param authHeader - The Authorization header from the request
 * @param expectedAudience - Optional override for expected audience claim
 * @returns Validation result with details
 */
export async function validatePubSubMessage(
  authHeader: string | null,
  expectedAudience?: string
): Promise<JWTValidationResult> {
  const audience = expectedAudience || DEFAULT_AUDIENCE;

  log('info', '[MEET-JWT-1] Starting JWT validation', {
    hasAuthHeader: !!authHeader,
    expectedAudience: audience,
  });

  // Step 1: Check for Authorization header
  if (!authHeader) {
    log('warn', '[MEET-JWT-2] No authorization header in Pub/Sub message');
    return { valid: false, error: 'Missing authorization header' };
  }

  // Step 2: Check Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    log('warn', '[MEET-JWT-2] Invalid authorization header format');
    return { valid: false, error: 'Invalid authorization header format' };
  }

  // Step 3: Extract token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!token) {
    log('warn', '[MEET-JWT-2] Empty bearer token');
    return { valid: false, error: 'Empty bearer token' };
  }

  log('info', '[MEET-JWT-3] Token extracted', {
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 20) + '...',
  });

  try {
    // Step 4: Verify JWT signature using Google's public keys
    log('info', '[MEET-JWT-4] Verifying JWT signature with Google JWKS');

    const { payload, protectedHeader } = await jose.jwtVerify(token, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUER,
      audience: audience,
    });

    log('info', '[MEET-JWT-5] JWT signature verified', {
      algorithm: protectedHeader.alg,
      keyId: protectedHeader.kid,
    });

    // Step 5: Log validated claims
    const email = payload.email as string | undefined;
    const emailVerified = payload.email_verified as boolean | undefined;

    log('info', '[MEET-JWT-6] JWT claims validated', {
      issuer: payload.iss,
      audience: payload.aud,
      email: email,
      emailVerified: emailVerified,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown',
    });

    return {
      valid: true,
      email: email,
      audience: Array.isArray(payload.aud) ? payload.aud[0] : payload.aud,
    };
  } catch (error) {
    // Handle specific JWT errors from jose library
    if (error instanceof jose.errors.JWTExpired) {
      log('warn', '[MEET-JWT-ERROR] Token expired', {
        error: error.message,
      });
      return { valid: false, error: 'Token expired' };
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      log('warn', '[MEET-JWT-ERROR] Claim validation failed', {
        error: error.message,
        claim: error.claim,
        reason: error.reason,
      });
      return { valid: false, error: `Claim validation failed: ${error.claim}` };
    }

    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      log('warn', '[MEET-JWT-ERROR] Signature verification failed', {
        error: error.message,
      });
      return { valid: false, error: 'Invalid signature' };
    }

    // Handle malformed token errors (JWTInvalid, JWSInvalid)
    if (error instanceof jose.errors.JWTInvalid) {
      log('warn', '[MEET-JWT-ERROR] Malformed JWT token', {
        error: error.message,
      });
      return { valid: false, error: 'Malformed token' };
    }

    if (error instanceof jose.errors.JWSInvalid) {
      log('warn', '[MEET-JWT-ERROR] Invalid JWS structure', {
        error: error.message,
      });
      return { valid: false, error: 'Invalid token structure' };
    }

    // Handle SyntaxError from base64/JSON parsing of malformed tokens
    if (error instanceof SyntaxError) {
      log('warn', '[MEET-JWT-ERROR] Token parsing failed (malformed)', {
        error: error.message,
      });
      return { valid: false, error: 'Malformed token - parsing failed' };
    }

    // Handle TypeError (often from null/undefined access on malformed data)
    if (error instanceof TypeError) {
      log('warn', '[MEET-JWT-ERROR] Token structure error', {
        error: error.message,
      });
      return { valid: false, error: 'Invalid token format' };
    }

    // Generic error - catch-all for anything else
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.constructor.name : typeof error;
    log('error', '[MEET-JWT-ERROR] JWT validation failed', {
      error: errorMessage,
      errorType: errorType,
    });
    return { valid: false, error: `Validation failed: ${errorMessage}` };
  }
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
