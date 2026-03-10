import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  meetConnections,
  teamsConnections,
  zoomConnections,
  hubspotConnections,
  salesforceConnections,
  emailConnections,
  users,
} from '@/lib/db';
import { eq, lt, and, isNotNull } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/encryption';
import { refreshHubSpotToken } from '@/lib/hubspot';
import { refreshSalesforceToken } from '@/lib/salesforce';
import { refreshGmailToken, refreshOutlookToken } from '@/lib/email-sender';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Check tokens expiring within 24 hours
const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000;

type Platform = 'zoom' | 'meet' | 'teams' | 'hubspot' | 'salesforce' | 'email';

interface TokenCheckResult {
  platform: Platform;
  userId: string;
  connectionId: string;
  status: 'refreshed' | 'failed' | 'notified';
  error?: string;
}

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
      service: 'cron-token-health',
      ...data,
    })
  );
}

async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) return null;
  return response.json();
}

async function refreshTeamsToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const clientId = process.env.TEAMS_CLIENT_ID?.trim();
  const clientSecret = process.env.TEAMS_CLIENT_SECRET?.trim();
  const tenantId = process.env.TEAMS_TENANT_ID?.trim() || 'common';
  if (!clientId || !clientSecret) return null;

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    }
  );

  if (!response.ok) return null;
  return response.json();
}

async function refreshZoomToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) return null;
  return response.json();
}

async function notifyUser(userId: string, platforms: string[]): Promise<boolean> {
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) return false;

  const platformList = platforms.map((p) => `• ${p}`).join('\n');

  await sendEmail({
    to: user.email,
    subject: 'Action needed: Reconnect your accounts in ReplySequence',
    body: `Hi there,

We tried to refresh your connection tokens but ran into an issue with the following platforms:

${platformList}

To keep your meeting follow-ups working, please reconnect these accounts in your ReplySequence dashboard:

https://www.replysequence.com/dashboard/settings

If you need help, just reply to this email.

— The ReplySequence Team`,
  });

  return true;
}

