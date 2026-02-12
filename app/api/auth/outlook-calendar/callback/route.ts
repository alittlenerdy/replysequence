/**
 * Outlook Calendar OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, userOnboarding, outlookCalendarConnections } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

interface MicrosoftUserInfo {
  id: string;
  mail?: string;
  userPrincipalName: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('[OUTLOOK-CALENDAR-CALLBACK-1] Callback received', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
  });

  // Handle OAuth errors from Microsoft
  if (error) {
    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] OAuth error from Microsoft:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(`/dashboard?error=outlook_calendar_denied&message=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] Missing authorization code');
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', baseUrl));
  }

  // Decode state to get userId (set during OAuth initiation when user was authenticated)
  // We trust this userId because it was set by our server during the initial OAuth redirect
  let stateUserId: string;
  let returnTo = '/dashboard?calendar_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[OUTLOOK-CALENDAR-CALLBACK] Decoded state:', { stateUserId, returnTo });
  } catch {
    // Fallback for old format where state was just the userId
    stateUserId = state || '';
    console.log('[OUTLOOK-CALENDAR-CALLBACK] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] No userId in state - invalid OAuth flow');
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[OUTLOOK-CALENDAR-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  // Use the userId from state (this was set when user initiated OAuth while authenticated)
  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    console.log('[OUTLOOK-CALENDAR-CALLBACK-2] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[OUTLOOK-CALENDAR-CALLBACK-3] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Microsoft user info
    const msUser = await getMicrosoftUserInfo(tokens.access_token);
    console.log('[OUTLOOK-CALENDAR-CALLBACK-4] Got Microsoft user info', {
      msUserId: msUser.id,
      msEmail: msUser.mail || msUser.userPrincipalName,
    });

    // Find or create user in database
    console.log('[OUTLOOK-CALENDAR-CALLBACK-5] Looking for user with clerkId:', clerkUserId);

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    console.log('[OUTLOOK-CALENDAR-CALLBACK-6] User lookup result:', {
      found: !!user,
      userId: user?.id,
    });

    const userEmail = msUser.mail || msUser.userPrincipalName;
    const userName = msUser.displayName || [msUser.givenName, msUser.surname].filter(Boolean).join(' ') || null;

    if (!user) {
      // Create new user
      console.log('[OUTLOOK-CALENDAR-CALLBACK-7] Creating new user...');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: userEmail,
          name: userName,
        })
        .returning();
      user = newUser;
      console.log('[OUTLOOK-CALENDAR-CALLBACK-8] Created new user', { userId: user.id });
    } else {
      console.log('[OUTLOOK-CALENDAR-CALLBACK-7] Using existing user', { userId: user.id });
    }

    // Store encrypted tokens in outlookCalendarConnections table
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : encrypt(''); // Need a value for required field

    console.log('[OUTLOOK-CALENDAR-CALLBACK-9] Storing calendar tokens in outlookCalendarConnections table');

    // Check if outlook calendar connection already exists for this user
    const existingConnection = await db.query.outlookCalendarConnections.findFirst({
      where: eq(outlookCalendarConnections.userId, user.id),
    });

    if (existingConnection) {
      // Update existing connection
      await db
        .update(outlookCalendarConnections)
        .set({
          msUserId: msUser.id,
          msEmail: msUser.mail || msUser.userPrincipalName,
          msDisplayName: msUser.displayName || null,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scopes: tokens.scope,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(outlookCalendarConnections.userId, user.id));
      console.log('[OUTLOOK-CALENDAR-CALLBACK-9.1] Updated existing outlook calendar connection');
    } else {
      // Create new connection
      await db.insert(outlookCalendarConnections).values({
        userId: user.id,
        msUserId: msUser.id,
        msEmail: msUser.mail || msUser.userPrincipalName,
        msDisplayName: msUser.displayName || null,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
      });
      console.log('[OUTLOOK-CALENDAR-CALLBACK-9.1] Created new outlook calendar connection');
    }

    // Update user_onboarding table to mark calendar as connected
    console.log('[OUTLOOK-CALENDAR-CALLBACK-10] Updating user_onboarding with calendarConnected=true');

    // Check if record exists
    const existingOnboarding = await db.query.userOnboarding.findFirst({
      where: eq(userOnboarding.clerkId, clerkUserId),
    });

    if (existingOnboarding) {
      await db
        .update(userOnboarding)
        .set({
          calendarConnected: true,
          // If coming from onboarding, stay on step 3 (calendar step) to show connected status
          currentStep: returnTo.includes('/onboarding') ? 3 : existingOnboarding.currentStep,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.clerkId, clerkUserId));
    } else {
      await db.insert(userOnboarding).values({
        clerkId: clerkUserId,
        calendarConnected: true,
        currentStep: returnTo.includes('/onboarding') ? 3 : 1,
      });
    }

    console.log('[OUTLOOK-CALENDAR-CALLBACK-11] OAuth flow completed successfully', {
      clerkUserId,
      msUserId: msUser.id,
      returnTo,
    });

    // Redirect to the return URL
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.MICROSOFT_TEAMS_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_TEAMS_CLIENT_SECRET?.trim();
  const tenantId = process.env.MICROSOFT_TEAMS_TENANT_ID?.trim() || 'common';
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/outlook-calendar/callback`;

  console.log('[OUTLOOK-CALENDAR-TOKEN-EXCHANGE] Starting token exchange:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 20) + '...',
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length,
    redirectUri,
    codeLength: code?.length,
  });

  if (!clientId || !clientSecret) {
    throw new Error('Missing Microsoft OAuth credentials');
  }

  // Microsoft uses POST body parameters
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Parse error for better diagnosis
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorDetails,
      redirectUriUsed: redirectUri,
    });
    throw new Error(`Token exchange failed: ${response.status} - ${typeof errorDetails === 'object' ? errorDetails.error_description || errorDetails.error : errorDetails}`);
  }

  return response.json();
}

async function getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OUTLOOK-CALENDAR-CALLBACK-ERROR] Failed to get user info:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
