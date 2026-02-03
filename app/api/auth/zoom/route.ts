/**
 * Zoom OAuth Authorization Route
 * Redirects user to Zoom's authorization page
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL));
  }

  const clientId = process.env.ZOOM_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/zoom/callback`;

  if (!clientId) {
    console.error('[ZOOM-OAUTH] Missing ZOOM_CLIENT_ID');
    return NextResponse.redirect(
      new URL('/dashboard?error=configuration', process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  // Build Zoom OAuth URL
  // Using userId as state parameter for CSRF protection and user identification
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: userId, // Pass Clerk userId to callback
  });

  const zoomAuthUrl = `https://zoom.us/oauth/authorize?${params.toString()}`;

  console.log('[ZOOM-OAUTH] Redirecting to Zoom authorization', {
    userId,
    redirectUri,
  });

  return NextResponse.redirect(zoomAuthUrl);
}
