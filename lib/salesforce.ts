/**
 * Salesforce CRM Integration
 *
 * Handles contact matching and activity logging to Salesforce.
 * Uses OAuth2 Web Server Flow for authentication.
 * Non-blocking - email delivery takes priority over CRM logging.
 */

import type { SalesforceFieldMapping } from './db/schema';

// Configuration from environment
const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET;
const SALESFORCE_REDIRECT_URI = process.env.SALESFORCE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`;

// Salesforce OAuth endpoints (login.salesforce.com for production, test.salesforce.com for sandbox)
const SF_AUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SF_TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';

// Required Salesforce OAuth scopes
const SALESFORCE_SCOPES = [
  'api',           // REST API access
  'refresh_token', // Offline access (refresh tokens)
  'openid',        // OpenID Connect (user identity)
].join(' ');

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Default field mappings for Salesforce Events
export const DEFAULT_SALESFORCE_FIELD_MAPPINGS: SalesforceFieldMapping[] = [
  { sourceField: 'meeting_title', salesforceField: 'Subject', enabled: true },
  { sourceField: 'meeting_body', salesforceField: 'Description', enabled: true },
  { sourceField: 'meeting_start', salesforceField: 'StartDateTime', enabled: true },
  { sourceField: 'meeting_end', salesforceField: 'EndDateTime', enabled: true },
  { sourceField: 'meeting_outcome', salesforceField: 'Description', enabled: false },
  { sourceField: 'timestamp', salesforceField: 'ActivityDateTime', enabled: false },
];

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[SALESFORCE]', message, ...data }));
}

// --- Configuration Helpers ---

export function isSalesforceConfigured(): boolean {
  return !!(SALESFORCE_CLIENT_ID && SALESFORCE_CLIENT_SECRET);
}

export function getSalesforceAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SALESFORCE_CLIENT_ID!,
    redirect_uri: SALESFORCE_REDIRECT_URI,
    scope: SALESFORCE_SCOPES,
    state,
    prompt: 'consent', // Always show consent screen to get refresh token
  });

  return `${SF_AUTH_URL}?${params.toString()}`;
}

// --- Token Exchange & Refresh ---

interface SalesforceTokenResponse {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  id: string; // Identity URL: https://login.salesforce.com/id/orgId/userId
  token_type: string;
  issued_at: string;
  signature: string;
  scope: string;
}

export async function exchangeSalesforceCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  identityUrl: string;
  scopes: string;
}> {
  const response = await fetch(SF_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SALESFORCE_CLIENT_ID!,
      client_secret: SALESFORCE_CLIENT_SECRET!,
      redirect_uri: SALESFORCE_REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('error', 'Token exchange failed', { status: response.status, error: errorText });
    throw new Error(`Salesforce token exchange failed: ${response.status}`);
  }

  const data: SalesforceTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    instanceUrl: data.instance_url,
    identityUrl: data.id,
    scopes: data.scope || SALESFORCE_SCOPES,
  };
}

export async function refreshSalesforceToken(refreshToken: string): Promise<{
  accessToken: string;
  instanceUrl: string;
}> {
  const response = await fetch(SF_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: SALESFORCE_CLIENT_ID!,
      client_secret: SALESFORCE_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('error', 'Token refresh failed', { status: response.status, error: errorText });
    throw new Error(`Salesforce token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
  };
}

// --- Identity ---

export async function getSalesforceUserInfo(accessToken: string, identityUrl: string): Promise<{
  userId: string;
  orgId: string;
  email: string;
  displayName: string;
}> {
  const response = await fetch(identityUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Salesforce user info: ${response.status}`);
  }

  const data = await response.json();
  return {
    userId: data.user_id,
    orgId: data.organization_id,
    email: data.email,
    displayName: data.display_name,
  };
}

// --- API Helpers ---

async function sfFetch(
  instanceUrl: string,
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${instanceUrl}/services/data/v66.0${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

async function sfFetchWithRetry(
  instanceUrl: string,
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await sfFetch(instanceUrl, accessToken, path, options);
    if (response.ok || response.status < 500) return response;
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  return sfFetch(instanceUrl, accessToken, path, options);
}

// --- Contact Search ---

export async function findSalesforceContact(
  instanceUrl: string,
  accessToken: string,
  email: string
): Promise<{ id: string; type: 'Contact' | 'Lead'; name: string; email: string } | null> {
  // Search Contacts first
  const contactQuery = encodeURIComponent(
    `SELECT Id, Name, Email FROM Contact WHERE Email = '${email.replace(/'/g, "\\'")}' LIMIT 1`
  );
  const contactResponse = await sfFetchWithRetry(instanceUrl, accessToken, `/query?q=${contactQuery}`);

  if (contactResponse.ok) {
    const contactData = await contactResponse.json();
    if (contactData.totalSize > 0) {
      const record = contactData.records[0];
      return { id: record.Id, type: 'Contact', name: record.Name, email: record.Email };
    }
  }

  // Fall back to Leads
  const leadQuery = encodeURIComponent(
    `SELECT Id, Name, Email FROM Lead WHERE Email = '${email.replace(/'/g, "\\'")}' LIMIT 1`
  );
  const leadResponse = await sfFetchWithRetry(instanceUrl, accessToken, `/query?q=${leadQuery}`);

  if (leadResponse.ok) {
    const leadData = await leadResponse.json();
    if (leadData.totalSize > 0) {
      const record = leadData.records[0];
      return { id: record.Id, type: 'Lead', name: record.Name, email: record.Email };
    }
  }

  return null;
}

// --- Activity Logging ---

export interface SalesforceSyncResult {
  success: boolean;
  contactId?: string;
  contactType?: 'Contact' | 'Lead';
  eventId?: string;
  taskId?: string;
  error?: string;
}

