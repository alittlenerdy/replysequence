import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`onboarding-consent:${clientId}`, RATE_LIMITS.AUTH);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consentedAt = new Date();

    await db
      .update(users)
      .set({ consentedAt, updatedAt: consentedAt })
      .where(eq(users.clerkId, userId));

    console.log('[ONBOARDING-CONSENT] User consented:', userId, 'at', consentedAt);

    return NextResponse.json({ success: true, consentedAt });
  } catch (error) {
    console.error('[ONBOARDING-CONSENT] Error:', error);
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
  }
}
