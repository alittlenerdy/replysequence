/**
 * Zoom OAuth Authorization Route
 * Redirects user to Zoom's authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[ZOOM-OAUTH] Route handler called');

  // Debug environment variables
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.ZOOM_CLIENT_ID;

  console.log('[ZOOM-OAUTH] Environment check:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 8) + '...',
    hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
    hasAppUrl: !!rawAppUrl,
    rawAppUrl,
    hasTrailingSlash: rawAppUrl.endsWith('/'),
  });

  const { userId } = await auth();
  console.log('[ZOOM-OAUTH] Auth result:', { userId: userId ? 'present' : 'missing' });

  if (!userId) {
    console.log('[ZOOM-OAUTH] No userId, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', rawAppUrl || 'http://localhost:3000'));
  }

  if (!clientId) {
    console.error('[ZOOM-OAUTH] Missing ZOOM_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard?error=configuration', rawAppUrl || 'http://localhost:3000')
    );
  }

  // CRITICAL: Remove trailing slash to prevent double-slash in redirect URI
  const baseUrl = rawAppUrl.replace(/\/+$/, '');
  const redirectUri = `${baseUrl}/api/auth/zoom/callback`;

  console.log('[ZOOM-OAUTH] URL construction:', {
    rawAppUrl,
    baseUrl,
    redirectUri,
    expectedInZoom: 'https://replysequence.vercel.app/api/auth/zoom/callback',
    urlsMatch: redirectUri === 'https://replysequence.vercel.app/api/auth/zoom/callback',
  });

  // Build Zoom OAuth URL
  // Using userId as state parameter for CSRF protection and user identification
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: userId, // Pass Clerk userId to callback
  });

  const zoomAuthUrl = `https://zoom.us/oauth/authorize?${params.toString()}`;

  console.log('[ZOOM-OAUTH] Final authorization URL:', {
    userId,
    redirectUri,
    encodedRedirectUri: encodeURIComponent(redirectUri),
    fullUrl: zoomAuthUrl,
  });

  return NextResponse.redirect(zoomAuthUrl);
}
