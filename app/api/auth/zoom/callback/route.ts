/**
 * Zoom OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, users, zoomConnections, userOnboarding } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

// Allow longer timeout for cold starts and token exchange
export const maxDuration = 60;

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface ZoomUserInfo {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors from Zoom
  if (error) {
    console.error('[ZOOM-CALLBACK] OAuth error from Zoom:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=zoom_denied&message=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[ZOOM-CALLBACK] Missing authorization code');
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', baseUrl));
  }

  // Decode state to get userId (set during OAuth initiation when user was authenticated)
  // We trust this userId because it was set by our server during the initial OAuth redirect
  let stateUserId: string;
  let returnTo = '/dashboard?zoom_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[ZOOM-CALLBACK] Decoded state:', { stateUserId, returnTo });
  } catch {
    // Fallback for old format where state was just the userId
    stateUserId = state || '';
    console.log('[ZOOM-CALLBACK] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[ZOOM-CALLBACK] No userId in state - invalid OAuth flow');
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[ZOOM-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  // Use the userId from state (this was set when user initiated OAuth while authenticated)
  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('[ZOOM-CALLBACK] Token exchange successful');

    // Get Zoom user info
    const zoomUser = await getZoomUserInfo(tokens.access_token);
    console.log('[ZOOM-CALLBACK] Got Zoom user info', {
      zoomUserId: zoomUser.id,
      zoomEmail: zoomUser.email,
    });

    // Find or create user in database
    console.log('[ZOOM-CALLBACK] Looking for user with clerkId:', clerkUserId);

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    console.log('[ZOOM-CALLBACK] User lookup result:', {
      found: !!user,
      userId: user?.id,
      existingZoomConnected: user?.zoomConnected,
    });

    if (!user) {
      // Create new user
      console.log('[ZOOM-CALLBACK] Creating new user...');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: zoomUser.email,
          name: [zoomUser.first_name, zoomUser.last_name].filter(Boolean).join(' ') || null,
          zoomConnected: true,
        })
        .returning();
      user = newUser;
      console.log('[ZOOM-CALLBACK] Created new user', { userId: user.id, zoomConnected: true });
    } else {
      console.log('[ZOOM-CALLBACK] Using existing user', { userId: user.id });
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = encrypt(tokens.refresh_token);

    // Calculate expiration time
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check if this Zoom email is already connected to a different user
    const emailConflict = await db.query.zoomConnections.findFirst({
      where: sql`LOWER(${zoomConnections.zoomEmail}) = LOWER(${zoomUser.email})`,
    });

    if (emailConflict && emailConflict.userId !== user.id) {
      console.error('[ZOOM-CALLBACK] Email already connected to another user', {
        email: zoomUser.email,
        existingUserId: emailConflict.userId,
        currentUserId: user.id,
      });
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=email_conflict&message=${encodeURIComponent('This Zoom account is already connected to another user. Please disconnect it from the other account first.')}`, baseUrl)
      );
    }

    // Upsert zoom connection
    const existingConnection = await db.query.zoomConnections.findFirst({
      where: eq(zoomConnections.userId, user.id),
    });

    if (existingConnection) {
      // Update existing connection
      await db
        .update(zoomConnections)
        .set({
          zoomUserId: zoomUser.id,
          zoomEmail: zoomUser.email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt,
          scopes: tokens.scope,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(zoomConnections.userId, user.id));
      console.log('[ZOOM-CALLBACK] Updated existing Zoom connection');
    } else {
      // Create new connection
      await db.insert(zoomConnections).values({
        userId: user.id,
        zoomUserId: zoomUser.id,
        zoomEmail: zoomUser.email,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
      });
      console.log('[ZOOM-CALLBACK] Created new Zoom connection');
    }

    // Update user's zoom_connected flag (boolean)
    console.log('[ZOOM-CALLBACK] Updating user zoomConnected to true', { userId: user.id });

    const updateResult = await db
      .update(users)
      .set({
        zoomConnected: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, zoomConnected: users.zoomConnected });

    console.log('[ZOOM-CALLBACK] Update result:', updateResult);

    // Verify the update worked
    const verifyUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    console.log('[ZOOM-CALLBACK] Verification query:', {
      userId: verifyUser?.id,
      zoomConnected: verifyUser?.zoomConnected,
    });

    // Update user_onboarding table if this is an onboarding flow
    if (returnTo.includes('/onboarding')) {
      console.log('[ZOOM-CALLBACK] Updating user_onboarding with platform_connected=zoom');

      // Check if record exists
      const existingOnboarding = await db.query.userOnboarding.findFirst({
        where: eq(userOnboarding.clerkId, clerkUserId),
      });

      if (existingOnboarding) {
        await db
          .update(userOnboarding)
          .set({
            platformConnected: 'zoom',
            currentStep: 2, // Stay on platform step to show connected status
            updatedAt: new Date(),
          })
          .where(eq(userOnboarding.clerkId, clerkUserId));
      } else {
        await db.insert(userOnboarding).values({
          clerkId: clerkUserId,
          platformConnected: 'zoom',
          currentStep: 2, // Stay on platform step to show connected status
        });
      }
    }

    console.log('[ZOOM-CALLBACK] OAuth flow completed successfully', {
      clerkUserId,
      zoomUserId: zoomUser.id,
      userZoomConnected: verifyUser?.zoomConnected,
      returnTo,
    });

    // Redirect to the return URL
    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[ZOOM-CALLBACK] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string): Promise<ZoomTokenResponse> {
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  // CRITICAL: Remove trailing slash to match the redirect_uri used in the auth request
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/zoom/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Zoom OAuth credentials');
  }

  // Zoom requires Basic auth with client_id:client_secret
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ZOOM-CALLBACK] Token exchange failed:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function getZoomUserInfo(accessToken: string): Promise<ZoomUserInfo> {
  const response = await fetch('https://api.zoom.us/v2/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ZOOM-CALLBACK] Failed to get user info:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
