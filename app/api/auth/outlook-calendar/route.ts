/**
 * Outlook Calendar OAuth Authorization Route
 * Redirects user to Microsoft's authorization page for calendar access
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  console.log('[OUTLOOK-CALENDAR-OAUTH-START-1] Route handler called');

  // Get redirect parameter for returning to onboarding or dashboard
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('redirect') || '/dashboard?calendar_connected=true';

  // Debug environment variables
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.MICROSOFT_TEAMS_CLIENT_ID?.trim(); // Reuse Teams client ID
  const tenantId = process.env.MICROSOFT_TEAMS_TENANT_ID?.trim() || 'common';

  console.log('[OUTLOOK-CALENDAR-OAUTH-START-2] Environment check:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 20) + '...',
    hasClientSecret: !!process.env.MICROSOFT_TEAMS_CLIENT_SECRET,
    hasAppUrl: !!rawAppUrl,
    tenantId,
    rawAppUrl,
  });

  const { userId } = await auth();
  console.log('[OUTLOOK-CALENDAR-OAUTH-START-3] Auth result:', { userId: userId ? 'present' : 'missing' });

  if (!userId) {
    console.log('[OUTLOOK-CALENDAR-OAUTH-START-ERROR] No userId, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', rawAppUrl || 'http://localhost:3000'));
  }

  if (!clientId) {
    console.error('[OUTLOOK-CALENDAR-OAUTH-START-ERROR] Missing MICROSOFT_TEAMS_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard?error=configuration', rawAppUrl || 'http://localhost:3000')
    );
  }

  // CRITICAL: Remove trailing slash to prevent double-slash in redirect URI
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/outlook-calendar/callback`;

  console.log('[OUTLOOK-CALENDAR-OAUTH-START-4] URL construction:', {
    rawAppUrl,
    baseUrl,
    redirectUri,
    returnTo,
  });

  // Microsoft OAuth 2.0 scopes for Calendar access only
  const scopes = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Calendars.Read',
  ].join(' ');

  // Encode returnTo in state along with userId for CSRF protection
  const statePayload = JSON.stringify({ userId, returnTo });
  const state = Buffer.from(statePayload).toString('base64');

  // Build Microsoft OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    response_mode: 'query',
    state, // Encoded userId + returnTo
  });

  const microsoftAuthUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  console.log('[OUTLOOK-CALENDAR-OAUTH-START-5] Final authorization URL:', {
    userId,
    redirectUri,
    scopes,
    fullUrlLength: microsoftAuthUrl.length,
    microsoftAuthUrl: microsoftAuthUrl.substring(0, 200) + '...',
  });

  // Important: The redirect_uri used here MUST exactly match what's configured in Azure AD
  console.log('[OUTLOOK-CALENDAR-OAUTH-START-6] IMPORTANT - Verify this redirect_uri is in Azure AD:', redirectUri);

  return NextResponse.redirect(microsoftAuthUrl);
}
