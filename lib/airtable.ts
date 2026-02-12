/**
 * Airtable CRM Integration
 *
 * Handles contact matching and meeting logging to Airtable.
 * Non-blocking - email delivery takes priority over CRM logging.
 */

import Airtable from 'airtable';

// Configuration from environment
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Table names
const CONTACTS_TABLE = 'Contacts';
const MEETINGS_TABLE = 'Meetings';

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Initialize Airtable base (lazy)
let base: Airtable.Base | null = null;

function getBase(): Airtable.Base {
  if (!base) {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Airtable credentials not configured');
    }
    Airtable.configure({ apiKey: AIRTABLE_API_KEY });
    base = Airtable.base(AIRTABLE_BASE_ID);
  }
  return base;
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
 * Check if Airtable is configured
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
 *
 * @param email - Email address to search for
 * @returns Contact record or null if not found
 */
export async function searchContactByEmail(
  email: string
): Promise<AirtableContact | null> {
  if (!isAirtableConfigured()) {
    log('warn', 'Airtable not configured, skipping contact search');
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();

  log('info', 'Searching for contact by email', { email: normalizedEmail });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const records = await getBase()(CONTACTS_TABLE)
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
 *
 * @param data - Meeting data to create
 * @returns Record ID or null on failure
 */
export async function createMeetingRecord(
  data: MeetingData
): Promise<string | null> {
  if (!isAirtableConfigured()) {
    log('warn', 'Airtable not configured, skipping meeting record creation');
    return null;
  }

  log('info', 'Creating meeting record', {
    meetingTitle: data.meetingTitle,
    platform: data.platform,
    hasContact: !!data.contactId,
  });

  // Map platform to display name
  const platformDisplayName = {
    zoom: 'Zoom',
    microsoft_teams: 'Microsoft Teams',
    google_meet: 'Google Meet',
  }[data.platform] || data.platform;

  // Build fields object
  // Using Airtable.FieldSet type with explicit cast for flexibility
  const fields: Airtable.FieldSet = {
    'Meeting Title': data.meetingTitle,
    'Meeting Date': data.meetingDate.toISOString().split('T')[0], // YYYY-MM-DD format
    'Platform': platformDisplayName,
    'Draft Subject': data.draftSubject.substring(0, 255), // Truncate if too long
    'Draft Body': data.draftBody,
    'Email Sent': data.emailSent,
  };

  // Add optional fields
  if (data.duration) {
    fields['Duration'] = data.duration;
  }

  if (data.zoomMeetingId) {
    fields['Zoom Meeting ID'] = data.zoomMeetingId;
  }

  if (data.teamsMeetingId) {
    fields['Teams Meeting ID'] = data.teamsMeetingId;
  }

  if (data.googleMeetId) {
    fields['Google Meet ID'] = data.googleMeetId;
  }

  // Link to contact if found
  if (data.contactId) {
    fields['Contact'] = [data.contactId];
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const record = await getBase()(MEETINGS_TABLE).create(fields);

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
 *
 * @param contactId - Airtable contact record ID
 * @param date - Date of the meeting
 */
export async function updateContactLastMeeting(
  contactId: string,
  date: Date
): Promise<boolean> {
  if (!isAirtableConfigured()) {
    return false;
  }

  log('info', 'Updating contact last meeting date', { contactId });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await getBase()(CONTACTS_TABLE).update(contactId, {
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
 * Non-blocking - failures are logged but don't throw.
 *
 * @param params - Sync parameters
 * @returns Sync result (success/failure status)
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
  } = params;

  if (!isAirtableConfigured()) {
    log('info', 'Airtable not configured, skipping CRM sync');
    return { success: true, contactFound: false };
  }

  log('info', 'Starting CRM sync for sent email', {
    recipientEmail,
    meetingTitle,
    platform,
  });

  try {
    // Step 1: Search for contact by email
    const contact = await searchContactByEmail(recipientEmail);

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

    const meetingRecordId = await createMeetingRecord(meetingData);

    // Step 3: Update contact's last meeting date if contact was found
    if (contact && meetingRecordId) {
      await updateContactLastMeeting(contact.id, meetingDate);
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
