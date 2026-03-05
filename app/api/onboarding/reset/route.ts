import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, onboardingEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`onboarding-reset:${clientId}`, RATE_LIMITS.AUTH);

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

    // Reset onboarding to step 1, clear completion
    await db
      .update(userOnboarding)
      .set({
        currentStep: 1,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userOnboarding.clerkId, userId));

    // Log reset event
    await db.insert(onboardingEvents).values({
      clerkId: userId,
      eventType: 'onboarding_reset',
      stepNumber: 1,
      metadata: { resetAt: new Date().toISOString() },
    });

    console.log('[ONBOARDING-RESET] User reset onboarding:', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING-RESET] Error:', error);
    return NextResponse.json({ error: 'Failed to reset onboarding' }, { status: 500 });
  }
}
