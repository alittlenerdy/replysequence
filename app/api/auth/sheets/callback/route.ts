/**
 * Google Sheets OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens in sheetsConnections
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { sheetsConnections } from '@/lib/db/schema';
import { encrypt } from '@/lib/encryption';

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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

  // Determine redirect target from state
  let returnTo = '/dashboard/settings?sheets_connected=true';
  const errorRedirectBase = state ? (() => {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed.returnTo?.startsWith('/onboarding')) return '/onboarding?step=5';
    } catch { /* fall through */ }
    return '/dashboard/settings';
  })() : '/dashboard/settings';

  if (error) {
    console.error('[SHEETS-OAUTH-CALLBACK] OAuth error:', { error, description: errorDescription });
    const separator = errorRedirectBase.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}${separator}sheets_error=auth_failed`, baseUrl)
    );
  }

  if (!code) {
    console.error('[SHEETS-OAUTH-CALLBACK] Missing authorization code');
    const separator = errorRedirectBase.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      new URL(`${errorRedirectBase}${separator}sheets_error=auth_failed`, baseUrl)
    );
  }

  // Decode state
  let stateUserId: string;
  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
  } catch {
    stateUserId = state || '';
  }

  if (!stateUserId) {
    console.error('[SHEETS-OAUTH-CALLBACK] No userId in state');
    return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', baseUrl));
  }

  // Verify session
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[SHEETS-OAUTH-CALLBACK] Session userId differs from state userId');
  }

  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, baseUrl);

    // Get Google user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (!user) {
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

    // Check for existing connection
    const existingConnection = await db.query.sheetsConnections.findFirst({
      where: and(
        eq(sheetsConnections.userId, user.id),
        eq(sheetsConnections.googleUserId, googleUser.id),
      ),
    });

    const userName = googleUser.name || [googleUser.given_name, googleUser.family_name].filter(Boolean).join(' ') || null;

    if (existingConnection) {
      const updateData: Record<string, unknown> = {
        googleEmail: googleUser.email,
        googleDisplayName: userName,
        accessTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
        lastRefreshedAt: new Date(),
        updatedAt: new Date(),
      };

      if (refreshTokenEncrypted) {
        updateData.refreshTokenEncrypted = refreshTokenEncrypted;
      }

      await db
        .update(sheetsConnections)
        .set(updateData)
        .where(eq(sheetsConnections.id, existingConnection.id));
      console.log('[SHEETS-OAUTH-CALLBACK] Updated existing Sheets connection');
    } else {
      if (!refreshTokenEncrypted) {
        console.error('[SHEETS-OAUTH-CALLBACK] No refresh token for new connection');
        const separator = returnTo.includes('?') ? '&' : '?';
        return NextResponse.redirect(
          new URL(`${returnTo}${separator}sheets_error=token_exchange`, baseUrl)
        );
      }

      await db.insert(sheetsConnections).values({
        userId: user.id,
        googleUserId: googleUser.id,
        googleEmail: googleUser.email,
        googleDisplayName: userName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
      });
      console.log('[SHEETS-OAUTH-CALLBACK] Created new Sheets connection');
    }

    console.log('[SHEETS-OAUTH-CALLBACK] OAuth flow completed', {
      clerkUserId,
      email: googleUser.email,
      returnTo,
    });

    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (err) {
    console.error('[SHEETS-OAUTH-CALLBACK] Error:', err);
    const separator = returnTo.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      new URL(`${returnTo}${separator}sheets_error=token_exchange`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string, baseUrl: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = `${baseUrl}/api/auth/sheets/callback`;

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
    console.error('[SHEETS-OAUTH-TOKEN] Token exchange failed:', {
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
