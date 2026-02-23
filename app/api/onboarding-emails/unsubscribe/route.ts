/**
 * Onboarding Email Unsubscribe Endpoint
 *
 * GET handler clicked from email links. Verifies HMAC token,
 * sets onboardingEmailsUnsubscribed=true, and returns a confirmation page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUnsubscribeToken } from '@/lib/onboarding-emails';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  if (!userId || !token) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link is invalid or incomplete.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Verify HMAC token
  let isValid = false;
  try {
    isValid = verifyUnsubscribeToken(userId, token);
  } catch {
    // Token format invalid (e.g., not valid hex)
  }

  if (!isValid) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link has expired or is invalid.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Update user record
  const result = await db
    .update(users)
    .set({ onboardingEmailsUnsubscribed: true })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (result.length === 0) {
    return new NextResponse(renderPage('Not Found', 'We could not find your account.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'User unsubscribed from onboarding emails',
    userId,
  }));

  return new NextResponse(
    renderPage(
      "You've been unsubscribed",
      "You won't receive any more onboarding emails from ReplySequence. You can close this page.",
    ),
    { status: 200, headers: { 'Content-Type': 'text/html' } },
  );
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ReplySequence</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #0a0a0f;
      color: #e5e7eb;
    }
    .container {
      text-align: center;
      max-width: 400px;
      padding: 40px 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #f9fafb;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
