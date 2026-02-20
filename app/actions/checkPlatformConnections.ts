'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users, zoomConnections, teamsConnections, meetConnections, calendarConnections, outlookCalendarConnections, hubspotConnections, airtableConnections, emailConnections } from '@/lib/db';
import { sheetsConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface MeetConnectionInfo {
  id: string;
  email: string;
  displayName?: string | null;
  isPrimary: boolean;
  connectedAt: Date;
}

export interface PlatformConnectionDetails {
  connected: boolean;
  email?: string;
  connectedAt?: Date;
  expiresAt?: Date;
  isExpiringSoon?: boolean; // Token expires within 24 hours
  isExpired?: boolean;
  needsReconnect?: boolean;
  lastSyncAt?: Date;
  // Multi-connection support for Meet
  connections?: MeetConnectionInfo[];
}

export interface PlatformConnectionsResult {
  connected: boolean;
  platforms: {
    zoom: boolean;
    teams: boolean;
    meet: boolean;
    calendar: boolean;
    outlookCalendar: boolean;
    hubspot: boolean;
    airtable: boolean;
    gmail: boolean;
    outlook: boolean;
    google_sheets: boolean;
  };
  details: {
    zoom: PlatformConnectionDetails;
    teams: PlatformConnectionDetails;
    meet: PlatformConnectionDetails;
    calendar: PlatformConnectionDetails;
    outlookCalendar: PlatformConnectionDetails;
    hubspot: PlatformConnectionDetails;
    airtable: PlatformConnectionDetails;
    gmail: PlatformConnectionDetails;
    outlook: PlatformConnectionDetails;
    google_sheets: PlatformConnectionDetails;
  };
  userId?: string;
  zoomEmail?: string;
  teamsEmail?: string;
  meetEmail?: string;
  calendarEmail?: string;
  outlookCalendarEmail?: string;
  hubspotPortalId?: string;
  airtableBaseId?: string;
  gmailEmail?: string;
  outlookEmail?: string;
}

/**
 * Check if the current user has connected any meeting platforms.
 * Creates user record if it doesn't exist.
 */
export async function checkPlatformConnections(): Promise<PlatformConnectionsResult> {
  console.log('[CHECK-CONNECTION] ==== Starting platform connection check ====');

  try {
    const { userId } = await auth();

    console.log('[CHECK-CONNECTION] Clerk auth result:', { clerkUserId: userId, hasUserId: !!userId });

    if (!userId) {
      console.log('[CHECK-CONNECTION] No userId from Clerk auth');
      return {
        connected: false,
        platforms: { zoom: false, teams: false, meet: false, calendar: false, outlookCalendar: false, hubspot: false, airtable: false, gmail: false, outlook: false, google_sheets: false },
        details: {
          zoom: { connected: false },
          teams: { connected: false },
          meet: { connected: false },
          calendar: { connected: false },
          outlookCalendar: { connected: false },
          hubspot: { connected: false },
          airtable: { connected: false },
          gmail: { connected: false },
          outlook: { connected: false },
        },
      };
    }

  // Try to find existing user
  const [existingUser] = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      zoomConnected: users.zoomConnected,
      teamsConnected: users.teamsConnected,
      meetConnected: users.meetConnected,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  console.log('[CHECK-CONNECTION] User query result', {
    found: !!existingUser,
    userId: existingUser?.id,
    clerkId: existingUser?.clerkId,
    zoomConnected: existingUser?.zoomConnected,
    teamsConnected: existingUser?.teamsConnected,
    meetConnected: existingUser?.meetConnected,
  });

  if (existingUser) {
    // Database stores boolean values directly
    const zoomConnected = existingUser.zoomConnected === true;
    const teamsConnected = existingUser.teamsConnected === true;
    const meetConnected = existingUser.meetConnected === true;
    const hasConnection = zoomConnected || teamsConnected || meetConnected;

    console.log('[CHECK-CONNECTION] Connection status', {
      zoomConnected,
      teamsConnected,
      meetConnected,
      hasConnection,
    });

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Helper to check token expiration status
    const getExpirationStatus = (expiresAt: Date | null) => ({
      isExpired: expiresAt ? expiresAt < now : false,
      isExpiringSoon: expiresAt ? (expiresAt > now && expiresAt < twentyFourHoursFromNow) : false,
    });

    // Get Zoom connection details
    // Note: Zoom access tokens expire in 1 hour, but we have refresh tokens
    // So we don't show "expiring soon" - only show warning if refresh token is missing
    let zoomEmail: string | undefined;
    let zoomDetails: PlatformConnectionDetails = { connected: false };
    if (zoomConnected) {
      const [connection] = await db
        .select({
          zoomEmail: zoomConnections.zoomEmail,
          connectedAt: zoomConnections.connectedAt,
          expiresAt: zoomConnections.accessTokenExpiresAt,
          hasRefreshToken: zoomConnections.refreshTokenEncrypted,
        })
        .from(zoomConnections)
        .where(eq(zoomConnections.userId, existingUser.id))
        .limit(1);
      if (connection) {
        zoomEmail = connection.zoomEmail;
        // For Zoom: only show warning if we don't have a refresh token
        // Access tokens auto-refresh via refresh token, so short expiry is normal
        const hasRefreshToken = !!connection.hasRefreshToken;
        zoomDetails = {
          connected: true,
          email: connection.zoomEmail,
          connectedAt: connection.connectedAt,
          expiresAt: connection.expiresAt,
          isExpired: !hasRefreshToken, // Only "expired" if no refresh token
          isExpiringSoon: false, // Never "expiring soon" for Zoom (we auto-refresh)
        };
      }
      console.log('[CHECK-CONNECTION] Zoom connection found', { zoomEmail, hasRefreshToken: !!connection?.hasRefreshToken });
    }

    // Get Teams connection details
    // Note: Microsoft access tokens expire in 1 hour, but we have refresh tokens
    // So we don't show "expiring soon" - only show warning if refresh token is missing
    let teamsEmail: string | undefined;
    let teamsDetails: PlatformConnectionDetails = { connected: false };
    if (teamsConnected) {
      const [connection] = await db
        .select({
          msEmail: teamsConnections.msEmail,
          connectedAt: teamsConnections.connectedAt,
          expiresAt: teamsConnections.accessTokenExpiresAt,
          hasRefreshToken: teamsConnections.refreshTokenEncrypted,
        })
        .from(teamsConnections)
        .where(eq(teamsConnections.userId, existingUser.id))
        .limit(1);
      if (connection) {
        teamsEmail = connection.msEmail;
        const hasRefreshToken = !!connection.hasRefreshToken;
        teamsDetails = {
          connected: true,
          email: connection.msEmail,
          connectedAt: connection.connectedAt,
          expiresAt: connection.expiresAt,
          isExpired: !hasRefreshToken, // Only "expired" if no refresh token
          isExpiringSoon: false, // Never "expiring soon" for Teams (we auto-refresh)
        };
      }
      console.log('[CHECK-CONNECTION] Teams connection found', { teamsEmail, hasRefreshToken: !!connection?.hasRefreshToken });
    }

    // Get Meet connection details (supports multiple connections)
    // Note: Google access tokens expire in 1 hour, but we have refresh tokens
    // So we don't show "expiring soon" - only show warning if refresh token is missing
    let meetEmail: string | undefined;
    let meetDetails: PlatformConnectionDetails = { connected: false };
    if (meetConnected) {
      const allMeetConnections = await db
        .select({
          id: meetConnections.id,
          googleEmail: meetConnections.googleEmail,
          googleDisplayName: meetConnections.googleDisplayName,
          isPrimary: meetConnections.isPrimary,
          connectedAt: meetConnections.connectedAt,
          expiresAt: meetConnections.accessTokenExpiresAt,
          hasRefreshToken: meetConnections.refreshTokenEncrypted,
        })
        .from(meetConnections)
        .where(eq(meetConnections.userId, existingUser.id));

      if (allMeetConnections.length > 0) {
        // Primary connection shown as the "main" email
        const primary = allMeetConnections.find(c => c.isPrimary) || allMeetConnections[0];
        meetEmail = primary.googleEmail;
        const hasRefreshToken = !!primary.hasRefreshToken;
        meetDetails = {
          connected: true,
          email: primary.googleEmail,
          connectedAt: primary.connectedAt,
          expiresAt: primary.expiresAt,
          isExpired: !hasRefreshToken,
          isExpiringSoon: false,
          connections: allMeetConnections.map(c => ({
            id: c.id,
            email: c.googleEmail,
            displayName: c.googleDisplayName,
            isPrimary: c.isPrimary,
            connectedAt: c.connectedAt,
          })),
        };
      }
      console.log('[CHECK-CONNECTION] Meet connections found', {
        count: allMeetConnections.length,
        primaryEmail: meetEmail,
      });
    }

    // Get Google Calendar connection details
    let calendarEmail: string | undefined;
    let calendarDetails: PlatformConnectionDetails = { connected: false };
    const [calendarConnection] = await db
      .select({
        googleEmail: calendarConnections.googleEmail,
        connectedAt: calendarConnections.connectedAt,
        expiresAt: calendarConnections.accessTokenExpiresAt,
        hasRefreshToken: calendarConnections.refreshTokenEncrypted,
      })
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, existingUser.id))
      .limit(1);

    const calendarConnected = !!calendarConnection;
    if (calendarConnection) {
      calendarEmail = calendarConnection.googleEmail;
      const hasRefreshToken = !!calendarConnection.hasRefreshToken;
      calendarDetails = {
        connected: true,
        email: calendarConnection.googleEmail,
        connectedAt: calendarConnection.connectedAt,
        expiresAt: calendarConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
      };
      console.log('[CHECK-CONNECTION] Google Calendar connection found', { calendarEmail, hasRefreshToken });
    }

    // Get Outlook Calendar connection details
    let outlookCalendarEmail: string | undefined;
    let outlookCalendarDetails: PlatformConnectionDetails = { connected: false };
    const [outlookConnection] = await db
      .select({
        msEmail: outlookCalendarConnections.msEmail,
        connectedAt: outlookCalendarConnections.connectedAt,
        expiresAt: outlookCalendarConnections.accessTokenExpiresAt,
        hasRefreshToken: outlookCalendarConnections.refreshTokenEncrypted,
      })
      .from(outlookCalendarConnections)
      .where(eq(outlookCalendarConnections.userId, existingUser.id))
      .limit(1);

    const outlookCalendarConnected = !!outlookConnection;
    if (outlookConnection) {
      outlookCalendarEmail = outlookConnection.msEmail;
      const hasRefreshToken = !!outlookConnection.hasRefreshToken;
      outlookCalendarDetails = {
        connected: true,
        email: outlookConnection.msEmail,
        connectedAt: outlookConnection.connectedAt,
        expiresAt: outlookConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
      };
      console.log('[CHECK-CONNECTION] Outlook Calendar connection found', { outlookCalendarEmail, hasRefreshToken });
    }

    // Get HubSpot CRM connection details
    let hubspotPortalId: string | undefined;
    let hubspotDetails: PlatformConnectionDetails = { connected: false };
    const [hubspotConnection] = await db
      .select({
        hubspotPortalId: hubspotConnections.hubspotPortalId,
        connectedAt: hubspotConnections.connectedAt,
        expiresAt: hubspotConnections.accessTokenExpiresAt,
        hasRefreshToken: hubspotConnections.refreshTokenEncrypted,
        scopes: hubspotConnections.scopes,
        lastSyncAt: hubspotConnections.lastSyncAt,
      })
      .from(hubspotConnections)
      .where(eq(hubspotConnections.userId, existingUser.id))
      .limit(1);

    const hubspotConnected = !!hubspotConnection;
    if (hubspotConnection) {
      hubspotPortalId = hubspotConnection.hubspotPortalId;
      const hasRefreshToken = !!hubspotConnection.hasRefreshToken;
      const needsReconnect = !hubspotConnection.scopes.includes('crm.objects.meetings.write');
      hubspotDetails = {
        connected: true,
        email: `Portal ${hubspotConnection.hubspotPortalId}`,
        connectedAt: hubspotConnection.connectedAt,
        expiresAt: hubspotConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
        needsReconnect,
        lastSyncAt: hubspotConnection.lastSyncAt ?? undefined,
      };
      console.log('[CHECK-CONNECTION] HubSpot connection found', { hubspotPortalId, hasRefreshToken });
    }

    // Get Airtable CRM connection details
    let airtableBaseId: string | undefined;
    let airtableDetails: PlatformConnectionDetails = { connected: false };
    const [airtableConnection] = await db
      .select({
        baseId: airtableConnections.baseId,
        connectedAt: airtableConnections.connectedAt,
        lastSyncAt: airtableConnections.lastSyncAt,
      })
      .from(airtableConnections)
      .where(eq(airtableConnections.userId, existingUser.id))
      .limit(1);

    const airtableConnected = !!airtableConnection;
    if (airtableConnection) {
      airtableBaseId = airtableConnection.baseId;
      airtableDetails = {
        connected: true,
        email: `Base ${airtableConnection.baseId}`,
        connectedAt: airtableConnection.connectedAt,
        lastSyncAt: airtableConnection.lastSyncAt ?? undefined,
      };
    }

    // Get Gmail email connection details
    let gmailEmail: string | undefined;
    let gmailDetails: PlatformConnectionDetails = { connected: false };
    const [gmailConnection] = await db
      .select({
        email: emailConnections.email,
        connectedAt: emailConnections.connectedAt,
        expiresAt: emailConnections.accessTokenExpiresAt,
        hasRefreshToken: emailConnections.refreshTokenEncrypted,
      })
      .from(emailConnections)
      .where(and(
        eq(emailConnections.userId, existingUser.id),
        eq(emailConnections.provider, 'gmail'),
      ))
      .limit(1);

    const gmailConnected = !!gmailConnection;
    if (gmailConnection) {
      gmailEmail = gmailConnection.email;
      const hasRefreshToken = !!gmailConnection.hasRefreshToken;
      gmailDetails = {
        connected: true,
        email: gmailConnection.email,
        connectedAt: gmailConnection.connectedAt,
        expiresAt: gmailConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
      };
      console.log('[CHECK-CONNECTION] Gmail connection found', { gmailEmail, hasRefreshToken });
    }

    // Get Outlook email connection details
    let outlookEmail: string | undefined;
    let outlookDetails: PlatformConnectionDetails = { connected: false };
    const [outlookEmailConnection] = await db
      .select({
        email: emailConnections.email,
        connectedAt: emailConnections.connectedAt,
        expiresAt: emailConnections.accessTokenExpiresAt,
        hasRefreshToken: emailConnections.refreshTokenEncrypted,
      })
      .from(emailConnections)
      .where(and(
        eq(emailConnections.userId, existingUser.id),
        eq(emailConnections.provider, 'outlook'),
      ))
      .limit(1);

    const outlookEmailConnected = !!outlookEmailConnection;
    if (outlookEmailConnection) {
      outlookEmail = outlookEmailConnection.email;
      const hasRefreshToken = !!outlookEmailConnection.hasRefreshToken;
      outlookDetails = {
        connected: true,
        email: outlookEmailConnection.email,
        connectedAt: outlookEmailConnection.connectedAt,
        expiresAt: outlookEmailConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
      };
      console.log('[CHECK-CONNECTION] Outlook email connection found', { outlookEmail, hasRefreshToken });
    }

    // Get Google Sheets CRM connection details
    let sheetsEmail: string | undefined;
    let sheetsDetails: PlatformConnectionDetails = { connected: false };
    const [sheetsConnection] = await db
      .select({
        googleEmail: sheetsConnections.googleEmail,
        spreadsheetId: sheetsConnections.spreadsheetId,
        spreadsheetName: sheetsConnections.spreadsheetName,
        connectedAt: sheetsConnections.connectedAt,
        lastSyncAt: sheetsConnections.lastSyncAt,
        hasRefreshToken: sheetsConnections.refreshTokenEncrypted,
      })
      .from(sheetsConnections)
      .where(eq(sheetsConnections.userId, existingUser.id))
      .limit(1);

    const sheetsConnected = !!sheetsConnection;
    if (sheetsConnection) {
      sheetsEmail = sheetsConnection.googleEmail;
      sheetsDetails = {
        connected: true,
        email: sheetsConnection.spreadsheetName
          ? `${sheetsConnection.googleEmail} - ${sheetsConnection.spreadsheetName}`
          : sheetsConnection.googleEmail,
        connectedAt: sheetsConnection.connectedAt,
        isExpired: !sheetsConnection.hasRefreshToken,
        isExpiringSoon: false,
        lastSyncAt: sheetsConnection.lastSyncAt ?? undefined,
      };
    }

    const hasAnyConnection = zoomConnected || teamsConnected || meetConnected || calendarConnected || outlookCalendarConnected || hubspotConnected || airtableConnected || gmailConnected || outlookEmailConnected || sheetsConnected;

    return {
      connected: hasAnyConnection,
      platforms: {
        zoom: zoomConnected,
        teams: teamsConnected,
        meet: meetConnected,
        calendar: calendarConnected,
        outlookCalendar: outlookCalendarConnected,
        hubspot: hubspotConnected,
        airtable: airtableConnected,
        gmail: gmailConnected,
        outlook: outlookEmailConnected,
        google_sheets: sheetsConnected,
      },
      details: {
        zoom: zoomDetails,
        teams: teamsDetails,
        meet: meetDetails,
        calendar: calendarDetails,
        outlookCalendar: outlookCalendarDetails,
        hubspot: hubspotDetails,
        airtable: airtableDetails,
        gmail: gmailDetails,
        outlook: outlookDetails,
        google_sheets: sheetsDetails,
      },
      userId: existingUser.id,
      zoomEmail,
      teamsEmail,
      meetEmail,
      calendarEmail,
      outlookCalendarEmail,
      hubspotPortalId,
      airtableBaseId,
      gmailEmail,
      outlookEmail,
    };
  }

  // User doesn't exist, create them
  console.log('[CHECK-CONNECTION] Creating new user for clerkId:', userId);
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
  const name = clerkUser?.fullName || clerkUser?.firstName || '';

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      name,
      zoomConnected: false,
      teamsConnected: false,
      meetConnected: false,
    })
    .returning({ id: users.id });
  console.log('[CHECK-CONNECTION] Created new user', { userId: newUser.id });

  return {
    connected: false,
    platforms: { zoom: false, teams: false, meet: false, calendar: false, outlookCalendar: false, hubspot: false, airtable: false, gmail: false, outlook: false, google_sheets: false },
    details: {
      zoom: { connected: false },
      teams: { connected: false },
      meet: { connected: false },
      calendar: { connected: false },
      outlookCalendar: { connected: false },
      hubspot: { connected: false },
      airtable: { connected: false },
      gmail: { connected: false },
      outlook: { connected: false },
      google_sheets: { connected: false },
    },
    userId: newUser.id,
  };
  } catch (error) {
    console.error('[CHECK-CONNECTION] FATAL ERROR:', error);
    // Return disconnected state on error to show integration cards
    return {
      connected: false,
      platforms: { zoom: false, teams: false, meet: false, calendar: false, outlookCalendar: false, hubspot: false, airtable: false, gmail: false, outlook: false, google_sheets: false },
      details: {
        zoom: { connected: false },
        teams: { connected: false },
        meet: { connected: false },
        calendar: { connected: false },
        outlookCalendar: { connected: false },
        hubspot: { connected: false },
        airtable: { connected: false },
        gmail: { connected: false },
        outlook: { connected: false },
      },
    };
  }
}

/**
 * Update platform connection status for the current user.
 */
export async function updatePlatformConnection(
  platform: 'zoom' | 'teams' | 'meet',
  connected: boolean
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Build update object based on platform (boolean values)
    const baseUpdate = { updatedAt: new Date() };

    let updateData;
    switch (platform) {
      case 'zoom':
        updateData = { ...baseUpdate, zoomConnected: connected };
        break;
      case 'teams':
        updateData = { ...baseUpdate, teamsConnected: connected };
        break;
      case 'meet':
        updateData = { ...baseUpdate, meetConnected: connected };
        break;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.clerkId, userId));

    console.log(JSON.stringify({
      level: 'info',
      message: 'Platform connection updated',
      platform,
      connected,
      userId,
    }));

    return { success: true };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to update platform connection',
      platform,
      error: error instanceof Error ? error.message : String(error),
    }));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