async function checkAndRefreshTokens(expiryThreshold: Date): Promise<TokenCheckResult[]> {
  const results: TokenCheckResult[] = [];

  // Track failed refreshes per user to batch notifications
  const failedByUser = new Map<string, string[]>();

  function trackFailure(userId: string, platform: string) {
    const existing = failedByUser.get(userId) || [];
    existing.push(platform);
    failedByUser.set(userId, existing);
  }

  // --- Meet connections ---
  const expiringMeet = await db
    .select({ id: meetConnections.id, userId: meetConnections.userId, refreshTokenEncrypted: meetConnections.refreshTokenEncrypted })
    .from(meetConnections)
    .where(and(isNotNull(meetConnections.refreshTokenEncrypted), lt(meetConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringMeet) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      const tokens = await refreshGoogleToken(refreshToken);
      if (tokens) {
        await db.update(meetConnections).set({
          accessTokenEncrypted: encrypt(tokens.access_token),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          ...(tokens.refresh_token && { refreshTokenEncrypted: encrypt(tokens.refresh_token) }),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(meetConnections.id, conn.id));
        results.push({ platform: 'meet', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else {
        trackFailure(conn.userId, 'Google Meet');
        results.push({ platform: 'meet', userId: conn.userId, connectionId: conn.id, status: 'failed' });
      }
    } catch (error) {
      trackFailure(conn.userId, 'Google Meet');
      results.push({ platform: 'meet', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // --- Teams connections ---
  const expiringTeams = await db
    .select({ id: teamsConnections.id, userId: teamsConnections.userId, refreshTokenEncrypted: teamsConnections.refreshTokenEncrypted })
    .from(teamsConnections)
    .where(and(isNotNull(teamsConnections.refreshTokenEncrypted), lt(teamsConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringTeams) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      const tokens = await refreshTeamsToken(refreshToken);
      if (tokens) {
        await db.update(teamsConnections).set({
          accessTokenEncrypted: encrypt(tokens.access_token),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          ...(tokens.refresh_token && { refreshTokenEncrypted: encrypt(tokens.refresh_token) }),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(teamsConnections.id, conn.id));
        results.push({ platform: 'teams', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else {
        trackFailure(conn.userId, 'Microsoft Teams');
        results.push({ platform: 'teams', userId: conn.userId, connectionId: conn.id, status: 'failed' });
      }
    } catch (error) {
      trackFailure(conn.userId, 'Microsoft Teams');
      results.push({ platform: 'teams', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // --- Zoom connections ---
  const expiringZoom = await db
    .select({ id: zoomConnections.id, userId: zoomConnections.userId, refreshTokenEncrypted: zoomConnections.refreshTokenEncrypted })
    .from(zoomConnections)
    .where(and(isNotNull(zoomConnections.refreshTokenEncrypted), lt(zoomConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringZoom) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      const tokens = await refreshZoomToken(refreshToken);
      if (tokens) {
        await db.update(zoomConnections).set({
          accessTokenEncrypted: encrypt(tokens.access_token),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          ...(tokens.refresh_token && { refreshTokenEncrypted: encrypt(tokens.refresh_token) }),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(zoomConnections.id, conn.id));
        results.push({ platform: 'zoom', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else {
        trackFailure(conn.userId, 'Zoom');
        results.push({ platform: 'zoom', userId: conn.userId, connectionId: conn.id, status: 'failed' });
      }
    } catch (error) {
      trackFailure(conn.userId, 'Zoom');
      results.push({ platform: 'zoom', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // --- HubSpot connections ---
  const expiringHubspot = await db
    .select({ id: hubspotConnections.id, userId: hubspotConnections.userId, refreshTokenEncrypted: hubspotConnections.refreshTokenEncrypted })
    .from(hubspotConnections)
    .where(and(isNotNull(hubspotConnections.refreshTokenEncrypted), lt(hubspotConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringHubspot) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      const tokens = await refreshHubSpotToken(refreshToken);
      if (tokens) {
        await db.update(hubspotConnections).set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          refreshTokenEncrypted: encrypt(tokens.refreshToken),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(hubspotConnections.id, conn.id));
        results.push({ platform: 'hubspot', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else {
        trackFailure(conn.userId, 'HubSpot');
        results.push({ platform: 'hubspot', userId: conn.userId, connectionId: conn.id, status: 'failed' });
      }
    } catch (error) {
      trackFailure(conn.userId, 'HubSpot');
      results.push({ platform: 'hubspot', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // --- Salesforce connections ---
  const expiringSalesforce = await db
    .select({ id: salesforceConnections.id, userId: salesforceConnections.userId, refreshTokenEncrypted: salesforceConnections.refreshTokenEncrypted })
    .from(salesforceConnections)
    .where(and(isNotNull(salesforceConnections.refreshTokenEncrypted), lt(salesforceConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringSalesforce) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      const tokens = await refreshSalesforceToken(refreshToken);
      if (tokens) {
        await db.update(salesforceConnections).set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Salesforce tokens last ~2 hours
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(salesforceConnections.id, conn.id));
        results.push({ platform: 'salesforce', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else {
        trackFailure(conn.userId, 'Salesforce');
        results.push({ platform: 'salesforce', userId: conn.userId, connectionId: conn.id, status: 'failed' });
      }
    } catch (error) {
      trackFailure(conn.userId, 'Salesforce');
      results.push({ platform: 'salesforce', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // --- Email connections (Gmail + Outlook) ---
  const expiringEmail = await db
    .select({
      id: emailConnections.id,
      userId: emailConnections.userId,
      provider: emailConnections.provider,
      refreshTokenEncrypted: emailConnections.refreshTokenEncrypted,
    })
    .from(emailConnections)
    .where(and(isNotNull(emailConnections.refreshTokenEncrypted), lt(emailConnections.accessTokenExpiresAt, expiryThreshold)));

  for (const conn of expiringEmail) {
    try {
      const refreshToken = decrypt(conn.refreshTokenEncrypted);
      if (conn.provider === 'gmail') {
        const tokens = await refreshGmailToken(refreshToken);
        await db.update(emailConnections).set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(emailConnections.id, conn.id));
        results.push({ platform: 'email', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      } else if (conn.provider === 'outlook') {
        const tokens = await refreshOutlookToken(refreshToken);
        await db.update(emailConnections).set({
          accessTokenEncrypted: encrypt(tokens.accessToken),
          accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          refreshTokenEncrypted: encrypt(tokens.refreshToken),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(emailConnections.id, conn.id));
        results.push({ platform: 'email', userId: conn.userId, connectionId: conn.id, status: 'refreshed' });
      }
    } catch (error) {
      trackFailure(conn.userId, `Email (${conn.provider})`);
      results.push({ platform: 'email', userId: conn.userId, connectionId: conn.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Send notification emails for failed refreshes
  for (const [userId, platforms] of failedByUser) {
    try {
      await notifyUser(userId, platforms);
      log('info', 'Sent reconnection email to user', { userId, platforms });
    } catch (error) {
      log('error', 'Failed to send reconnection email', { userId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log('info', 'Token health check starting');

  const expiryThreshold = new Date(Date.now() + EXPIRY_WINDOW_MS);

  try {
    const results = await checkAndRefreshTokens(expiryThreshold);

    const refreshed = results.filter((r) => r.status === 'refreshed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const total = results.length;

    const summary = {
      total,
      refreshed,
      failed,
      byPlatform: {
        meet: results.filter((r) => r.platform === 'meet').length,
        teams: results.filter((r) => r.platform === 'teams').length,
        zoom: results.filter((r) => r.platform === 'zoom').length,
        hubspot: results.filter((r) => r.platform === 'hubspot').length,
        salesforce: results.filter((r) => r.platform === 'salesforce').length,
        email: results.filter((r) => r.platform === 'email').length,
      },
      duration: Date.now() - startTime,
    };

    log('info', 'Token health check complete', summary);

    if (failed > 0) {
      log('warn', 'Some token refreshes failed', {
        failures: results.filter((r) => r.status === 'failed').map((r) => ({
          platform: r.platform,
          connectionId: r.connectionId,
          error: r.error,
        })),
      });
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    log('error', 'Token health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
