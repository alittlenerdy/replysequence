/**
 * Google Sheets CRM Integration
 * Syncs meeting data and sent emails to a user's Google Sheet.
 *
 * Features:
 * - Auto-creates header row if sheet is empty
 * - Searches for existing contact by email (dedup)
 * - Updates existing row or appends new one
 * - Token refresh when expired
 */

import { db, users } from './db';
import { sheetsConnections, DEFAULT_SHEETS_COLUMNS } from './db/schema';
import type { SheetsColumnMapping } from './db/schema';
import { decrypt, encrypt } from './encryption';
import { eq } from 'drizzle-orm';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface SheetsSyncData {
  recipientEmail: string;
  meetingTitle: string;
  meetingDate: Date;
  platform: 'zoom' | 'microsoft_teams' | 'google_meet';
  draftSubject: string;
  draftBody: string;
}

interface SheetsSyncResult {
  success: boolean;
  contactFound: boolean;
  rowUpdated: boolean;
  error?: string;
}

/**
 * Refresh an expired Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SHEETS-SYNC] Token refresh failed:', { status: response.status, error: errorText });
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get a valid access token for a Sheets connection, refreshing if needed
 */
async function getValidAccessToken(connectionId: string): Promise<string | null> {
  const connection = await db.query.sheetsConnections.findFirst({
    where: eq(sheetsConnections.id, connectionId),
  });

  if (!connection) return null;

  let accessToken = decrypt(connection.accessTokenEncrypted);

  // Refresh if expired (with 60s buffer)
  if (connection.accessTokenExpiresAt < new Date(Date.now() + 60_000)) {
    try {
      const refreshToken = decrypt(connection.refreshTokenEncrypted);
      const refreshed = await refreshGoogleToken(refreshToken);
      accessToken = refreshed.accessToken;

      await db
        .update(sheetsConnections)
        .set({
          accessTokenEncrypted: encrypt(refreshed.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sheetsConnections.id, connectionId));
    } catch (err) {
      console.error('[SHEETS-SYNC] Token refresh failed:', err);
      return null;
    }
  }

  return accessToken;
}

/**
 * Make an authenticated request to the Google Sheets API
 */
async function sheetsApiRequest(
  accessToken: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Ensure the target sheet tab exists and has headers
 */
async function ensureSheetHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetTab: string,
  columns: SheetsColumnMapping[]
): Promise<void> {
  const enabledColumns = columns.filter(c => c.enabled);
  const range = `'${sheetTab}'!A1:${String.fromCharCode(64 + enabledColumns.length)}1`;

  // Check if first row exists
  const getResponse = await sheetsApiRequest(
    accessToken,
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!getResponse.ok) {
    // Sheet tab might not exist, try to create it
    if (getResponse.status === 400) {
      await createSheetTab(accessToken, spreadsheetId, sheetTab);
    } else {
      const errorText = await getResponse.text();
      throw new Error(`Failed to read sheet: ${getResponse.status} - ${errorText}`);
    }
  }

  const data = getResponse.ok ? await getResponse.json() : null;
  const existingHeaders = data?.values?.[0];

  if (!existingHeaders || existingHeaders.length === 0) {
    // Write headers
    const headers = enabledColumns.map(c => c.header);
    const writeResponse = await sheetsApiRequest(
      accessToken,
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [headers] }),
      }
    );

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      throw new Error(`Failed to write headers: ${writeResponse.status} - ${errorText}`);
    }

    console.log('[SHEETS-SYNC] Created header row', { spreadsheetId, sheetTab, headers });
  }
}

/**
 * Create a new sheet tab in the spreadsheet
 */
async function createSheetTab(
  accessToken: string,
  spreadsheetId: string,
  sheetTab: string
): Promise<void> {
  const response = await sheetsApiRequest(
    accessToken,
    `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: { title: sheetTab },
          },
        }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    // Ignore "already exists" errors
    if (!errorText.includes('already exists')) {
      throw new Error(`Failed to create sheet tab: ${response.status} - ${errorText}`);
    }
  }
}

/**
 * Search for an existing row by email in column A
 */
async function findRowByEmail(
  accessToken: string,
  spreadsheetId: string,
  sheetTab: string,
  email: string
): Promise<number | null> {
  // Read all of column A to find email
  const range = `'${sheetTab}'!A:A`;
  const response = await sheetsApiRequest(
    accessToken,
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`
  );

  if (!response.ok) return null;

  const data = await response.json();
  const values = data.values || [];

  // Search from row 2 (skip header)
  for (let i = 1; i < values.length; i++) {
    if (values[i][0]?.toLowerCase() === email.toLowerCase()) {
      return i + 1; // 1-indexed row number
    }
  }

  return null;
}

