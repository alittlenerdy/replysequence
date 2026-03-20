import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, onboardingEvents, users, zoomConnections, teamsConnections, meetConnections, emailConnections, hubspotConnections, salesforceConnections, sheetsConnections } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

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

    // Mark onboarding as complete + log event atomically
    await db.transaction(async (tx) => {
      // Only set completedAt if not already completed (prevents double-completion race)
      await tx
        .update(userOnboarding)
        .set({
          completedAt,
          updatedAt: completedAt,
        })
        .where(
          and(
            eq(userOnboarding.clerkId, userId),
            isNull(userOnboarding.completedAt)
          )
        );

      await tx.insert(onboardingEvents).values({
        clerkId: userId,
        eventType: 'onboarding_completed',
        stepNumber: 6,
        metadata: { completedAt: completedAt.toISOString() },
      });
    });

    console.log('[ONBOARDING-COMPLETE] User completed onboarding:', userId, 'at', completedAt);

    // Fire-and-forget welcome email — don't block the response
    (async () => {
      try {
        const [user] = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);

        if (!user) return;

        // Fetch connection state in parallel
        const [zoomRows, teamsRows, meetRows, emailRows, hubspotRows, salesforceRows, sheetsRows] = await Promise.all([
          db.select({ id: zoomConnections.id }).from(zoomConnections).where(eq(zoomConnections.userId, user.id)).limit(1),
          db.select({ id: teamsConnections.id }).from(teamsConnections).where(eq(teamsConnections.userId, user.id)).limit(1),
          db.select({ id: meetConnections.id }).from(meetConnections).where(eq(meetConnections.userId, user.id)).limit(1),
          db.select({ id: emailConnections.id }).from(emailConnections).where(eq(emailConnections.userId, user.id)).limit(1),
          db.select({ id: hubspotConnections.id }).from(hubspotConnections).where(eq(hubspotConnections.userId, user.id)).limit(1),
          db.select({ id: salesforceConnections.id }).from(salesforceConnections).where(eq(salesforceConnections.userId, user.id)).limit(1),
          db.select({ id: sheetsConnections.id }).from(sheetsConnections).where(eq(sheetsConnections.userId, user.id)).limit(1),
        ]);

        const connectedPlatforms: string[] = [];
        if (zoomRows[0]) connectedPlatforms.push('zoom');
        if (teamsRows[0]) connectedPlatforms.push('teams');
        if (meetRows[0]) connectedPlatforms.push('meet');

        const crmConnected = hubspotRows[0] ? 'hubspot' : salesforceRows[0] ? 'salesforce' : sheetsRows[0] ? 'sheets' : null;

        await sendWelcomeEmail({
          email: user.email,
          name: user.name,
          connectedPlatforms,
          emailConnected: !!emailRows[0],
          crmConnected,
        });
      } catch (err) {
        console.error('[ONBOARDING-COMPLETE] Welcome email failed (non-blocking):', err);
      }
    })();

    return NextResponse.json({ success: true, completedAt });
  } catch (error) {
    console.error('[ONBOARDING-COMPLETE] Error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
