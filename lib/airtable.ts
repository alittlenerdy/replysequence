/**
 * Airtable CRM Integration
 *
 * Handles contact matching and meeting logging to Airtable.
 * Supports per-user credentials (from DB) with fallback to env vars.
 * Non-blocking - email delivery takes priority over CRM logging.
 */

import Airtable from 'airtable';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { airtableConnections } from '@/lib/db/schema';
import { decrypt } from '@/lib/encryption';

// Environment fallback configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Airtable credentials (per-user or from env)
 */
interface AirtableCredentials {
  apiKey: string;
  baseId: string;
  contactsTable: string;
  meetingsTable: string;
}

/**
 * Create an Airtable base instance from credentials
 */
function createBase(creds: AirtableCredentials): Airtable.Base {
  Airtable.configure({ apiKey: creds.apiKey });
  return Airtable.base(creds.baseId);
}

/**
 * Get per-user Airtable credentials, falling back to env vars
 */
async function getCredentials(userId?: string): Promise<AirtableCredentials | null> {
  // Try per-user credentials first
  if (userId) {
    const connection = await db.query.airtableConnections.findFirst({
      where: eq(airtableConnections.userId, userId),
    });
    if (connection) {
      return {
        apiKey: decrypt(connection.apiKeyEncrypted),
        baseId: connection.baseId,
        contactsTable: connection.contactsTable,
        meetingsTable: connection.meetingsTable,
      };
    }
  }

  // Fall back to environment variables
  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
    return {
      apiKey: AIRTABLE_API_KEY,
      baseId: AIRTABLE_BASE_ID,
      contactsTable: 'Contacts',
      meetingsTable: 'Meetings',
    };
  }

  return null;
}

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
      service: 'airtable',
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
 * Check if Airtable is configured (env vars only - for backward compat)
 */
export function isAirtableConfigured(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);
}

/**
 * Contact record from Airtable
 */
export interface AirtableContact {
  id: string;
  email: string;
  name?: string;
  companyId?: string;
  lastMeetingDate?: string;
}

/**
 * Meeting data for creating Airtable record
 */
export interface MeetingData {
  meetingTitle: string;
  meetingDate: Date;
  platform: 'zoom' | 'microsoft_teams' | 'google_meet';
  duration?: number;
  draftSubject: string;
  draftBody: string;
  emailSent: boolean;
  zoomMeetingId?: string;
  teamsMeetingId?: string;
  googleMeetId?: string;
  contactId?: string;
}

/**
 * Result of Airtable CRM sync
 */
export interface CrmSyncResult {
  success: boolean;
  contactFound: boolean;
  contactId?: string;
  meetingRecordId?: string;
  error?: string;
}

/**
 * Search for a contact by email address
 */
