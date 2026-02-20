/**
 * Google Sheets OAuth Authorization Route
 * Redirects user to Google's authorization page with Sheets scope
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('redirect') || '/dashboard/settings?sheets_connected=true';

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', rawAppUrl || 'http://localhost:3000'));
  }

  if (!clientId) {
    console.error('[SHEETS-OAUTH] Missing GOOGLE_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=configuration', rawAppUrl || 'http://localhost:3000')
    );
  }

  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/sheets/callback`;

  const scopesList = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/spreadsheets',
  ];
  const scopes = scopesList.join(' ');

  const statePayload = JSON.stringify({ userId, returnTo });
  const state = Buffer.from(statePayload).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('[SHEETS-OAUTH] Redirecting to Google', {
    userId,
    redirectUri,
    returnTo,
  });

  return NextResponse.redirect(googleAuthUrl);
}
