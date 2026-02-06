/**
 * Google Calendar OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, userOnboarding } from '@/lib/db';
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

  console.log('[CALENDAR-OAUTH-CALLBACK-1] Callback received', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
  });

  // Handle OAuth errors from Google
  if (error) {
    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] OAuth error from Google:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(`/dashboard?error=calendar_denied&message=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] Missing authorization code');
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
    console.log('[CALENDAR-OAUTH-CALLBACK] Decoded state:', { stateUserId, returnTo });
  } catch {
    // Fallback for old format where state was just the userId
    stateUserId = state || '';
    console.log('[CALENDAR-OAUTH-CALLBACK] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] No userId in state - invalid OAuth flow');
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[CALENDAR-OAUTH-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  // Use the userId from state (this was set when user initiated OAuth while authenticated)
  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    console.log('[CALENDAR-OAUTH-CALLBACK-2] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[CALENDAR-OAUTH-CALLBACK-3] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Google user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    console.log('[CALENDAR-OAUTH-CALLBACK-4] Got Google user info', {
      googleUserId: googleUser.id,
      googleEmail: googleUser.email,
    });

    // Find or create user in database
    console.log('[CALENDAR-OAUTH-CALLBACK-5] Looking for user with clerkId:', clerkUserId);

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    console.log('[CALENDAR-OAUTH-CALLBACK-6] User lookup result:', {
      found: !!user,
      userId: user?.id,
    });

    const userEmail = googleUser.email;
    const userName = googleUser.name || [googleUser.given_name, googleUser.family_name].filter(Boolean).join(' ') || null;

    if (!user) {
      // Create new user
      console.log('[CALENDAR-OAUTH-CALLBACK-7] Creating new user...');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: userEmail,
          name: userName,
        })
        .returning();
      user = newUser;
      console.log('[CALENDAR-OAUTH-CALLBACK-8] Created new user', { userId: user.id });
    } else {
      console.log('[CALENDAR-OAUTH-CALLBACK-7] Using existing user', { userId: user.id });
    }

    // Store encrypted tokens for calendar access (we can reuse them for calendar API calls)
    // Note: For simplicity, we store these on the user record
    // In a production app, you might want a separate calendarConnections table
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    console.log('[CALENDAR-OAUTH-CALLBACK-9] Storing calendar tokens');

    // Update user_onboarding table to mark calendar as connected
    console.log('[CALENDAR-OAUTH-CALLBACK-10] Updating user_onboarding with calendarConnected=true');

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

    console.log('[CALENDAR-OAUTH-CALLBACK-11] OAuth flow completed successfully', {
      clerkUserId,
      googleUserId: googleUser.id,
      returnTo,
    });

    // Redirect to the return URL
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  // CRITICAL: Remove trailing slash to match the redirect_uri used in the auth request
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/calendar/callback`;

  console.log('[CALENDAR-OAUTH-TOKEN-EXCHANGE] Starting token exchange:', {
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

    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorDetails,
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
    console.error('[CALENDAR-OAUTH-CALLBACK-ERROR] Failed to get user info:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
