/**
 * Debug endpoint to check user data isolation
 * This helps diagnose issues where analytics shows wrong user's data
 *
 * GET /api/debug/user-data
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, sql, desc } from 'drizzle-orm';
import { db, users, meetings, meetConnections, zoomConnections, teamsConnections, drafts } from '@/lib/db';

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Step 1: Find user by clerkId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    // Step 2: Get platform connections
    const meetConns = user ? await db
      .select()
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id)) : [];

    const zoomConns = user ? await db
      .select()
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id)) : [];

    let teamsConns: { msEmail: string; userId: string }[] = [];
    if (user) {
      try {
        teamsConns = await db
          .select({ msEmail: teamsConnections.msEmail, userId: teamsConnections.userId })
          .from(teamsConnections)
          .where(eq(teamsConnections.userId, user.id));
      } catch {
        // Table may not exist
      }
    }

    // Step 3: Calculate analytics emails (same logic as analytics route)
    const analyticsEmails: string[] = [];
    if (user) {
      analyticsEmails.push(user.email.toLowerCase());
      for (const conn of meetConns) {
        analyticsEmails.push(conn.googleEmail.toLowerCase());
      }
      for (const conn of zoomConns) {
        analyticsEmails.push(conn.zoomEmail.toLowerCase());
      }
      for (const conn of teamsConns) {
        analyticsEmails.push(conn.msEmail.toLowerCase());
      }
    }
    const uniqueEmails = [...new Set(analyticsEmails)];

    // Step 4: Get meetings that would be included in analytics
    let meetingsForAnalytics: { id: string; hostEmail: string; platform: string | null; topic: string | null; createdAt: Date | null }[] = [];
    if (uniqueEmails.length > 0) {
      const emailConditions = uniqueEmails.map(email =>
        sql`LOWER(${meetings.hostEmail}) = ${email}`
      );
      meetingsForAnalytics = await db
        .select({
          id: meetings.id,
          hostEmail: meetings.hostEmail,
          platform: meetings.platform,
          topic: meetings.topic,
          createdAt: meetings.createdAt,
        })
        .from(meetings)
        .where(sql`(${sql.join(emailConditions, sql` OR `)})`)
        .orderBy(desc(meetings.createdAt))
        .limit(10);
    }

    // Step 5: Get meetings by userId (should be same as above in a correct system)
    let meetingsByUserId: { id: string; hostEmail: string; platform: string | null; topic: string | null }[] = [];
    if (user) {
      meetingsByUserId = await db
        .select({
          id: meetings.id,
          hostEmail: meetings.hostEmail,
          platform: meetings.platform,
          topic: meetings.topic,
        })
        .from(meetings)
        .where(eq(meetings.userId, user.id))
        .orderBy(desc(meetings.createdAt))
        .limit(10);
    }

    // Step 6: Check for any data inconsistencies
    const issues: string[] = [];

    if (!user) {
      issues.push('User not found in database for this clerkId');
    }

    if (user && meetConns.length === 0 && user.meetConnected) {
      issues.push('User has meetConnected=true but no meet_connections record');
    }

    if (user && zoomConns.length === 0 && user.zoomConnected) {
      issues.push('User has zoomConnected=true but no zoom_connections record');
    }

    // Check if any meetings have mismatched userId
    if (meetingsForAnalytics.length > 0 && meetingsByUserId.length === 0 && user) {
      issues.push('Meetings found by email but none by userId - legacy data needs migration');
    }

    // Step 7: Get recent Meet-specific meetings to debug detection
    const recentMeetMeetings = await db
      .select({
        id: meetings.id,
        platformMeetingId: meetings.platformMeetingId,
        hostEmail: meetings.hostEmail,
        topic: meetings.topic,
        status: meetings.status,
        userId: meetings.userId,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(eq(meetings.platform, 'google_meet'))
      .orderBy(desc(meetings.createdAt))
      .limit(5);

    return NextResponse.json({
      clerkUserId,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        zoomConnected: user.zoomConnected,
        meetConnected: user.meetConnected,
        teamsConnected: user.teamsConnected,
        createdAt: user.createdAt,
      } : null,
      connections: {
        meet: meetConns.map(c => ({
          googleEmail: c.googleEmail,
          googleDisplayName: c.googleDisplayName,
          connectedAt: c.connectedAt,
        })),
        zoom: zoomConns.map(c => ({
          zoomEmail: c.zoomEmail,
          connectedAt: c.connectedAt,
        })),
        teams: teamsConns.map(c => ({
          msEmail: c.msEmail,
        })),
      },
      analyticsEmails: uniqueEmails,
      meetingsIncludedInAnalytics: meetingsForAnalytics.length,
      meetingsByUserId: meetingsByUserId.length,
      recentMeetings: meetingsForAnalytics.map(m => ({
        id: m.id,
        hostEmail: m.hostEmail,
        platform: m.platform,
        topic: m.topic,
        createdAt: m.createdAt,
      })),
      recentGoogleMeetMeetings: recentMeetMeetings,
      issues,
    });
  } catch (error) {
    console.error('[DEBUG-USER-DATA] Error:', error);
    return NextResponse.json({
      error: 'Debug query failed',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
