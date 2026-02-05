import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { onboardingEvents } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, stepNumber, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

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