export async function syncSentEmailToSalesforce(
  instanceUrl: string,
  accessToken: string,
  params: {
    recipientEmail: string;
    meetingTitle: string;
    meetingDate: Date;
    platform: 'zoom' | 'microsoft_teams' | 'google_meet';
    draftSubject: string;
    draftBody: string;
    fieldMappings?: SalesforceFieldMapping[];
    sentimentScore?: number;
    sentimentLabel?: string;
    emotionalTones?: string;
  }
): Promise<SalesforceSyncResult> {
  const { recipientEmail, meetingTitle, meetingDate, platform, draftSubject, draftBody } = params;

  log('info', 'Starting Salesforce CRM sync', { recipientEmail, meetingTitle, platform });

  try {
    // 1. Find the contact/lead
    const contact = await findSalesforceContact(instanceUrl, accessToken, recipientEmail);
    if (!contact) {
      log('info', 'No matching Contact/Lead found in Salesforce', { recipientEmail });
      return { success: true }; // Not an error, just no contact to link
    }

    log('info', 'Found Salesforce record', {
      contactId: contact.id,
      contactType: contact.type,
      contactName: contact.name,
    });

    // 2. Create an Event (meeting activity)
    const platformLabel = platform === 'zoom' ? 'Zoom' : platform === 'microsoft_teams' ? 'Teams' : 'Google Meet';
    const meetingEnd = new Date(meetingDate.getTime() + 30 * 60 * 1000); // Default 30 min duration

    // Build sentiment section for description
    let sentimentSection = '';
    if (params.sentimentScore != null || params.sentimentLabel || params.emotionalTones) {
      sentimentSection = '\n\nSentiment Analysis:';
      if (params.sentimentLabel) sentimentSection += `\nOverall: ${params.sentimentLabel}`;
      if (params.sentimentScore != null) sentimentSection += ` (${params.sentimentScore.toFixed(2)})`;
      if (params.emotionalTones) sentimentSection += `\nTones: ${params.emotionalTones}`;
    }

    const meetingDescription = `Meeting: ${meetingTitle}\nPlatform: ${platformLabel}\n\nFollow-up email sent via ReplySequence.\nSubject: ${draftSubject}${sentimentSection}`;

    // Resolve source field values for field mapping
    const sourceValues: Record<SalesforceFieldMapping['sourceField'], string> = {
      meeting_title: `${platformLabel} Meeting: ${meetingTitle}`,
      meeting_body: meetingDescription,
      meeting_start: meetingDate.toISOString(),
      meeting_end: meetingEnd.toISOString(),
      meeting_outcome: 'Completed',
      timestamp: meetingDate.toISOString(),
      sentiment_score: params.sentimentScore != null ? String(params.sentimentScore) : '',
      sentiment_label: params.sentimentLabel ?? '',
      emotional_tones: params.emotionalTones ?? '',
    };

    // Build event body from field mappings or defaults
    const mappings = params.fieldMappings ?? DEFAULT_SALESFORCE_FIELD_MAPPINGS;
    const eventBody: Record<string, unknown> = {
      WhoId: contact.id, // Link to Contact or Lead
      Type: 'Meeting',
    };
    for (const mapping of mappings) {
      if (mapping.enabled && sourceValues[mapping.sourceField]) {
        eventBody[mapping.salesforceField] = sourceValues[mapping.sourceField];
      }
    }
    // Ensure Subject is always set (fallback if not mapped)
    if (!eventBody.Subject) {
      eventBody.Subject = `${platformLabel} Meeting: ${meetingTitle}`;
    }
    // Ensure StartDateTime and EndDateTime are always set (required by Salesforce API)
    if (!eventBody.StartDateTime) {
      eventBody.StartDateTime = meetingDate.toISOString();
    }
    if (!eventBody.EndDateTime) {
      eventBody.EndDateTime = meetingEnd.toISOString();
    }

    const eventResponse = await sfFetchWithRetry(instanceUrl, accessToken, '/sobjects/Event', {
      method: 'POST',
      body: JSON.stringify(eventBody),
    });

    let eventId: string | undefined;
    if (eventResponse.ok) {
      const eventResult = await eventResponse.json();
      eventId = eventResult.id;
      log('info', 'Created Salesforce Event', { eventId });
    } else {
      const eventError = await eventResponse.text();
      log('warn', 'Failed to create Salesforce Event', { error: eventError });
    }

    // 3. Create a Task for the sent email
    const taskBody: Record<string, unknown> = {
      Subject: `Email: ${draftSubject}`,
      Description: `Follow-up email sent via ReplySequence after ${platformLabel} meeting: ${meetingTitle}${sentimentSection}\n\n---\n\n${draftBody}`,
      WhoId: contact.id,
      Status: 'Completed',
      Priority: 'Normal',
      Type: 'Email',
      ActivityDate: new Date().toISOString().split('T')[0], // Date only
    };

    const taskResponse = await sfFetchWithRetry(instanceUrl, accessToken, '/sobjects/Task', {
      method: 'POST',
      body: JSON.stringify(taskBody),
    });

    let taskId: string | undefined;
    if (taskResponse.ok) {
      const taskResult = await taskResponse.json();
      taskId = taskResult.id;
      log('info', 'Created Salesforce Task', { taskId });
    } else {
      const taskError = await taskResponse.text();
      log('warn', 'Failed to create Salesforce Task', { error: taskError });
    }

    return {
      success: true,
      contactId: contact.id,
      contactType: contact.type,
      eventId,
      taskId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('error', 'Salesforce sync failed', { error: message, recipientEmail });
    return { success: false, error: message };
  }
}
