/**
 * Microsoft Graph API Client for Teams
 *
 * Handles authentication and API calls for fetching Teams transcripts.
 * Uses OAuth2 client credentials flow (app-only authentication).
 */

import type {
  TokenResponse,
  TranscriptMetadata,
  OnlineMeeting,
  GraphApiError,
} from './teams/types';

// Configuration from environment
const TENANT_ID = process.env.MICROSOFT_TEAMS_TENANT_ID;
const CLIENT_ID = process.env.MICROSOFT_TEAMS_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_TEAMS_CLIENT_SECRET;

// Graph API endpoints
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

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
      service: 'teams-api',
      ...data,
    })
  );
}

/**
 * Get an access token using client credentials flow
 * Caches token until 5 minutes before expiration
 */
export async function getAccessToken(): Promise<string> {
  // Check cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    return cachedToken.token;
  }

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Microsoft Teams credentials not configured');
  }

  log('info', 'Fetching new Graph API access token');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
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
    log('error', 'Failed to get access token', {
      status: response.status,
      error: errorText,
    });
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  log('info', 'Access token obtained', {
    expiresIn: data.expires_in,
  });

  return data.access_token;
}

/**
 * Make an authenticated request to Graph API
 */
async function graphRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData: GraphApiError = await response.json().catch(() => ({
      error: { code: 'unknown', message: response.statusText },
    }));

    log('error', 'Graph API request failed', {
      endpoint,
      status: response.status,
      error: errorData.error?.message,
      code: errorData.error?.code,
    });

    throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Make an authenticated request that returns text content (e.g., VTT)
 */
async function graphRequestText(
  endpoint: string,
  format?: string
): Promise<string> {
  const token = await getAccessToken();

  let url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;

  // Add format parameter for transcript content
  if (format) {
    url += url.includes('?') ? '&' : '?';
    url += `$format=${encodeURIComponent(format)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: format || 'text/vtt',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('error', 'Graph API text request failed', {
      endpoint,
      status: response.status,
      error: errorText.substring(0, 200),
    });

    throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Get transcript metadata
 */
export async function getTranscriptMetadata(
  userId: string,
  meetingId: string,
  transcriptId: string
): Promise<TranscriptMetadata> {
  log('info', 'Fetching transcript metadata', { userId, meetingId, transcriptId });

  const endpoint = `/users/${userId}/onlineMeetings/${meetingId}/transcripts/${transcriptId}`;
  return graphRequest<TranscriptMetadata>(endpoint);
}

/**
 * Get transcript content in VTT format
 */
export async function getTranscriptContent(
  userId: string,
  meetingId: string,
  transcriptId: string
): Promise<string> {
  log('info', 'Fetching transcript content', { userId, meetingId, transcriptId });

  const endpoint = `/users/${userId}/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`;
  return graphRequestText(endpoint, 'text/vtt');
}

/**
 * Get transcript content using the full content URL from notification
 */
export async function getTranscriptContentByUrl(
  transcriptContentUrl: string
): Promise<string> {
  log('info', 'Fetching transcript content by URL', {
    url: transcriptContentUrl.substring(0, 100),
  });

  // The URL from notification may be relative or absolute
  const endpoint = transcriptContentUrl.startsWith('http')
    ? transcriptContentUrl
    : `${GRAPH_BASE_URL}/${transcriptContentUrl}`;

  return graphRequestText(endpoint, 'text/vtt');
}

/**
 * Get online meeting details
 */
export async function getOnlineMeeting(
  userId: string,
  meetingId: string
): Promise<OnlineMeeting> {
  log('info', 'Fetching online meeting details', { userId, meetingId });

  const endpoint = `/users/${userId}/onlineMeetings/${meetingId}`;
  return graphRequest<OnlineMeeting>(endpoint);
}

/**
 * List transcripts for a meeting
 */
export async function listTranscripts(
  userId: string,
  meetingId: string
): Promise<{ value: TranscriptMetadata[] }> {
  log('info', 'Listing transcripts for meeting', { userId, meetingId });

  const endpoint = `/users/${userId}/onlineMeetings/${meetingId}/transcripts`;
  return graphRequest<{ value: TranscriptMetadata[] }>(endpoint);
}

/**
 * Parse resource path from notification to extract IDs
 * Example: "users/{userId}/onlineMeetings('{meetingId}')/transcripts('{transcriptId}')"
 */
export function parseResourcePath(resource: string): {
  userId?: string;
  meetingId?: string;
  transcriptId?: string;
  callId?: string;
} {
  const result: {
    userId?: string;
    meetingId?: string;
    transcriptId?: string;
    callId?: string;
  } = {};

  // Match users/{userId}
  const userMatch = resource.match(/users\/([^/]+)/);
  if (userMatch) {
    result.userId = userMatch[1];
  }

  // Match onlineMeetings('{meetingId}') or onlineMeetings/{meetingId}
  const meetingMatch = resource.match(/onlineMeetings(?:\('([^']+)'\)|\/([^/]+))/);
  if (meetingMatch) {
    result.meetingId = meetingMatch[1] || meetingMatch[2];
  }

  // Match transcripts('{transcriptId}') or transcripts/{transcriptId}
  const transcriptMatch = resource.match(/transcripts(?:\('([^']+)'\)|\/([^/]+))/);
  if (transcriptMatch) {
    result.transcriptId = transcriptMatch[1] || transcriptMatch[2];
  }

  // Match adhocCalls/{callId}
  const callMatch = resource.match(/adhocCalls\/([^/]+)/);
  if (callMatch) {
    result.callId = callMatch[1];
  }

  return result;
}

/**
 * Validate client state from notification
 */
export function validateClientState(
  receivedState: string | undefined,
  expectedState: string | undefined
): boolean {
  if (!expectedState) return true; // No validation if not configured
  return receivedState === expectedState;
}

/**
 * Check if Teams API is configured
 */
export function isTeamsConfigured(): boolean {
  return !!(TENANT_ID && CLIENT_ID && CLIENT_SECRET);
}
