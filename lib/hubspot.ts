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
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.objects.meetings.read',
  'crm.objects.meetings.write',
  'sales-email-read',
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

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        log('warn', 'HubSpot rate limited, waiting', { retryAfter, attempt });
        await sleep(retryAfter * 1000);
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
}

/**
 * Result of HubSpot CRM sync
 */
export interface HubSpotSyncResult {
  success: boolean;
  contactFound: boolean;
  contactId?: string;
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
    // Create the engagement
    const response = await hubspotFetch(
      accessToken,
      '/crm/v3/objects/meetings',
      {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            hs_meeting_title: data.meetingTitle,
            hs_meeting_body: meetingBody,
            hs_meeting_start_time: data.meetingDate.toISOString(),
            hs_meeting_end_time: data.duration
              ? new Date(data.meetingDate.getTime() + data.duration).toISOString()
              : new Date(data.meetingDate.getTime() + 30 * 60 * 1000).toISOString(), // Default 30 min
            hs_meeting_outcome: 'COMPLETED',
            hs_meeting_external_url: '', // Could add recording link
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'HubSpot meeting creation failed', { error });
      return null;
    }

    const engagement = await response.json();
    const engagementId = engagement.id;

    log('info', 'HubSpot meeting created', { engagementId });

    // Associate with contact if provided
    if (data.contactId) {
      const assocResponse = await hubspotFetch(
        accessToken,
        `/crm/v3/objects/meetings/${engagementId}/associations/contacts/${data.contactId}/meeting_to_contact`,
        { method: 'PUT' }
      );

      if (!assocResponse.ok) {
        log('warn', 'Failed to associate meeting with contact', {
          engagementId,
          contactId: data.contactId,
        });
      } else {
        log('info', 'Meeting associated with contact', {
          engagementId,
          contactId: data.contactId,
        });
      }
    }

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
  } = params;

  log('info', 'Starting HubSpot CRM sync', {
    recipientEmail,
    meetingTitle,
    platform,
  });

  try {
    // Step 1: Search for contact by email
    const contact = await searchHubSpotContactByEmail(accessToken, recipientEmail);

    // Step 2: Create meeting engagement
    const meetingData: HubSpotMeetingData = {
      meetingTitle,
      meetingDate,
      duration,
      platform,
      draftSubject,
      draftBody,
      contactId: contact?.id,
    };

    const engagementId = await createHubSpotMeetingEngagement(accessToken, meetingData);

    const result: HubSpotSyncResult = {
      success: !!engagementId,
      contactFound: !!contact,
      contactId: contact?.id,
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
