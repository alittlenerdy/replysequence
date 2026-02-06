/**
 * Microsoft Teams OAuth Authorization Route
 * Redirects user to Microsoft's authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[TEAMS-OAUTH] Route handler called');

  // Get redirect parameter for returning to onboarding or dashboard
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('redirect') || '/dashboard?teams_connected=true';

  // Debug environment variables
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.MICROSOFT_TEAMS_CLIENT_ID?.trim();
  const tenantId = process.env.MICROSOFT_TEAMS_TENANT_ID?.trim() || 'common';

  console.log('[TEAMS-OAUTH] Environment check:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 8) + '...',
    hasClientSecret: !!process.env.MICROSOFT_TEAMS_CLIENT_SECRET,
    hasAppUrl: !!rawAppUrl,
    rawAppUrl,
    tenantId,
  });

  const { userId } = await auth();
  console.log('[TEAMS-OAUTH] Auth result:', { userId: userId ? 'present' : 'missing' });

  if (!userId) {
    console.log('[TEAMS-OAUTH] No userId, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', rawAppUrl || 'http://localhost:3000'));
  }

  if (!clientId) {
    console.error('[TEAMS-OAUTH] Missing MICROSOFT_TEAMS_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard?error=configuration', rawAppUrl || 'http://localhost:3000')
    );
  }

  // CRITICAL: Remove trailing slash to prevent double-slash in redirect URI
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/teams/callback`;

  console.log('[TEAMS-OAUTH] URL construction:', {
    rawAppUrl,
    baseUrl,
    redirectUri,
    tenantId,
    returnTo,
  });

  // Microsoft Graph API scopes for Teams meeting transcripts
  // Using delegated permissions (user-consented access)
  const scopes = [
    'openid',
    'profile',
    'email',
    'offline_access', // Required for refresh_token
    'OnlineMeetings.Read',
    'OnlineMeetingTranscript.Read.All',
  ].join(' ');

  // Encode returnTo in state along with userId for CSRF protection
  const statePayload = JSON.stringify({ userId, returnTo });
  const state = Buffer.from(statePayload).toString('base64');

  // Build Microsoft OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: scopes,
    state, // Encoded userId + returnTo
  });

  // Use 'common' for multi-tenant or specific tenant ID for single-tenant
  const msAuthUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  console.log('[TEAMS-OAUTH] Final authorization URL:', {
    userId,
    redirectUri,
    scopes,
    tenantId,
    fullUrlLength: msAuthUrl.length,
  });

  return NextResponse.redirect(msAuthUrl);
}
