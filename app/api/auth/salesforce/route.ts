import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSalesforceAuthUrl, isSalesforceConfigured } from '@/lib/salesforce';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/salesforce
 * Initiates Salesforce OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSalesforceConfigured()) {
      return NextResponse.json(
        { error: 'Salesforce integration not configured' },
        { status: 503 }
      );
    }

    // Read optional redirect param (for onboarding returnTo support)
    const redirect = request.nextUrl.searchParams.get('redirect') || '';

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId,
        nonce: randomUUID(),
        timestamp: Date.now(),
        returnTo: redirect,
      })
    ).toString('base64url');

    const authUrl = getSalesforceAuthUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('salesforce_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Salesforce OAuth initiated',
      userId,
      timestamp: new Date().toISOString(),
    }));

    return response;
  } catch (error) {
    console.error('[SALESFORCE-AUTH-ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to initiate Salesforce authentication' },
      { status: 500 }
    );
  }
}
