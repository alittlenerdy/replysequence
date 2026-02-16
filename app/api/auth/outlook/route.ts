import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const redirect = request.nextUrl.searchParams.get('redirect') || '/dashboard/settings?outlook_connected=true';

    const clientId = process.env.MICROSOFT_TEAMS_CLIENT_ID?.trim();
    if (!clientId) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[OUTLOOK-OAUTH-START-1]',
        message: 'MICROSOFT_TEAMS_CLIENT_ID not configured',
      }));
      return NextResponse.json({ error: 'Outlook OAuth not configured' }, { status: 500 });
    }

    const { userId } = await auth();
    if (!userId) {
      console.log(JSON.stringify({
        level: 'warn',
        tag: '[OUTLOOK-OAUTH-START-2]',
        message: 'User not authenticated, redirecting to sign-in',
      }));
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/outlook/callback`;
    const scopes = 'openid profile email Mail.Send offline_access';

    const state = Buffer.from(JSON.stringify({
      userId,
      returnTo: redirect,
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    console.log(JSON.stringify({
      level: 'info',
      tag: '[OUTLOOK-OAUTH-START-3]',
      message: 'Redirecting to Microsoft OAuth',
      userId,
    }));

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[OUTLOOK-OAUTH-START-4]',
      message: 'Failed to initiate Outlook OAuth',
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}
