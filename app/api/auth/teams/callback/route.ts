/**
 * Microsoft Teams OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, teamsConnections, userOnboarding } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
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

  // Handle OAuth errors from Microsoft
  if (error) {
    console.error('[TEAMS-CALLBACK] OAuth error from Microsoft:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(`/dashboard?error=teams_denied&message=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[TEAMS-CALLBACK] Missing authorization code');
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', baseUrl));
  }

  // Decode state to get userId (set during OAuth initiation when user was authenticated)
  // We trust this userId because it was set by our server during the initial OAuth redirect
  let stateUserId: string;
  let returnTo = '/dashboard?teams_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[TEAMS-CALLBACK] Decoded state:', { stateUserId, returnTo });
  } catch {
    // Fallback for old format where state was just the userId
    stateUserId = state || '';
    console.log('[TEAMS-CALLBACK] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[TEAMS-CALLBACK] No userId in state - invalid OAuth flow');
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[TEAMS-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  // Use the userId from state (this was set when user initiated OAuth while authenticated)
  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('[TEAMS-CALLBACK] Token exchange successful');

    // Get Microsoft user info
    const msUser = await getMicrosoftUserInfo(tokens.access_token);
    console.log('[TEAMS-CALLBACK] Got Microsoft user info', {
      msUserId: msUser.id,
      msEmail: msUser.mail || msUser.userPrincipalName,
    });

    // Find or create user in database
    console.log('[TEAMS-CALLBACK] Looking for user with clerkId:', clerkUserId);

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    console.log('[TEAMS-CALLBACK] User lookup result:', {
      found: !!user,
      userId: user?.id,
      existingTeamsConnected: user?.teamsConnected,
    });

    const userEmail = msUser.mail || msUser.userPrincipalName;
    const userName = msUser.displayName || [msUser.givenName, msUser.surname].filter(Boolean).join(' ') || null;

    if (!user) {
      // Create new user
      console.log('[TEAMS-CALLBACK] Creating new user...');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: userEmail,
          name: userName,
          teamsConnected: true,
        })
        .returning();
      user = newUser;
      console.log('[TEAMS-CALLBACK] Created new user', { userId: user.id, teamsConnected: true });
    } else {
      console.log('[TEAMS-CALLBACK] Using existing user', { userId: user.id });
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = encrypt(tokens.refresh_token);

    // Calculate expiration time
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert teams connection
    const existingConnection = await db.query.teamsConnections.findFirst({
      where: eq(teamsConnections.userId, user.id),
    });

    if (existingConnection) {
      // Update existing connection
      await db
        .update(teamsConnections)
        .set({
          msUserId: msUser.id,
          msEmail: userEmail,
          msDisplayName: userName,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt,
          scopes: tokens.scope,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamsConnections.userId, user.id));
      console.log('[TEAMS-CALLBACK] Updated existing Teams connection');
    } else {
      // Create new connection
      await db.insert(teamsConnections).values({
        userId: user.id,
        msUserId: msUser.id,
        msEmail: userEmail,
        msDisplayName: userName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
      });
      console.log('[TEAMS-CALLBACK] Created new Teams connection');
    }

    // Update user's teams_connected flag (boolean)
    console.log('[TEAMS-CALLBACK] Updating user teamsConnected to true', { userId: user.id });

    const updateResult = await db
      .update(users)
      .set({
        teamsConnected: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, teamsConnected: users.teamsConnected });

    console.log('[TEAMS-CALLBACK] Update result:', updateResult);

    // Verify the update worked
    const verifyUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    console.log('[TEAMS-CALLBACK] Verification query:', {
      userId: verifyUser?.id,
      teamsConnected: verifyUser?.teamsConnected,
    });

    // Update user_onboarding table if this is an onboarding flow
    if (returnTo.includes('/onboarding')) {
      console.log('[TEAMS-CALLBACK] Updating user_onboarding with platform_connected=teams');

      // Check if record exists
      const existingOnboarding = await db.query.userOnboarding.findFirst({
        where: eq(userOnboarding.clerkId, clerkUserId),
      });

      if (existingOnboarding) {
        await db
          .update(userOnboarding)
          .set({
            platformConnected: 'teams',
            currentStep: 2, // Stay on platform step to show connected status
            updatedAt: new Date(),
          })
          .where(eq(userOnboarding.clerkId, clerkUserId));
      } else {
        await db.insert(userOnboarding).values({
          clerkId: clerkUserId,
          platformConnected: 'teams',
          currentStep: 2, // Stay on platform step to show connected status
        });
      }
    }

    console.log('[TEAMS-CALLBACK] OAuth flow completed successfully', {
      clerkUserId,
      msUserId: msUser.id,
      userTeamsConnected: verifyUser?.teamsConnected,
      returnTo,
    });

    // Redirect to the return URL
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[TEAMS-CALLBACK] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.MICROSOFT_TEAMS_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_TEAMS_CLIENT_SECRET?.trim();
  const tenantId = process.env.MICROSOFT_TEAMS_TENANT_ID?.trim() || 'common';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/teams/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Microsoft Teams OAuth credentials');
  }

  // Microsoft uses POST body parameters (not Basic auth like Zoom)
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
    console.error('[TEAMS-CALLBACK] Token exchange failed:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Token exchange failed: ${response.status}`);
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
    console.error('[TEAMS-CALLBACK] Failed to get user info:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
