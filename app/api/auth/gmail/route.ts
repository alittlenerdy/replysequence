import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const tag = '[GMAIL-OAUTH-START]';

  try {
    // 1. Get redirect param
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get('redirect') || '/dashboard/settings?gmail_connected=true';

    // 2. Check env vars (trim to handle trailing whitespace/newlines in env)
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      console.log(JSON.stringify({
        level: 'error',
        tag: `${tag}-1`,
        message: 'GOOGLE_CLIENT_ID not configured',
      }));
      return NextResponse.json(
        { error: 'Gmail OAuth not configured' },
        { status: 500 }
      );
    }

    // 3. Auth check
    const { userId } = await auth();
    if (!userId) {
      console.log(JSON.stringify({
        level: 'warn',
        tag: `${tag}-2`,
        message: 'Unauthenticated user attempted Gmail OAuth',
      }));
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // 4. Build redirect URI
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/gmail/callback`;

    // 5. Scopes
    const scopes = [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.send',
    ].join(' ');

    // 6. State
    const state = Buffer.from(
      JSON.stringify({ userId, returnTo: redirect })
    ).toString('base64');

    // 7. Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    console.log(JSON.stringify({
      level: 'info',
      tag: `${tag}-3`,
      message: 'Redirecting to Google OAuth for Gmail',
      userId,
      redirectUri,
    }));

    // 8. Redirect
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: `${tag}-4`,
      message: 'Gmail OAuth start failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json(
      { error: 'Failed to start Gmail OAuth' },
      { status: 500 }
    );
  }
}
