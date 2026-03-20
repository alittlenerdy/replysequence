/**
 * Zoom OAuth Authorization Route
 * Redirects user to Zoom's authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  console.log('[ZOOM-OAUTH] Route handler called');

  // Get redirect parameter for returning to onboarding or dashboard
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('redirect') || '/dashboard?zoom_connected=true';

  // Debug environment variables
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();

  console.log('[ZOOM-OAUTH] Environment check:', {
    hasClientId: !!clientId,
    clientIdPrefix: clientId?.substring(0, 8) + '...',
    hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
    hasAppUrl: !!rawAppUrl,
    rawAppUrl,
    returnTo,
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

  // Generate a random nonce for CSRF protection
  const csrfNonce = crypto.randomUUID();

  // Encode returnTo in state along with userId and CSRF nonce
  const statePayload = JSON.stringify({ userId, returnTo, nonce: csrfNonce });
  const state = Buffer.from(statePayload).toString('base64url');

  console.log('[ZOOM-OAUTH] URL construction:', {
    rawAppUrl,
    baseUrl,
    redirectUri,
    returnTo,
    expectedInZoom: 'https://www.replysequence.com/api/auth/zoom/callback',
  });

  // Build Zoom OAuth URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state, // Encoded userId + returnTo + nonce
  });

  const zoomAuthUrl = `https://zoom.us/oauth/authorize?${params.toString()}`;

  console.log('[ZOOM-OAUTH] Final authorization URL:', {
    userId,
    redirectUri,
  });

  // Set CSRF state cookie and redirect
  const response = NextResponse.redirect(zoomAuthUrl);
  response.cookies.set('oauth_state_zoom', csrfNonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  return response;
}
