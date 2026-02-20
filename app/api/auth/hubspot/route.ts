import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getHubSpotAuthUrl, isHubSpotConfigured } from '@/lib/hubspot';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/hubspot
 * Initiates HubSpot OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isHubSpotConfigured()) {
      return NextResponse.json(
        { error: 'HubSpot integration not configured' },
        { status: 503 }
      );
    }

    // Read optional redirect param (for onboarding returnTo support)
    const redirect = request.nextUrl.searchParams.get('redirect') || '';

    // Generate state parameter for CSRF protection
    // Include userId to verify on callback, and returnTo for post-auth redirect
    const state = Buffer.from(
      JSON.stringify({
        userId,
        nonce: randomUUID(),
        timestamp: Date.now(),
        returnTo: redirect,
      })
    ).toString('base64url');

    // Store state in a cookie for validation on callback
    const authUrl = getHubSpotAuthUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('hubspot_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'HubSpot OAuth initiated',
      userId,
      timestamp: new Date().toISOString(),
    }));

    return response;
  } catch (error) {
    console.error('[HUBSPOT-AUTH-ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to initiate HubSpot authentication' },
      { status: 500 }
    );
  }
}
