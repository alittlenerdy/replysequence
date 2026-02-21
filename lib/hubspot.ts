/**
 * HubSpot CRM Integration
 *
 * Handles contact matching and meeting logging to HubSpot.
 * Uses OAuth2 for authentication.
 * Non-blocking - email delivery takes priority over CRM logging.
 */

// Configuration from environment
const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/hubspot/callback`;

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_OAUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

// Required HubSpot scopes
const HUBSPOT_SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.appointments.read',
  'crm.objects.appointments.write',
  'oauth',
];

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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
      service: 'hubspot',
      ...data,
    })
  );
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if HubSpot OAuth is configured
 */
export function isHubSpotConfigured(): boolean {
  return !!(HUBSPOT_CLIENT_ID && HUBSPOT_CLIENT_SECRET);
}

/**
 * Generate OAuth authorization URL
 */
export function getHubSpotAuthUrl(state: string): string {
  if (!HUBSPOT_CLIENT_ID) {
    throw new Error('HubSpot client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: HUBSPOT_CLIENT_ID,
    redirect_uri: HUBSPOT_REDIRECT_URI,
    scope: HUBSPOT_SCOPES.join(' '),
    state,
  });

  return `${HUBSPOT_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeHubSpotCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET) {
    throw new Error('HubSpot credentials not configured');
  }

  const response = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      redirect_uri: HUBSPOT_REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log('error', 'Failed to exchange HubSpot code', { error });
    throw new Error(`HubSpot OAuth error: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh HubSpot access token
 */
export async function refreshHubSpotToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET) {
    throw new Error('HubSpot credentials not configured');
  }

  const response = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log('error', 'Failed to refresh HubSpot token', { error });
    throw new Error(`HubSpot token refresh error: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * HubSpot API client with automatic retry
 */
async function hubspotFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${HUBSPOT_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let rateLimitRetries = 0;
  const MAX_RATE_LIMIT_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      // Handle rate limiting with separate counter to prevent infinite loops
      if (response.status === 429) {
        rateLimitRetries++;
        if (rateLimitRetries > MAX_RATE_LIMIT_RETRIES) {
          log('error', 'HubSpot rate limit retries exhausted', { endpoint, rateLimitRetries });
          return response;
        }
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        log('warn', 'HubSpot rate limited, waiting', { retryAfter, attempt, rateLimitRetries });
        await sleep(retryAfter * 1000);
        attempt--; // Don't consume an attempt for rate limits
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        log('warn', 'HubSpot API request failed, retrying', {
          attempt,
          endpoint,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(RETRY_DELAY_MS);
      } else {
        throw error;
      }
    }
  }

  throw new Error('HubSpot API request failed after retries');
}

/**
 * Re-export the field mapping type from schema
 */
export type { HubSpotFieldMapping } from '@/lib/db/schema';
import type { HubSpotFieldMapping } from '@/lib/db/schema';

/**
 * Default field mappings matching the previously hardcoded values.
 * Used when a user has no custom mappings configured.
 */
export const DEFAULT_FIELD_MAPPINGS: HubSpotFieldMapping[] = [
  { sourceField: 'timestamp', hubspotProperty: 'hs_timestamp', enabled: true },
  { sourceField: 'meeting_title', hubspotProperty: 'hs_meeting_title', enabled: true },
  { sourceField: 'meeting_body', hubspotProperty: 'hs_meeting_body', enabled: true },
  { sourceField: 'meeting_start', hubspotProperty: 'hs_meeting_start_time', enabled: true },
  { sourceField: 'meeting_end', hubspotProperty: 'hs_meeting_end_time', enabled: true },
  { sourceField: 'meeting_outcome', hubspotProperty: 'hs_meeting_outcome', enabled: true },
];

/**
 * Human-readable labels for source fields
 */
export const SOURCE_FIELD_LABELS: Record<HubSpotFieldMapping['sourceField'], string> = {
  timestamp: 'Meeting Timestamp',
  meeting_title: 'Meeting Title',
  meeting_body: 'Meeting Notes & Follow-up',
  meeting_start: 'Start Time',
  meeting_end: 'End Time',
  meeting_outcome: 'Meeting Outcome',
  sentiment_score: 'Sentiment Score',
  sentiment_label: 'Sentiment Label',
  emotional_tones: 'Emotional Tones',
};

/**
 * Fetch available HubSpot meeting properties for the user's portal
 */
export async function getHubSpotMeetingProperties(
  accessToken: string
): Promise<{ name: string; label: string; type: string }[]> {
  try {
    const response = await hubspotFetch(
      accessToken,
      '/crm/v3/properties/meetings'
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'Failed to fetch HubSpot meeting properties', { error });
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((p: { name: string; label: string; type: string }) => ({
      name: p.name,
      label: p.label,
      type: p.type,
    }));
  } catch (error) {
    log('error', 'Error fetching HubSpot meeting properties', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Contact record from HubSpot
 */
export interface HubSpotContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

/**
 * Meeting engagement data for HubSpot
 */
export interface HubSpotMeetingData {
  meetingTitle: string;
  meetingDate: Date;
  duration?: number; // in milliseconds
  platform: 'zoom' | 'microsoft_teams' | 'google_meet';
  draftSubject: string;
  draftBody: string;
  contactId?: string;
  fieldMappings?: HubSpotFieldMapping[];
  sentimentScore?: number;
  sentimentLabel?: string;
  emotionalTones?: string;
}

/**
 * Result of HubSpot CRM sync
 */
export interface HubSpotSyncResult {
  success: boolean;
  contactFound: boolean;
  contactId?: string;
  contactName?: string;
  engagementId?: string;
  error?: string;
}

/**
 * Search for a contact by email address
 */
export async function searchHubSpotContactByEmail(
  accessToken: string,
  email: string
): Promise<HubSpotContact | null> {
  const normalizedEmail = email.toLowerCase().trim();

  log('info', 'Searching HubSpot for contact', { email: normalizedEmail });

  try {
    const response = await hubspotFetch(
      accessToken,
      '/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: normalizedEmail,
                },
              ],
            },
          ],
          properties: ['email', 'firstname', 'lastname', 'company'],
          limit: 1,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'HubSpot contact search failed', { error });
      return null;
    }

    const data = await response.json();

    if (data.results.length === 0) {
      log('info', 'No HubSpot contact found', { email: normalizedEmail });
      return null;
    }

    const contact = data.results[0];
    const result: HubSpotContact = {
      id: contact.id,
      email: contact.properties.email,
      firstName: contact.properties.firstname,
      lastName: contact.properties.lastname,
      company: contact.properties.company,
    };

    log('info', 'HubSpot contact found', {
      contactId: result.id,
      email: result.email,
    });

    return result;
  } catch (error) {
    log('error', 'HubSpot contact search error', {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create a contact in HubSpot when one doesn't exist
 */
export async function createHubSpotContact(
  accessToken: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<HubSpotContact | null> {
  const normalizedEmail = email.toLowerCase().trim();

  log('info', 'Creating HubSpot contact', { email: normalizedEmail });

  try {
    const properties: Record<string, string> = { email: normalizedEmail };
    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;

    const response = await hubspotFetch(
      accessToken,
      '/crm/v3/objects/contacts',
      {
        method: 'POST',
        body: JSON.stringify({ properties }),
      }
    );

    if (response.status === 409) {
      // Contact already exists (race condition) — search again
      log('info', 'HubSpot contact already exists, searching again', { email: normalizedEmail });
      return searchHubSpotContactByEmail(accessToken, normalizedEmail);
    }

    if (!response.ok) {
      const error = await response.text();
      log('error', 'HubSpot contact creation failed', { error, email: normalizedEmail });
      return null;
    }

    const data = await response.json();
    const contact: HubSpotContact = {
      id: data.id,
      email: data.properties.email,
      firstName: data.properties.firstname,
      lastName: data.properties.lastname,
      company: data.properties.company,
    };

    log('info', 'HubSpot contact created', { contactId: contact.id, email: contact.email });
    return contact;
  } catch (error) {
    log('error', 'HubSpot contact creation error', {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create a meeting engagement in HubSpot
 */
export async function createHubSpotMeetingEngagement(
  accessToken: string,
  data: HubSpotMeetingData
): Promise<string | null> {
  log('info', 'Creating HubSpot meeting engagement', {
    meetingTitle: data.meetingTitle,
    platform: data.platform,
    hasContact: !!data.contactId,
  });

  const platformNames = {
    zoom: 'Zoom',
    microsoft_teams: 'Microsoft Teams',
    google_meet: 'Google Meet',
  };

  const meetingBody = `Meeting: ${data.meetingTitle}
Platform: ${platformNames[data.platform]}
Date: ${data.meetingDate.toISOString()}

Follow-up Email Subject: ${data.draftSubject}

Follow-up Email:
${data.draftBody}`;

  try {
    const endTime = data.duration
      ? new Date(data.meetingDate.getTime() + data.duration).toISOString()
      : new Date(data.meetingDate.getTime() + 30 * 60 * 1000).toISOString(); // Default 30 min

    // Resolve source field values
    const sourceValues: Record<HubSpotFieldMapping['sourceField'], string> = {
      timestamp: data.meetingDate.toISOString(),
      meeting_title: data.meetingTitle,
      meeting_body: meetingBody,
      meeting_start: data.meetingDate.toISOString(),
      meeting_end: endTime,
      meeting_outcome: 'COMPLETED',
      sentiment_score: data.sentimentScore != null ? String(data.sentimentScore) : '',
      sentiment_label: data.sentimentLabel ?? '',
      emotional_tones: data.emotionalTones ?? '',
    };

    // Build properties from field mappings (custom or default)
    const mappings = data.fieldMappings ?? DEFAULT_FIELD_MAPPINGS;
    const properties: Record<string, string> = {};
    for (const mapping of mappings) {
      if (mapping.enabled) {
        properties[mapping.hubspotProperty] = sourceValues[mapping.sourceField];
      }
    }

    // Build request body with inline associations when contact is available
    const requestBody: Record<string, unknown> = { properties };

    // Use inline associations (created atomically with the meeting)
    if (data.contactId) {
      requestBody.associations = [
        {
          to: { id: data.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 200, // meeting_to_contact
            },
          ],
        },
      ];
    }

    const response = await hubspotFetch(
      accessToken,
      '/crm/v3/objects/meetings',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'HubSpot meeting creation failed', {
        error,
        status: response.status,
      });
      return null;
    }

    const engagement = await response.json();
    const engagementId = engagement.id;

    log('info', 'HubSpot meeting created', {
      engagementId,
      associatedContact: data.contactId || null,
    });

    return engagementId;
  } catch (error) {
    log('error', 'HubSpot meeting creation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Sync a sent email to HubSpot CRM
 * This is the main entry point called after email is sent.
 * Non-blocking - failures are logged but don't throw.
 */
export async function syncSentEmailToHubSpot(
  accessToken: string,
  params: {
    recipientEmail: string;
    meetingTitle: string;
    meetingDate: Date;
    platform: 'zoom' | 'microsoft_teams' | 'google_meet';
    duration?: number;
    draftSubject: string;
    draftBody: string;
    fieldMappings?: HubSpotFieldMapping[];
    sentimentScore?: number;
    sentimentLabel?: string;
    emotionalTones?: string;
  }
): Promise<HubSpotSyncResult> {
  const {
    recipientEmail,
    meetingTitle,
    meetingDate,
    platform,
    duration,
    draftSubject,
    draftBody,
    fieldMappings,
    sentimentScore,
    sentimentLabel,
    emotionalTones,
  } = params;

  log('info', 'Starting HubSpot CRM sync', {
    recipientEmail,
    meetingTitle,
    platform,
  });

  try {
    // Step 1: Search for contact by email, create if not found
    let contact = await searchHubSpotContactByEmail(accessToken, recipientEmail);

    if (!contact) {
      log('info', 'Contact not found, creating in HubSpot', { recipientEmail });
      contact = await createHubSpotContact(accessToken, recipientEmail);
    }

    // Step 2: Create meeting engagement
    const meetingData: HubSpotMeetingData = {
      meetingTitle,
      meetingDate,
      duration,
      platform,
      draftSubject,
      draftBody,
      contactId: contact?.id,
      fieldMappings,
      sentimentScore,
      sentimentLabel,
      emotionalTones,
    };

    const engagementId = await createHubSpotMeetingEngagement(accessToken, meetingData);

    const result: HubSpotSyncResult = {
      success: !!engagementId,
      contactFound: !!contact,
      contactId: contact?.id,
      contactName: contact ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') || undefined : undefined,
      engagementId: engagementId || undefined,
    };

    log('info', 'HubSpot CRM sync completed', {
      ...result,
      recipientEmail,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', 'HubSpot CRM sync failed', {
      recipientEmail,
      error: errorMessage,
    });

    return {
      success: false,
      contactFound: false,
      error: errorMessage,
    };
  }
}
