import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, users, zoomConnections, teamsConnections, calendarConnections, outlookCalendarConnections, emailConnections, hubspotConnections, sheetsConnections, salesforceConnections } from '@/lib/db/schema';
import type { OnboardingStep, ConnectedPlatform, EmailPreference } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Apply rate limiting - auth endpoint (30/min per IP)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`onboarding-progress:${clientId}`, RATE_LIMITS.AUTH);

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

    const [onboarding] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.clerkId, userId))
      .limit(1);

    if (!onboarding) {
      // Create initial record
      const [newRecord] = await db
        .insert(userOnboarding)
        .values({
          clerkId: userId,
          currentStep: 1,
        })
        .returning();

      console.log('[ONBOARDING] Created new onboarding record for user:', userId);
      return NextResponse.json({ ...newRecord, connectedPlatforms: [], googleCalendarConnected: false, outlookCalendarConnected: false });
    }

    // Fetch actual connection statuses from the database
    // Include meetConnected in user query to avoid a second users table lookup
    const [user] = await db
      .select({ id: users.id, meetConnected: users.meetConnected })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const connectedPlatforms: string[] = [];
    let googleCalendarConnected = false;
    let outlookCalendarConnected = false;
    let emailConnected = false;
    let connectedEmail: string | null = null;
    let emailProvider: string | null = null;
    let hubspotConnectedFlag = false;
    let salesforceConnectedFlag = false;
    let sheetsConnectedFlag = false;

    if (user) {
      // Run all platform connection queries in parallel — each is independent
      const [
        zoomConnRows,
        teamsConnRows,
        googleCalRows,
        outlookCalRows,
        emailConnRows,
        hubspotConnRows,
        salesforceConnRows,
        sheetsConnRows,
      ] = await Promise.all([
        db.select({ id: zoomConnections.id }).from(zoomConnections).where(eq(zoomConnections.userId, user.id)).limit(1),
        db.select({ id: teamsConnections.id }).from(teamsConnections).where(eq(teamsConnections.userId, user.id)).limit(1),
        db.select({ id: calendarConnections.id }).from(calendarConnections).where(eq(calendarConnections.userId, user.id)).limit(1),
        db.select({ id: outlookCalendarConnections.id }).from(outlookCalendarConnections).where(eq(outlookCalendarConnections.userId, user.id)).limit(1),
        db.select({ id: emailConnections.id, email: emailConnections.email, provider: emailConnections.provider }).from(emailConnections).where(eq(emailConnections.userId, user.id)).limit(1),
        db.select({ id: hubspotConnections.id }).from(hubspotConnections).where(eq(hubspotConnections.userId, user.id)).limit(1),
        db.select({ id: salesforceConnections.id }).from(salesforceConnections).where(eq(salesforceConnections.userId, user.id)).limit(1),
        db.select({ id: sheetsConnections.id }).from(sheetsConnections).where(eq(sheetsConnections.userId, user.id)).limit(1),
      ]);

      if (zoomConnRows[0]) connectedPlatforms.push('zoom');
      if (teamsConnRows[0]) connectedPlatforms.push('teams');
      if (user.meetConnected) connectedPlatforms.push('meet');

      googleCalendarConnected = !!googleCalRows[0];
      outlookCalendarConnected = !!outlookCalRows[0];

      emailConnected = !!emailConnRows[0];
      connectedEmail = emailConnRows[0]?.email || null;
      emailProvider = emailConnRows[0]?.provider || null;

      hubspotConnectedFlag = !!hubspotConnRows[0];
      salesforceConnectedFlag = !!salesforceConnRows[0];
      sheetsConnectedFlag = !!sheetsConnRows[0];
    }

    // Recalculate currentStep based on actual DB connections to prevent
    // auto-advancing past steps whose connections have been removed.
    // Step 2 = connect platform, Step 3 = connect email, Steps 4-6 = optional/skippable
    let adjustedStep = onboarding.currentStep;
    const hasPlatformConnected = connectedPlatforms.length > 0;
    if (adjustedStep > 2 && !hasPlatformConnected && !onboarding.completedAt) {
      adjustedStep = 2;
    }

    return NextResponse.json({
      ...onboarding,
      currentStep: adjustedStep,
      connectedPlatforms,
      platformConnected: hasPlatformConnected ? (connectedPlatforms[0] as string) : null,
      googleCalendarConnected,
      outlookCalendarConnected,
      emailConnected,
      connectedEmail,
      emailProvider,
      crmConnected: hubspotConnectedFlag || salesforceConnectedFlag || sheetsConnectedFlag,
      hubspotConnected: hubspotConnectedFlag,
      salesforceConnected: salesforceConnectedFlag,
      sheetsConnected: sheetsConnectedFlag,
    });
  } catch (error) {
    console.error('[ONBOARDING] Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

const onboardingProgressSchema = z.object({
  currentStep: z.number().int().min(1).max(10).optional(),
  platformConnected: z.string().max(50).nullish(),
  calendarConnected: z.boolean().optional(),
  draftGenerated: z.boolean().optional(),
  emailPreference: z.string().max(50).optional(),
  emailConnected: z.boolean().optional(),
  crmConnected: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting - auth endpoint (30/min per IP)
  const postClientId = getClientIdentifier(request);
  const postRateLimitResult = rateLimit(`onboarding-progress-post:${postClientId}`, RATE_LIMITS.AUTH);

  if (!postRateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(postRateLimitResult) }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, onboardingProgressSchema);
    if ('error' in parsed) return parsed.error;
    const { currentStep, platformConnected, calendarConnected, draftGenerated, emailPreference, emailConnected: emailConnectedVal, crmConnected: crmConnectedVal } = parsed.data;

    // Build update object with only defined values
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (currentStep !== undefined) updates.currentStep = currentStep;
    if (platformConnected !== undefined) updates.platformConnected = platformConnected;
    if (calendarConnected !== undefined) updates.calendarConnected = calendarConnected;
    if (draftGenerated !== undefined) updates.draftGenerated = draftGenerated;
    if (emailPreference !== undefined) updates.emailPreference = emailPreference;
    if (emailConnectedVal !== undefined) updates.emailConnected = emailConnectedVal;
    if (crmConnectedVal !== undefined) updates.crmConnected = crmConnectedVal;

    // Check if record exists
    const [existing] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.clerkId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userOnboarding)
        .set(updates)
        .where(eq(userOnboarding.clerkId, userId));
    } else {
      await db.insert(userOnboarding).values({
        clerkId: userId,
        currentStep: (currentStep ?? 1) as OnboardingStep,
        platformConnected: (platformConnected ?? null) as ConnectedPlatform,
        calendarConnected: calendarConnected ?? false,
        draftGenerated: draftGenerated ?? false,
        emailPreference: (emailPreference ?? 'review') as EmailPreference,
        emailConnected: emailConnectedVal ?? false,
        crmConnected: crmConnectedVal ?? false,
      });
    }

    console.log('[ONBOARDING] Updated progress for user:', userId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING] Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
