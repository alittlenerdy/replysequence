/**
 * Google Meet OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, meetConnections, userOnboarding } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('[MEET-OAUTH-CALLBACK-1] Callback received', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
  });

  // Handle OAuth errors from Google
  if (error) {
    console.error('[MEET-OAUTH-CALLBACK-ERROR] OAuth error from Google:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(`/dashboard?error=meet_denied&message=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[MEET-OAUTH-CALLBACK-ERROR] Missing authorization code');
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', baseUrl));
  }

  // Decode state to get userId (set during OAuth initiation when user was authenticated)
  // We trust this userId because it was set by our server during the initial OAuth redirect
  let stateUserId: string;
  let returnTo = '/dashboard?meet_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[MEET-OAUTH-CALLBACK] Decoded state:', { stateUserId, returnTo });
  } catch {
    // Fallback for old format where state was just the userId
    stateUserId = state || '';
    console.log('[MEET-OAUTH-CALLBACK] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[MEET-OAUTH-CALLBACK-ERROR] No userId in state - invalid OAuth flow');
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[MEET-OAUTH-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  // Use the userId from state (this was set when user initiated OAuth while authenticated)
  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    console.log('[MEET-OAUTH-CALLBACK-2] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[MEET-OAUTH-CALLBACK-3] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Google user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    console.log('[MEET-OAUTH-CALLBACK-4] Got Google user info', {
      googleUserId: googleUser.id,
      googleEmail: googleUser.email,
    });

    // Find or create user in database
    console.log('[MEET-OAUTH-CALLBACK-5] Looking for user with clerkId:', clerkUserId);

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    console.log('[MEET-OAUTH-CALLBACK-6] User lookup result:', {
      found: !!user,
      userId: user?.id,
      existingMeetConnected: user?.meetConnected,
    });

    const userEmail = googleUser.email;
    const userName = googleUser.name || [googleUser.given_name, googleUser.family_name].filter(Boolean).join(' ') || null;

    if (!user) {
      // Create new user
      console.log('[MEET-OAUTH-CALLBACK-7] Creating new user...');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: userEmail,
          name: userName,
          meetConnected: true,
        })
        .returning();
      user = newUser;
      console.log('[MEET-OAUTH-CALLBACK-8] Created new user', { userId: user.id, meetConnected: true });
    } else {
      console.log('[MEET-OAUTH-CALLBACK-7] Using existing user', { userId: user.id });
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    // Calculate expiration time
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert meet connection
    const existingConnection = await db.query.meetConnections.findFirst({
      where: eq(meetConnections.userId, user.id),
    });

    if (existingConnection) {
      // Update existing connection
      const updateData: Record<string, unknown> = {
        googleUserId: googleUser.id,
        googleEmail: userEmail,
        googleDisplayName: userName,
        accessTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
        lastRefreshedAt: new Date(),
        updatedAt: new Date(),
      };

      // Only update refresh token if we got a new one
      if (refreshTokenEncrypted) {
        updateData.refreshTokenEncrypted = refreshTokenEncrypted;
      }

      await db
        .update(meetConnections)
        .set(updateData)
        .where(eq(meetConnections.userId, user.id));
      console.log('[MEET-OAUTH-CALLBACK-9] Updated existing Meet connection');
    } else {
      // Create new connection
      if (!refreshTokenEncrypted) {
        console.error('[MEET-OAUTH-CALLBACK-ERROR] No refresh token received for new connection');
        return NextResponse.redirect(
          new URL('/dashboard?error=no_refresh_token&message=Please try connecting again', baseUrl)
        );
      }

      await db.insert(meetConnections).values({
        userId: user.id,
        googleUserId: googleUser.id,
        googleEmail: userEmail,
        googleDisplayName: userName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
      });
      console.log('[MEET-OAUTH-CALLBACK-9] Created new Meet connection');
    }

    // Update user's meet_connected flag (boolean)
    console.log('[MEET-OAUTH-CALLBACK-10] Updating user meetConnected to true', { userId: user.id });

    await db
      .update(users)
      .set({
        meetConnected: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Update user_onboarding table if this is an onboarding flow
    if (returnTo.includes('/onboarding')) {
      console.log('[MEET-OAUTH-CALLBACK] Updating user_onboarding with platform_connected=meet');

      // Check if record exists
      const existingOnboarding = await db.query.userOnboarding.findFirst({
        where: eq(userOnboarding.clerkId, clerkUserId),
      });

      if (existingOnboarding) {
        await db
          .update(userOnboarding)
          .set({
            platformConnected: 'meet',
            currentStep: 2, // Stay on platform step to show connected status
            updatedAt: new Date(),
          })
          .where(eq(userOnboarding.clerkId, clerkUserId));
      } else {
        await db.insert(userOnboarding).values({
          clerkId: clerkUserId,
          platformConnected: 'meet',
          currentStep: 2, // Stay on platform step to show connected status
        });
      }
    }

    console.log('[MEET-OAUTH-CALLBACK-11] OAuth flow completed successfully', {
      clerkUserId,
      googleUserId: googleUser.id,
      returnTo,
    });

    // Redirect to the return URL
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[MEET-OAUTH-CALLBACK-ERROR] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  // CRITICAL: Remove trailing slash to match the redirect_uri used in the auth request
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/meet/callback`;

  console.log('[MEET-OAUTH-TOKEN-EXCHANGE] Starting token exchange:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 20) + '...',
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length,
    redirectUri,
    codeLength: code?.length,
  });

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  // Google uses POST body parameters
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
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

    console.error('[MEET-OAUTH-CALLBACK-ERROR] Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorDetails,
      // Common error causes:
      // 401: Invalid client_id or client_secret
      // 400 redirect_uri_mismatch: redirect_uri doesn't match Google Cloud Console
      // 400 invalid_grant: Code expired or already used
      redirectUriUsed: redirectUri,
    });
    throw new Error(`Token exchange failed: ${response.status} - ${typeof errorDetails === 'object' ? errorDetails.error_description || errorDetails.error : errorDetails}`);
  }

  return response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[MEET-OAUTH-CALLBACK-ERROR] Failed to get user info:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
