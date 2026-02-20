/**
 * Gmail OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens in emailConnections
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, emailConnections } from '@/lib/db/schema';
import { encrypt } from '@/lib/encryption';
import { eq, and, sql } from 'drizzle-orm';

export const maxDuration = 60;

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
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

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

  console.log('[GMAIL-OAUTH-CALLBACK-1] Callback received', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
  });

  // Determine error redirect target (onboarding vs settings)
  const errorRedirectBase = state ? (() => {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed.returnTo?.startsWith('/onboarding')) return '/onboarding?step=3';
    } catch { /* fall through */ }
    return '/dashboard/settings';
  })() : '/dashboard/settings';

  // Handle OAuth errors from Google
  if (error) {
    console.error('[GMAIL-OAUTH-CALLBACK-ERROR] OAuth error from Google:', {
      error,
      description: errorDescription,
    });
    const separator = errorRedirectBase.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}${separator}email_error=auth_failed`, baseUrl)
    );
  }

  if (!code) {
    console.error('[GMAIL-OAUTH-CALLBACK-ERROR] Missing authorization code');
    const separator = errorRedirectBase.includes('?') ? '&' : '?';
    return NextResponse.redirect(new URL(`${errorRedirectBase}${separator}email_error=auth_failed`, baseUrl));
  }

  // Decode state to get userId and returnTo
  let stateUserId: string;
  let returnTo = '/dashboard/settings?gmail_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[GMAIL-OAUTH-CALLBACK-2] Decoded state:', { stateUserId, returnTo });
  } catch {
    stateUserId = state || '';
    console.log('[GMAIL-OAUTH-CALLBACK-2] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[GMAIL-OAUTH-CALLBACK-ERROR] No userId in state');
    return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches (but don't require it - session might not persist through OAuth redirect)
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[GMAIL-OAUTH-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    console.log('[GMAIL-OAUTH-CALLBACK-3] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code, baseUrl);
    console.log('[GMAIL-OAUTH-CALLBACK-4] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Google user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);
    console.log('[GMAIL-OAUTH-CALLBACK-5] Got Google user info', {
      email: googleUser.email,
      name: googleUser.name,
    });

    // Find or create user in database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (!user) {
      console.log('[GMAIL-OAUTH-CALLBACK-6] Creating new user');
      const userName = googleUser.name || [googleUser.given_name, googleUser.family_name].filter(Boolean).join(' ') || null;
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: googleUser.email,
          name: userName,
        })
        .returning();
      user = newUser;
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check for email conflicts (same email connected to different user)
    const emailConflict = await db.query.emailConnections.findFirst({
      where: and(
        eq(emailConnections.email, googleUser.email),
        eq(emailConnections.provider, 'gmail'),
      ),
    });

    if (emailConflict && emailConflict.userId !== user.id) {
      console.error('[GMAIL-OAUTH-CALLBACK] Email already connected to another user', {
        email: googleUser.email,
        existingUserId: emailConflict.userId,
        currentUserId: user.id,
      });
      const separator = returnTo.includes('?') ? '&' : '?';
      const errorTarget = returnTo.startsWith('/onboarding')
        ? `/onboarding?step=3&email_error=already_connected`
        : `/dashboard/settings?error=email_conflict&message=${encodeURIComponent('This Gmail account is already connected to another user.')}`;
      return NextResponse.redirect(new URL(errorTarget, baseUrl));
    }

    // Upsert email connection
    const existingConnection = await db.query.emailConnections.findFirst({
      where: and(
        eq(emailConnections.userId, user.id),
        eq(emailConnections.provider, 'gmail'),
      ),
    });

    const userName = googleUser.name || [googleUser.given_name, googleUser.family_name].filter(Boolean).join(' ') || null;

    if (existingConnection) {
      // Update existing connection
      const updateData: Record<string, unknown> = {
        email: googleUser.email,
        displayName: userName,
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
        .update(emailConnections)
        .set(updateData)
        .where(eq(emailConnections.id, existingConnection.id));
      console.log('[GMAIL-OAUTH-CALLBACK-7] Updated existing Gmail connection');
    } else {
      // Create new connection - refresh token required
      if (!refreshTokenEncrypted) {
        console.error('[GMAIL-OAUTH-CALLBACK-ERROR] No refresh token received for new connection');
        const errorTarget = returnTo.startsWith('/onboarding')
          ? '/onboarding?step=3&email_error=token_exchange'
          : '/dashboard/settings?error=no_refresh_token&message=Please try connecting Gmail again';
        return NextResponse.redirect(new URL(errorTarget, baseUrl));
      }

      await db.insert(emailConnections).values({
        userId: user.id,
        provider: 'gmail',
        email: googleUser.email,
        displayName: userName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
        isDefault: true,
      });
      console.log('[GMAIL-OAUTH-CALLBACK-7] Created new Gmail connection');
    }

    console.log('[GMAIL-OAUTH-CALLBACK-8] Gmail OAuth flow completed successfully', {
      clerkUserId,
      email: googleUser.email,
      returnTo,
    });

    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (err) {
    console.error('[GMAIL-OAUTH-CALLBACK-ERROR] Error processing OAuth callback:', err);
    const errorTarget = returnTo.startsWith('/onboarding')
      ? '/onboarding?step=3&email_error=token_exchange'
      : `/dashboard/settings?error=oauth_failed&message=${encodeURIComponent(String(err))}`;
    return NextResponse.redirect(new URL(errorTarget, baseUrl));
  }
}

async function exchangeCodeForTokens(code: string, baseUrl: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = `${baseUrl}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GMAIL-OAUTH-TOKEN-ERROR] Token exchange failed:', {
      status: response.status,
      error: errorText,
      redirectUri,
    });
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}
