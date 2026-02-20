import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userOnboarding, users, zoomConnections, teamsConnections, calendarConnections, outlookCalendarConnections, emailConnections, hubspotConnections, airtableConnections, sheetsConnections } from '@/lib/db/schema';
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

    // Check email connections
    let emailConnected = false;
    let connectedEmail: string | null = null;
    if (user) {
      const [emailConn] = await db.select({ id: emailConnections.id, email: emailConnections.email })
        .from(emailConnections)
        .where(eq(emailConnections.userId, user.id))
        .limit(1);
      emailConnected = !!emailConn;
      connectedEmail = emailConn?.email || null;
    }

    // Check CRM connections
    let crmConnected = false;
    if (user) {
      const [hubspotConn] = await db.select({ id: hubspotConnections.id })
        .from(hubspotConnections)
        .where(eq(hubspotConnections.userId, user.id))
        .limit(1);
      const [airtableConn] = await db.select({ id: airtableConnections.id })
        .from(airtableConnections)
        .where(eq(airtableConnections.userId, user.id))
        .limit(1);
      const [sheetsConn] = await db.select({ id: sheetsConnections.id })
        .from(sheetsConnections)
        .where(eq(sheetsConnections.userId, user.id))
        .limit(1);
      crmConnected = !!hubspotConn || !!airtableConn || !!sheetsConn;
    }

    return NextResponse.json({
      ...onboarding,
      connectedPlatforms,
      googleCalendarConnected,
      outlookCalendarConnected,
      emailConnected,
      connectedEmail,
      crmConnected,
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
    const { currentStep, platformConnected, calendarConnected, draftGenerated, emailPreference, emailConnected: emailConnectedVal, crmConnected: crmConnectedVal } = body;

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
        currentStep: currentStep || 1,
        platformConnected: platformConnected || null,
        calendarConnected: calendarConnected || false,
        draftGenerated: draftGenerated || false,
        emailPreference: emailPreference || 'review',
        emailConnected: emailConnectedVal || false,
        crmConnected: crmConnectedVal || false,
      });
    }

    console.log('[ONBOARDING] Updated progress for user:', userId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ONBOARDING] Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
