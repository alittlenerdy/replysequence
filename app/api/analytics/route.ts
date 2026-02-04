/**
 * GET /api/analytics
 * Returns analytics data for the current user's dashboard
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, inArray, count, sql } from 'drizzle-orm';
import { db, users, meetings, drafts, zoomConnections, teamsConnections, meetConnections } from '@/lib/db';

export interface AnalyticsData {
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
}

// Average time to write a follow-up email manually (in minutes)
const MINUTES_PER_EMAIL = 15;

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Find user by Clerk ID
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      // Return zeros for new users
      return NextResponse.json<AnalyticsData>({
        totalMeetings: 0,
        emailsGenerated: 0,
        emailsSent: 0,
        timeSavedMinutes: 0,
      });
    }

    // Collect all emails associated with this user (user email + connected platform emails)
    const userEmails: string[] = [user.email];

    // Get Zoom email if connected
    const [zoomConn] = await db
      .select({ zoomEmail: zoomConnections.zoomEmail })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id))
      .limit(1);
    if (zoomConn?.zoomEmail) userEmails.push(zoomConn.zoomEmail);

    // Get Teams email if connected
    const [teamsConn] = await db
      .select({ msEmail: teamsConnections.msEmail })
      .from(teamsConnections)
      .where(eq(teamsConnections.userId, user.id))
      .limit(1);
    if (teamsConn?.msEmail) userEmails.push(teamsConn.msEmail);

    // Get Meet email if connected
    const [meetConn] = await db
      .select({ googleEmail: meetConnections.googleEmail })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id))
      .limit(1);
    if (meetConn?.googleEmail) userEmails.push(meetConn.googleEmail);

    // Deduplicate emails
    const uniqueEmails = [...new Set(userEmails.map(e => e.toLowerCase()))];

    // Count meetings where hostEmail matches any of user's emails
    const [meetingsCount] = await db
      .select({ count: count() })
      .from(meetings)
      .where(sql`LOWER(${meetings.hostEmail}) IN (${sql.join(uniqueEmails.map(e => sql`${e}`), sql`, `)})`);

    // Get meeting IDs for this user
    const userMeetings = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(sql`LOWER(${meetings.hostEmail}) IN (${sql.join(uniqueEmails.map(e => sql`${e}`), sql`, `)})`);

    const meetingIds = userMeetings.map(m => m.id);

    let emailsGenerated = 0;
    let emailsSent = 0;

    if (meetingIds.length > 0) {
      // Count generated drafts for user's meetings
      const [draftsCount] = await db
        .select({ count: count() })
        .from(drafts)
        .where(inArray(drafts.meetingId, meetingIds));
      emailsGenerated = draftsCount?.count || 0;

      // Count sent drafts
      const [sentCount] = await db
        .select({ count: count() })
        .from(drafts)
        .where(sql`${drafts.meetingId} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)}) AND ${drafts.status} = 'sent'`);
      emailsSent = sentCount?.count || 0;
    }

    const totalMeetings = meetingsCount?.count || 0;

    // Calculate time saved (15 minutes per email generated)
    const timeSavedMinutes = emailsGenerated * MINUTES_PER_EMAIL;

    return NextResponse.json<AnalyticsData>({
      totalMeetings,
      emailsGenerated,
      emailsSent,
      timeSavedMinutes,
    });
  } catch (error) {
    console.error('[ANALYTICS] Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
