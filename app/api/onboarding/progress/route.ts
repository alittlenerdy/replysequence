import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, users, zoomConnections, teamsConnections, calendarConnections, outlookCalendarConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function GET() {
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
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const connectedPlatforms: string[] = [];
    let googleCalendarConnected = false;
    let outlookCalendarConnected = false;

    if (user) {
      // Check each platform connection
      const [zoomConn] = await db.select({ id: zoomConnections.id }).from(zoomConnections).where(eq(zoomConnections.userId, user.id)).limit(1);
      const [teamsConn] = await db.select({ id: teamsConnections.id }).from(teamsConnections).where(eq(teamsConnections.userId, user.id)).limit(1);
      // Google Meet uses the same connection as Google Calendar (calendarConnections), check user flag
      const [userRecord] = await db.select({ meetConnected: users.meetConnected }).from(users).where(eq(users.id, user.id)).limit(1);

      if (zoomConn) connectedPlatforms.push('zoom');
      if (teamsConn) connectedPlatforms.push('teams');
      if (userRecord?.meetConnected) connectedPlatforms.push('meet');

      // Check calendar connections
      const [googleCal] = await db.select({ id: calendarConnections.id }).from(calendarConnections).where(eq(calendarConnections.userId, user.id)).limit(1);
      const [outlookCal] = await db.select({ id: outlookCalendarConnections.id }).from(outlookCalendarConnections).where(eq(outlookCalendarConnections.userId, user.id)).limit(1);

      googleCalendarConnected = !!googleCal;
      outlookCalendarConnected = !!outlookCal;
    }

    return NextResponse.json({
      ...onboarding,
      connectedPlatforms,
      googleCalendarConnected,
      outlookCalendarConnected,
    });
  } catch (error) {
    console.error('[ONBOARDING] Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentStep, platformConnected, calendarConnected, draftGenerated, emailPreference } = body;

    // Build update object with only defined values
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (currentStep !== undefined) updates.currentStep = currentStep;
    if (platformConnected !== undefined) updates.platformConnected = platformConnected;
    if (calendarConnected !== undefined) updates.calendarConnected = calendarConnected;
    if (draftGenerated !== undefined) updates.draftGenerated = draftGenerated;
    if (emailPreference !== undefined) updates.emailPreference = emailPreference;

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
        currentStep: currentStep || 1,
        platformConnected: platformConnected || null,
        calendarConnected: calendarConnected || false,
        draftGenerated: draftGenerated || false,
        emailPreference: emailPreference || 'review',
      });
    }

    console.log('[ONBOARDING] Updated progress for user:', userId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING] Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