/**
 * Build a row of values from sync data based on column mappings
 */
function buildRowValues(data: SheetsSyncData, columns: SheetsColumnMapping[]): string[] {
  const platformLabels: Record<string, string> = {
    zoom: 'Zoom',
    microsoft_teams: 'Microsoft Teams',
    google_meet: 'Google Meet',
  };

  const sourceValues: Record<string, string> = {
    contact_email: data.recipientEmail,
    meeting_title: data.meetingTitle,
    meeting_date: data.meetingDate.toISOString().split('T')[0],
    platform: platformLabels[data.platform] || data.platform,
    draft_subject: data.draftSubject,
    draft_body: data.draftBody.replace(/<[^>]*>/g, '').substring(0, 500), // Strip HTML, truncate
    sent_date: new Date().toISOString().split('T')[0],
  };

  return columns.filter(c => c.enabled).map(c => sourceValues[c.sourceField] || '');
}

/**
 * Main sync function — syncs a sent email to the user's Google Sheet
 */
export async function syncSentEmailToSheets(
  userId: string,
  data: SheetsSyncData
): Promise<SheetsSyncResult> {
  try {
    // Get connection
    const connection = await db.query.sheetsConnections.findFirst({
      where: eq(sheetsConnections.userId, userId),
    });

    if (!connection || !connection.spreadsheetId) {
      return { success: false, contactFound: false, rowUpdated: false, error: 'No Sheets connection or spreadsheet configured' };
    }

    // Get valid token
    const accessToken = await getValidAccessToken(connection.id);
    if (!accessToken) {
      return { success: false, contactFound: false, rowUpdated: false, error: 'Token refresh failed' };
    }

    const columns = connection.columnMappings ?? DEFAULT_SHEETS_COLUMNS;
    const sheetTab = connection.sheetTab || 'ReplySequence';

    // Ensure headers exist
    await ensureSheetHeaders(accessToken, connection.spreadsheetId, sheetTab, columns);

    // Check for existing contact row
    const existingRow = await findRowByEmail(accessToken, connection.spreadsheetId, sheetTab, data.recipientEmail);
    const rowValues = buildRowValues(data, columns);
    const enabledColumns = columns.filter(c => c.enabled);
    const lastColumn = String.fromCharCode(64 + enabledColumns.length);

    if (existingRow) {
      // Update existing row
      const range = `'${sheetTab}'!A${existingRow}:${lastColumn}${existingRow}`;
      const response = await sheetsApiRequest(
        accessToken,
        `${SHEETS_API_BASE}/${connection.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        {
          method: 'PUT',
          body: JSON.stringify({ values: [rowValues] }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, contactFound: true, rowUpdated: false, error: `Failed to update row: ${errorText}` };
      }

      console.log('[SHEETS-SYNC] Updated existing row', { row: existingRow, email: data.recipientEmail });

      await db
        .update(sheetsConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(sheetsConnections.id, connection.id));

      return { success: true, contactFound: true, rowUpdated: true };
    } else {
      // Append new row
      const range = `'${sheetTab}'!A:${lastColumn}`;
      const response = await sheetsApiRequest(
        accessToken,
        `${SHEETS_API_BASE}/${connection.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          body: JSON.stringify({ values: [rowValues] }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, contactFound: false, rowUpdated: false, error: `Failed to append row: ${errorText}` };
      }

      console.log('[SHEETS-SYNC] Appended new row', { email: data.recipientEmail });

      await db
        .update(sheetsConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(sheetsConnections.id, connection.id));

      return { success: true, contactFound: false, rowUpdated: false };
    }
  } catch (err) {
    console.error('[SHEETS-SYNC] Error:', err);
    return {
      success: false,
      contactFound: false,
      rowUpdated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * List spreadsheets available to the user (for sheet selection UI)
 */
export async function listUserSpreadsheets(
  accessToken: string
): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27&fields=files(id%2Cname)&orderBy=modifiedTime%20desc&pageSize=20',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list spreadsheets: ${response.status}`);
  }

  const data = await response.json();
  return (data.files || []).map((f: { id: string; name: string }) => ({
    id: f.id,
    name: f.name,
  }));
}
