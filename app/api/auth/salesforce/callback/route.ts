import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeSalesforceCode, getSalesforceUserInfo } from '@/lib/salesforce';
import { db } from '@/lib/db';
import { users, salesforceConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/salesforce/callback
 * Handles Salesforce OAuth callback
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
      console.error('[SALESFORCE-CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=integrations&error=salesforce_${error}`, request.url)
      );
    }

    // Validate code
    if (!code) {
      console.error('[SALESFORCE-CALLBACK] Missing code');
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&error=salesforce_missing_code', request.url)
      );
    }

    // Validate state (CSRF protection)
    const storedState = request.cookies.get('salesforce_oauth_state')?.value;
    if (!state || state !== storedState) {
      console.error('[SALESFORCE-CALLBACK] State mismatch');
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&error=salesforce_invalid_state', request.url)
      );
    }

    // Verify state contains correct user and extract returnTo
    let returnTo = '';
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      if (stateData.userId !== clerkId) {
        console.error('[SALESFORCE-CALLBACK] User mismatch in state');
        return NextResponse.redirect(
          new URL('/dashboard/settings?tab=integrations&error=salesforce_invalid_state', request.url)
        );
      }

      // Check state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        console.error('[SALESFORCE-CALLBACK] State expired');
        return NextResponse.redirect(
          new URL('/dashboard/settings?tab=integrations&error=salesforce_state_expired', request.url)
        );
      }

      if (stateData.returnTo && typeof stateData.returnTo === 'string') {
        returnTo = stateData.returnTo;
      }
    } catch {
      console.error('[SALESFORCE-CALLBACK] Invalid state format');
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&error=salesforce_invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeSalesforceCode(code);

    // Get user from database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      console.error('[SALESFORCE-CALLBACK] User not found');
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&error=user_not_found', request.url)
      );
    }

    // Get Salesforce user info from identity URL
    const sfUser = await getSalesforceUserInfo(tokens.accessToken, tokens.identityUrl);

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(tokens.accessToken);
    const refreshTokenEncrypted = encrypt(tokens.refreshToken);

    // Salesforce access tokens don't have a fixed expiry — they last until revoked or session timeout
    // Default session timeout is 2 hours, so we'll use that as a conservative expiry
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Store or update connection
    await db
      .insert(salesforceConnections)
      .values({
        userId: user.id,
        salesforceUserId: sfUser.userId,
        salesforceUserEmail: sfUser.email,
        salesforceOrgId: sfUser.orgId,
        instanceUrl: tokens.instanceUrl,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt: expiresAt,
        scopes: tokens.scopes,
        connectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: salesforceConnections.userId,
        set: {
          salesforceUserId: sfUser.userId,
          salesforceUserEmail: sfUser.email,
          salesforceOrgId: sfUser.orgId,
          instanceUrl: tokens.instanceUrl,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          accessTokenExpiresAt: expiresAt,
          scopes: tokens.scopes,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Salesforce connected successfully',
      userId: user.id,
      orgId: sfUser.orgId,
      email: sfUser.email,
      timestamp: new Date().toISOString(),
    }));

    // Clear state cookie and redirect
    const successUrl = returnTo && returnTo.startsWith('/')
      ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}success=salesforce_connected`
      : '/dashboard/settings?tab=integrations&success=salesforce_connected';
    const response = NextResponse.redirect(
      new URL(successUrl, request.url)
    );
    response.cookies.delete('salesforce_oauth_state');

    return response;
  } catch (error) {
    console.error('[SALESFORCE-CALLBACK-ERROR]', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&error=salesforce_connection_failed', request.url)
    );
  }
}
