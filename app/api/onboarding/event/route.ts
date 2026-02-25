import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { onboardingEvents } from '@/lib/db/schema';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

// Allow longer timeout for cold starts
export const maxDuration = 60;

const onboardingEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  stepNumber: z.number().int().min(1).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting - auth endpoint (30/min per IP)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`onboarding-event:${clientId}`, RATE_LIMITS.AUTH);

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

    const parsed = await parseBody(request, onboardingEventSchema);
    if ('error' in parsed) return parsed.error;
    const { eventType, stepNumber, metadata } = parsed.data;

    await db.insert(onboardingEvents).values({
      clerkId: userId,
      eventType,
      stepNumber: stepNumber || null,
      metadata: metadata || null,
    });

    console.log('[ONBOARDING-EVENT]', eventType, 'step:', stepNumber, 'user:', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING-EVENT] Error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