async function searchContactByEmail(
  creds: AirtableCredentials,
  email: string
): Promise<AirtableContact | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const base = createBase(creds);

  log('info', 'Searching for contact by email', { email: normalizedEmail });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const records = await base(creds.contactsTable)
        .select({
          filterByFormula: `LOWER({Email}) = '${normalizedEmail}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) {
        log('info', 'No contact found for email', { email: normalizedEmail });
        return null;
      }

      const record = records[0];
      const contact: AirtableContact = {
        id: record.id,
        email: record.get('Email') as string,
        name: record.get('Name') as string | undefined,
        companyId: (record.get('Company') as string[] | undefined)?.[0],
        lastMeetingDate: record.get('Last Meeting Date') as string | undefined,
      };

      log('info', 'Contact found', {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
      });

      return contact;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt < MAX_RETRIES) {
        log('warn', 'Contact search failed, retrying', {
          attempt,
          error: errorMessage,
        });
        await sleep(RETRY_DELAY_MS);
      } else {
        log('error', 'Contact search failed after retries', {
          email: normalizedEmail,
          attempts: attempt,
          error: errorMessage,
        });
        return null;
      }
    }
  }

  return null;
}

/**
 * Create a meeting record in Airtable
 */
async function createMeetingRecord(
  creds: AirtableCredentials,
  data: MeetingData
): Promise<string | null> {
  const base = createBase(creds);

  log('info', 'Creating meeting record', {
    meetingTitle: data.meetingTitle,
    platform: data.platform,
    hasContact: !!data.contactId,
  });

  const platformDisplayName = {
    zoom: 'Zoom',
    microsoft_teams: 'Microsoft Teams',
    google_meet: 'Google Meet',
  }[data.platform] || data.platform;

  const fields: Airtable.FieldSet = {
    'Meeting Title': data.meetingTitle,
    'Meeting Date': data.meetingDate.toISOString().split('T')[0],
    'Platform': platformDisplayName,
    'Draft Subject': data.draftSubject.substring(0, 255),
    'Draft Body': data.draftBody,
    'Email Sent': data.emailSent,
  };

  if (data.duration) fields['Duration'] = data.duration;
  if (data.zoomMeetingId) fields['Zoom Meeting ID'] = data.zoomMeetingId;
  if (data.teamsMeetingId) fields['Teams Meeting ID'] = data.teamsMeetingId;
  if (data.googleMeetId) fields['Google Meet ID'] = data.googleMeetId;
  if (data.contactId) fields['Contact'] = [data.contactId];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const record = await base(creds.meetingsTable).create(fields);

      log('info', 'Meeting record created', {
        meetingRecordId: record.getId(),
        meetingTitle: data.meetingTitle,
        contactLinked: !!data.contactId,
      });

      return record.getId();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt < MAX_RETRIES) {
        log('warn', 'Meeting record creation failed, retrying', {
          attempt,
          error: errorMessage,
        });
        await sleep(RETRY_DELAY_MS);
      } else {
        log('error', 'Meeting record creation failed after retries', {
          meetingTitle: data.meetingTitle,
          attempts: attempt,
          error: errorMessage,
        });
        return null;
      }
    }
  }

  return null;
}

/**
 * Update a contact's last meeting date
 */
async function updateContactLastMeeting(
  creds: AirtableCredentials,
  contactId: string,
  date: Date
): Promise<boolean> {
  const base = createBase(creds);

  log('info', 'Updating contact last meeting date', { contactId });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await base(creds.contactsTable).update(contactId, {
        'Last Meeting Date': date.toISOString().split('T')[0],
      });

      log('info', 'Contact last meeting date updated', { contactId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt < MAX_RETRIES) {
        log('warn', 'Contact update failed, retrying', {
          attempt,
          contactId,
          error: errorMessage,
        });
        await sleep(RETRY_DELAY_MS);
      } else {
        log('error', 'Contact update failed after retries', {
          contactId,
          attempts: attempt,
          error: errorMessage,
        });
        return false;
      }
    }
  }

  return false;
}

/**
 * Sync a sent email to Airtable CRM
 * This is the main entry point called after email is sent.
 * Looks up per-user Airtable credentials, falls back to env vars.
 * Non-blocking - failures are logged but don't throw.
 */
export async function syncSentEmailToCrm(params: {
  recipientEmail: string;
  meetingTitle: string;
  meetingDate: Date;
  platform: 'zoom' | 'microsoft_teams' | 'google_meet';
  duration?: number;
  draftSubject: string;
  draftBody: string;
  platformMeetingId?: string;
  userId?: string;
}): Promise<CrmSyncResult> {
  const {
    recipientEmail,
    meetingTitle,
    meetingDate,
    platform,
    duration,
    draftSubject,
    draftBody,
    platformMeetingId,
    userId,
  } = params;

  const creds = await getCredentials(userId);
  if (!creds) {
    log('info', 'Airtable not configured, skipping CRM sync');
    return { success: true, contactFound: false };
  }

  log('info', 'Starting CRM sync for sent email', {
    recipientEmail,
    meetingTitle,
    platform,
    source: userId ? 'per-user' : 'env',
  });

  try {
    // Step 1: Search for contact by email
    const contact = await searchContactByEmail(creds, recipientEmail);

    // Step 2: Create meeting record (with or without contact link)
    const meetingData: MeetingData = {
      meetingTitle,
      meetingDate,
      platform,
      duration,
      draftSubject,
      draftBody,
      emailSent: true,
      contactId: contact?.id,
      zoomMeetingId: platform === 'zoom' ? platformMeetingId : undefined,
      teamsMeetingId: platform === 'microsoft_teams' ? platformMeetingId : undefined,
      googleMeetId: platform === 'google_meet' ? platformMeetingId : undefined,
    };

    const meetingRecordId = await createMeetingRecord(creds, meetingData);

    // Step 3: Update contact's last meeting date if contact was found
    if (contact && meetingRecordId) {
      await updateContactLastMeeting(creds, contact.id, meetingDate);
    }

    // Update lastSyncAt for per-user connections
    if (userId && meetingRecordId) {
      await db
        .update(airtableConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(airtableConnections.userId, userId));
    }

    const result: CrmSyncResult = {
      success: !!meetingRecordId,
      contactFound: !!contact,
      contactId: contact?.id,
      meetingRecordId: meetingRecordId || undefined,
    };

    log('info', 'CRM sync completed', {
      ...result,
      recipientEmail,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', 'CRM sync failed', {
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
