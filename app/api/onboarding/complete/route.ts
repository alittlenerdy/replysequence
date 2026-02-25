import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, onboardingEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Apply rate limiting - auth endpoint (30/min per IP)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`onboarding-complete:${clientId}`, RATE_LIMITS.AUTH);

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

    const completedAt = new Date();

    // Mark onboarding as complete
    await db
      .update(userOnboarding)
      .set({
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(userOnboarding.clerkId, userId));

    // Log completion event
    await db.insert(onboardingEvents).values({
      clerkId: userId,
      eventType: 'onboarding_completed',
      stepNumber: 6,
      metadata: { completedAt: completedAt.toISOString() },
    });

    console.log('[ONBOARDING-COMPLETE] User completed onboarding:', userId, 'at', completedAt);

    return NextResponse.json({ success: true, completedAt });
  } catch (error) {
    console.error('[ONBOARDING-COMPLETE] Error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
