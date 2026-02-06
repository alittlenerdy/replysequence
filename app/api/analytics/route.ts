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

// Period comparison for trends
export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
}

// ROI metrics
export interface ROIMetrics {
  hoursSaved: number;
  dollarValue: number;
  hourlyRate: number; // configurable, default $100/hr
  emailsPerHour: number; // how many manual emails per hour (default 4)
}

// Enhanced analytics response
export interface AnalyticsData {
  // Core stats with comparisons
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
  // Period comparisons (this week vs last week)
  meetingsComparison: PeriodComparison;
  emailsComparison: PeriodComparison;
  sentComparison: PeriodComparison;
  // ROI metrics
  roi: ROIMetrics;
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

// Hourly rate for ROI calculation (default, can be user-configurable later)
const DEFAULT_HOURLY_RATE = 100;

// Helper to calculate period comparison
function calculateComparison(current: number, previous: number): PeriodComparison {
  if (previous === 0 && current === 0) {
    return { current, previous, change: 0, trend: 'neutral' };
  }
  if (previous === 0) {
    return { current, previous, change: 100, trend: 'up' };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';
  return { current, previous, change: Math.abs(change), trend };
}

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
  console.log('[ANALYTICS-1] Starting analytics request');

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    console.log('[ANALYTICS-ERROR] Not authenticated');
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Default empty response
  const emptyComparison: PeriodComparison = { current: 0, previous: 0, change: 0, trend: 'neutral' };
  const emptyResponse: AnalyticsData = {
    totalMeetings: 0,
    emailsGenerated: 0,
    emailsSent: 0,
    timeSavedMinutes: 0,
    meetingsComparison: emptyComparison,
    emailsComparison: emptyComparison,
    sentComparison: emptyComparison,
    roi: { hoursSaved: 0, dollarValue: 0, hourlyRate: DEFAULT_HOURLY_RATE, emailsPerHour: 4 },
    dailyMeetings: generateDateRange(14).map(date => ({ date, count: 0 })),
    dailyEmails: generateDateRange(14).map(date => ({ date, count: 0 })),
    platformBreakdown: [],
    emailFunnel: { total: 0, ready: 0, sent: 0, conversionRate: 0 },
  };

  try {
    // Find user by Clerk ID
    console.log('[ANALYTICS-2] Finding user by clerkId:', clerkUserId);
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      console.log('[ANALYTICS-3] No user found, returning empty response');
      return NextResponse.json<AnalyticsData>(emptyResponse);
    }
    console.log('[ANALYTICS-4] User found:', user.id);

    // Collect all emails associated with this user
    const userEmails: string[] = [user.email];

    // Get connected platform emails (with individual error handling)
    // Zoom connection
    try {
      const [zoomConn] = await db
        .select({ zoomEmail: zoomConnections.zoomEmail })
        .from(zoomConnections)
        .where(eq(zoomConnections.userId, user.id))
        .limit(1);
      if (zoomConn?.zoomEmail) {
        userEmails.push(zoomConn.zoomEmail);
        console.log('[ANALYTICS-ZOOM] Found Zoom email:', zoomConn.zoomEmail);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log('[ANALYTICS-WARN] Zoom connection error (non-fatal):', errorMessage);
    }

    // Teams connection
    try {
      const [teamsConn] = await db
        .select({ msEmail: teamsConnections.msEmail })
        .from(teamsConnections)
        .where(eq(teamsConnections.userId, user.id))
        .limit(1);
      if (teamsConn?.msEmail) {
        userEmails.push(teamsConn.msEmail);
        console.log('[ANALYTICS-TEAMS] Found Teams email:', teamsConn.msEmail);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log('[ANALYTICS-WARN] Teams connection error (non-fatal):', errorMessage);
    }

    // Meet connection - table may not exist yet, completely optional
    try {
      const [meetConn] = await db
        .select({ googleEmail: meetConnections.googleEmail })
        .from(meetConnections)
        .where(eq(meetConnections.userId, user.id))
        .limit(1);
      if (meetConn?.googleEmail) {
        userEmails.push(meetConn.googleEmail);
        console.log('[ANALYTICS-MEET] Found Meet email:', meetConn.googleEmail);
      }
    } catch (e: unknown) {
      // This is expected if meet_connections table doesn't exist yet
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes('does not exist')) {
        console.log('[ANALYTICS-MEET] Table not yet created (this is OK)');
      } else {
        console.log('[ANALYTICS-WARN] Meet connection error (non-fatal):', errorMessage);
      }
    }

    const uniqueEmails = [...new Set(userEmails.map(e => e.toLowerCase()))];
    console.log('[ANALYTICS-5] User emails:', uniqueEmails);

    // Get all user meetings with platform info
    // Use a safer query approach
    let userMeetings: { id: string; platform: string | null; createdAt: Date | null }[] = [];

    try {
      // Build WHERE clause for multiple emails
      const emailConditions = uniqueEmails.map(email =>
        sql`LOWER(${meetings.hostEmail}) = ${email}`
      );

      userMeetings = await db
        .select({
          id: meetings.id,
          platform: meetings.platform,
          createdAt: meetings.createdAt,
        })
        .from(meetings)
        .where(sql`(${sql.join(emailConditions, sql` OR `)})`);

      console.log('[ANALYTICS-6] Meetings found:', userMeetings.length);
    } catch (e) {
      console.log('[ANALYTICS-WARN] Error fetching meetings:', e);
      // Return empty response if meetings query fails
      return NextResponse.json<AnalyticsData>(emptyResponse);
    }

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
      try {
        // Get all drafts for user's meetings
        const userDrafts = await db
          .select({
            status: drafts.status,
            createdAt: drafts.createdAt,
          })
          .from(drafts)
          .where(inArray(drafts.meetingId, meetingIds));

        console.log('[ANALYTICS-7] Drafts found:', userDrafts.length);

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
      } catch (e) {
        console.log('[ANALYTICS-WARN] Error fetching drafts:', e);
      }
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

    // Calculate period comparisons (this week vs last week from daily data)
    const thisWeekMeetings = dailyMeetings.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeekMeetings = dailyMeetings.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
    const thisWeekEmails = dailyEmails.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeekEmails = dailyEmails.slice(0, 7).reduce((sum, d) => sum + d.count, 0);

    // For sent emails, we need to track by week - approximate from total ratio
    const sentRatio = emailsGenerated > 0 ? emailsSent / emailsGenerated : 0;
    const thisWeekSent = Math.round(thisWeekEmails * sentRatio);
    const lastWeekSent = Math.round(lastWeekEmails * sentRatio);

    // ROI calculation
    const hoursSaved = timeSavedMinutes / 60;
    const dollarValue = hoursSaved * DEFAULT_HOURLY_RATE;

    console.log('[ANALYTICS-8] Returning analytics data');

    return NextResponse.json<AnalyticsData>({
      totalMeetings,
      emailsGenerated,
      emailsSent,
      timeSavedMinutes,
      meetingsComparison: calculateComparison(thisWeekMeetings, lastWeekMeetings),
      emailsComparison: calculateComparison(thisWeekEmails, lastWeekEmails),
      sentComparison: calculateComparison(thisWeekSent, lastWeekSent),
      roi: {
        hoursSaved: Math.round(hoursSaved * 10) / 10, // 1 decimal place
        dollarValue: Math.round(dollarValue),
        hourlyRate: DEFAULT_HOURLY_RATE,
        emailsPerHour: 4,
      },
      dailyMeetings,
      dailyEmails,
      platformBreakdown,
      emailFunnel,
    });
  } catch (error) {
    console.error('[ANALYTICS-ERROR] Unexpected error:', error);
    // Return empty data instead of error to prevent dashboard from breaking
    return NextResponse.json<AnalyticsData>(emptyResponse);
  }
}
