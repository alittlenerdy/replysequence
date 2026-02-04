/**
 * GET /api/analytics
 * Returns analytics data for the current user's dashboard
 * Enhanced with time-series data, platform breakdown, and funnel metrics
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, inArray, count, sql } from 'drizzle-orm';
import { db, users, meetings, drafts, zoomConnections, teamsConnections, meetConnections } from '@/lib/db';

// Daily data point for charts
export interface DailyDataPoint {
  date: string;
  count: number;
}

// Platform breakdown
export interface PlatformStat {
  platform: string;
  count: number;
  color: string;
}

// Email funnel metrics
export interface EmailFunnel {
  total: number;
  ready: number;
  sent: number;
  conversionRate: number;
}

// Enhanced analytics response
export interface AnalyticsData {
  // Core stats
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
  // Trends
  dailyMeetings: DailyDataPoint[];
  dailyEmails: DailyDataPoint[];
  // Platform breakdown
  platformBreakdown: PlatformStat[];
  // Funnel
  emailFunnel: EmailFunnel;
}

// Average time to write a follow-up email manually (in minutes)
const MINUTES_PER_EMAIL = 15;

// Platform colors for charts
const PLATFORM_COLORS: Record<string, string> = {
  zoom: '#3B82F6',   // Blue
  teams: '#A855F7',  // Purple
  meet: '#10B981',   // Green
};

// Generate array of last N days for chart data
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

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

    // Default empty response
    const emptyResponse: AnalyticsData = {
      totalMeetings: 0,
      emailsGenerated: 0,
      emailsSent: 0,
      timeSavedMinutes: 0,
      dailyMeetings: generateDateRange(14).map(date => ({ date, count: 0 })),
      dailyEmails: generateDateRange(14).map(date => ({ date, count: 0 })),
      platformBreakdown: [],
      emailFunnel: { total: 0, ready: 0, sent: 0, conversionRate: 0 },
    };

    if (!user) {
      return NextResponse.json<AnalyticsData>(emptyResponse);
    }

    // Collect all emails associated with this user
    const userEmails: string[] = [user.email];

    // Get connected platform emails
    const [zoomConn] = await db
      .select({ zoomEmail: zoomConnections.zoomEmail })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id))
      .limit(1);
    if (zoomConn?.zoomEmail) userEmails.push(zoomConn.zoomEmail);

    const [teamsConn] = await db
      .select({ msEmail: teamsConnections.msEmail })
      .from(teamsConnections)
      .where(eq(teamsConnections.userId, user.id))
      .limit(1);
    if (teamsConn?.msEmail) userEmails.push(teamsConn.msEmail);

    const [meetConn] = await db
      .select({ googleEmail: meetConnections.googleEmail })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id))
      .limit(1);
    if (meetConn?.googleEmail) userEmails.push(meetConn.googleEmail);

    const uniqueEmails = [...new Set(userEmails.map(e => e.toLowerCase()))];

    // Get all user meetings with platform info
    const userMeetings = await db
      .select({
        id: meetings.id,
        platform: meetings.platform,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(sql`LOWER(${meetings.hostEmail}) IN (${sql.join(uniqueEmails.map(e => sql`${e}`), sql`, `)})`);

    const meetingIds = userMeetings.map(m => m.id);
    const totalMeetings = userMeetings.length;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    userMeetings.forEach(m => {
      const p = m.platform || 'zoom';
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    const platformBreakdown: PlatformStat[] = Object.entries(platformCounts).map(([platform, count]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      count,
      color: PLATFORM_COLORS[platform] || '#6B7280',
    }));

    // Daily meetings (last 14 days)
    const dateRange = generateDateRange(14);
    const dailyMeetingCounts: Record<string, number> = {};
    dateRange.forEach(d => { dailyMeetingCounts[d] = 0; });
    userMeetings.forEach(m => {
      if (m.createdAt) {
        const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
        if (dailyMeetingCounts[dateStr] !== undefined) {
          dailyMeetingCounts[dateStr]++;
        }
      }
    });
    const dailyMeetings: DailyDataPoint[] = dateRange.map(date => ({
      date,
      count: dailyMeetingCounts[date] || 0,
    }));

    // Get drafts data
    let emailsGenerated = 0;
    let emailsSent = 0;
    let emailsReady = 0;
    const dailyEmailCounts: Record<string, number> = {};
    dateRange.forEach(d => { dailyEmailCounts[d] = 0; });

    if (meetingIds.length > 0) {
      // Get all drafts for user's meetings
      const userDrafts = await db
        .select({
          status: drafts.status,
          createdAt: drafts.createdAt,
        })
        .from(drafts)
        .where(inArray(drafts.meetingId, meetingIds));

      emailsGenerated = userDrafts.length;
      emailsSent = userDrafts.filter(d => d.status === 'sent').length;
      emailsReady = userDrafts.filter(d => d.status === 'generated').length;

      // Daily email counts
      userDrafts.forEach(d => {
        if (d.createdAt) {
          const dateStr = new Date(d.createdAt).toISOString().split('T')[0];
          if (dailyEmailCounts[dateStr] !== undefined) {
            dailyEmailCounts[dateStr]++;
          }
        }
      });
    }

    const dailyEmails: DailyDataPoint[] = dateRange.map(date => ({
      date,
      count: dailyEmailCounts[date] || 0,
    }));

    // Email funnel
    const emailFunnel: EmailFunnel = {
      total: emailsGenerated,
      ready: emailsReady,
      sent: emailsSent,
      conversionRate: emailsGenerated > 0 ? (emailsSent / emailsGenerated) * 100 : 0,
    };

    // Time saved
    const timeSavedMinutes = emailsGenerated * MINUTES_PER_EMAIL;

    return NextResponse.json<AnalyticsData>({
      totalMeetings,
      emailsGenerated,
      emailsSent,
      timeSavedMinutes,
      dailyMeetings,
      dailyEmails,
      platformBreakdown,
      emailFunnel,
    });
  } catch (error) {
    console.error('[ANALYTICS] Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
