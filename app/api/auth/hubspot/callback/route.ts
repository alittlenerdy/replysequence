import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeHubSpotCode } from '@/lib/hubspot';
import { db } from '@/lib/db';
import { users, hubspotConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/hubspot/callback
 * Handles HubSpot OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for OAuth error
    if (error) {
      console.error('[HUBSPOT-CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=hubspot_${error}`, request.url)
      );
    }

    // Validate code
    if (!code) {
      console.error('[HUBSPOT-CALLBACK] Missing code');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=hubspot_missing_code', request.url)
      );
    }

    // Validate state (CSRF protection)
    const storedState = request.cookies.get('hubspot_oauth_state')?.value;
    if (!state || state !== storedState) {
      console.error('[HUBSPOT-CALLBACK] State mismatch');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=hubspot_invalid_state', request.url)
      );
    }

    // Verify state contains correct user
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      if (stateData.userId !== clerkId) {
        console.error('[HUBSPOT-CALLBACK] User mismatch in state');
        return NextResponse.redirect(
          new URL('/dashboard/settings?error=hubspot_invalid_state', request.url)
        );
      }

      // Check state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        console.error('[HUBSPOT-CALLBACK] State expired');
        return NextResponse.redirect(
          new URL('/dashboard/settings?error=hubspot_state_expired', request.url)
        );
      }
    } catch {
      console.error('[HUBSPOT-CALLBACK] Invalid state format');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=hubspot_invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeHubSpotCode(code);

    // Get user from database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      console.error('[HUBSPOT-CALLBACK] User not found');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=user_not_found', request.url)
      );
    }

    // Get HubSpot account info (portal ID)
    const tokenInfoResponse = await fetch(
      'https://api.hubapi.com/oauth/v1/access-tokens/' + tokens.accessToken
    );
    const tokenInfo = await tokenInfoResponse.json();

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.accessToken);
    const refreshTokenEncrypted = encrypt(tokens.refreshToken);

    // Store or update connection
    await db
      .insert(hubspotConnections)
      .values({
        userId: user.id,
        hubspotPortalId: tokenInfo.hub_id?.toString() || 'unknown',
        hubspotUserEmail: tokenInfo.user || null,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scopes: tokenInfo.scopes?.join(' ') || '',
        connectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: hubspotConnections.userId,
        set: {
          hubspotPortalId: tokenInfo.hub_id?.toString() || 'unknown',
          hubspotUserEmail: tokenInfo.user || null,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          scopes: tokenInfo.scopes?.join(' ') || '',
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    console.log(JSON.stringify({
      level: 'info',
      message: 'HubSpot connected successfully',
      userId: user.id,
      portalId: tokenInfo.hub_id,
      timestamp: new Date().toISOString(),
    }));

    // Clear state cookie and redirect to settings
    const response = NextResponse.redirect(
      new URL('/dashboard/settings?success=hubspot_connected', request.url)
    );
    response.cookies.delete('hubspot_oauth_state');

    return response;
  } catch (error) {
    console.error('[HUBSPOT-CALLBACK-ERROR]', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=hubspot_connection_failed', request.url)
    );
  }
}
