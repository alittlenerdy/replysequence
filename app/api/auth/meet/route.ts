/**
 * Google Meet OAuth Authorization Route
 * Redirects user to Google's authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[MEET-OAUTH-START-1] Route handler called');

  // Debug environment variables
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.GOOGLE_CLIENT_ID;

  console.log('[MEET-OAUTH-START-2] Environment check:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 20) + '...',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasAppUrl: !!rawAppUrl,
    rawAppUrl,
  });

  const { userId } = await auth();
  console.log('[MEET-OAUTH-START-3] Auth result:', { userId: userId ? 'present' : 'missing' });

  if (!userId) {
    console.log('[MEET-OAUTH-START-ERROR] No userId, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', rawAppUrl || 'http://localhost:3000'));
  }

  if (!clientId) {
    console.error('[MEET-OAUTH-START-ERROR] Missing GOOGLE_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard?error=configuration', rawAppUrl || 'http://localhost:3000')
    );
  }

  // CRITICAL: Remove trailing slash to prevent double-slash in redirect URI
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/meet/callback`;

  console.log('[MEET-OAUTH-START-4] URL construction:', {
    rawAppUrl,
    baseUrl,
    redirectUri,
  });

  // Google OAuth 2.0 scopes for Meet transcripts
  // Using delegated permissions (user-consented access)
  const scopes = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/meetings.space.readonly',
  ].join(' ');

  // Build Google OAuth URL
  // Using userId as state parameter for CSRF protection and user identification
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen to get refresh token every time
    state: userId, // Pass Clerk userId to callback
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('[MEET-OAUTH-START-5] Final authorization URL:', {
    userId,
    redirectUri,
    scopes,
    fullUrlLength: googleAuthUrl.length,
  });

  return NextResponse.redirect(googleAuthUrl);
}
