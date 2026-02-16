/**
 * Outlook Email OAuth Callback Route
 * Exchanges authorization code for tokens, stores encrypted tokens in emailConnections
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, emailConnections } from '@/lib/db/schema';
import { encrypt } from '@/lib/encryption';

export const maxDuration = 60;

interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface MicrosoftUserInfo {
  id: string;
  mail: string;
  displayName: string;
  userPrincipalName: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

  console.log('[OUTLOOK-OAUTH-CALLBACK-1] Callback received', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none',
  });

  // Handle OAuth errors from Microsoft
  if (error) {
    console.error('[OUTLOOK-OAUTH-CALLBACK-ERROR] OAuth error from Microsoft:', {
      error,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=outlook_denied&message=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error('[OUTLOOK-OAUTH-CALLBACK-ERROR] Missing authorization code');
    return NextResponse.redirect(new URL('/dashboard/settings?error=missing_code', baseUrl));
  }

  // Decode state to get userId and returnTo
  let stateUserId: string;
  let returnTo = '/dashboard/settings?outlook_connected=true';

  try {
    const decoded = Buffer.from(state || '', 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    stateUserId = parsed.userId;
    returnTo = parsed.returnTo || returnTo;
    console.log('[OUTLOOK-OAUTH-CALLBACK-2] Decoded state:', { stateUserId, returnTo });
  } catch {
    stateUserId = state || '';
    console.log('[OUTLOOK-OAUTH-CALLBACK-2] Using legacy state format:', { stateUserId });
  }

  if (!stateUserId) {
    console.error('[OUTLOOK-OAUTH-CALLBACK-ERROR] No userId in state');
    return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', baseUrl));
  }

  // Optionally verify current session matches
  const { userId: currentSessionUserId } = await auth();
  if (currentSessionUserId && currentSessionUserId !== stateUserId) {
    console.warn('[OUTLOOK-OAUTH-CALLBACK] Session userId differs from state userId - using state userId', {
      sessionUserId: currentSessionUserId,
      stateUserId,
    });
  }

  const clerkUserId = stateUserId;

  try {
    // Exchange code for tokens
    console.log('[OUTLOOK-OAUTH-CALLBACK-3] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code, baseUrl);
    console.log('[OUTLOOK-OAUTH-CALLBACK-4] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Microsoft user info
    const msUser = await getMicrosoftUserInfo(tokens.access_token);
    const msEmail = msUser.mail || msUser.userPrincipalName;
    console.log('[OUTLOOK-OAUTH-CALLBACK-5] Got Microsoft user info', {
      email: msEmail,
      displayName: msUser.displayName,
    });

    // Find or create user in database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (!user) {
      console.log('[OUTLOOK-OAUTH-CALLBACK-6] Creating new user');
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: msEmail,
          name: msUser.displayName,
        })
        .returning();
      user = newUser;
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.access_token);
    const refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check for email conflicts
    const emailConflict = await db.query.emailConnections.findFirst({
      where: and(
        eq(emailConnections.email, msEmail),
        eq(emailConnections.provider, 'outlook'),
      ),
    });

    if (emailConflict && emailConflict.userId !== user.id) {
      console.error('[OUTLOOK-OAUTH-CALLBACK] Email already connected to another user', {
        email: msEmail,
        existingUserId: emailConflict.userId,
        currentUserId: user.id,
      });
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=email_conflict&message=${encodeURIComponent('This Outlook account is already connected to another user.')}`, baseUrl)
      );
    }

    // Upsert email connection
    const existingConnection = await db.query.emailConnections.findFirst({
      where: and(
        eq(emailConnections.userId, user.id),
        eq(emailConnections.provider, 'outlook'),
      ),
    });

    if (existingConnection) {
      const updateData: Record<string, unknown> = {
        email: msEmail,
        displayName: msUser.displayName,
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
        .update(emailConnections)
        .set(updateData)
        .where(eq(emailConnections.id, existingConnection.id));
      console.log('[OUTLOOK-OAUTH-CALLBACK-7] Updated existing Outlook connection');
    } else {
      if (!refreshTokenEncrypted) {
        console.error('[OUTLOOK-OAUTH-CALLBACK-ERROR] No refresh token received for new connection');
        return NextResponse.redirect(
          new URL('/dashboard/settings?error=no_refresh_token&message=Please try connecting Outlook again', baseUrl)
        );
      }

      await db.insert(emailConnections).values({
        userId: user.id,
        provider: 'outlook',
        email: msEmail,
        displayName: msUser.displayName,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        scopes: tokens.scope,
        isDefault: true,
      });
      console.log('[OUTLOOK-OAUTH-CALLBACK-7] Created new Outlook connection');
    }

    console.log('[OUTLOOK-OAUTH-CALLBACK-8] Outlook OAuth flow completed successfully', {
      clerkUserId,
      email: msEmail,
      returnTo,
    });

    return NextResponse.redirect(new URL(returnTo, baseUrl));
  } catch (error) {
    console.error('[OUTLOOK-OAUTH-CALLBACK-ERROR] Error processing OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=oauth_failed&message=${encodeURIComponent(String(error))}`, baseUrl)
    );
  }
}

async function exchangeCodeForTokens(code: string, baseUrl: string): Promise<MicrosoftTokenResponse> {
  const clientId = process.env.MICROSOFT_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();
  const redirectUri = `${baseUrl}/api/auth/outlook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Microsoft OAuth credentials');
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OUTLOOK-OAUTH-TOKEN-ERROR] Token exchange failed:', {
      status: response.status,
      error: errorText,
      redirectUri,
    });
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

async function getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Microsoft user info: ${response.status}`);
  }

  return response.json();
}
