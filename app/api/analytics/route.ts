/**
 * GET /api/analytics
 * Returns analytics data for the current user's dashboard
 * Enhanced with time-series data, platform breakdown, and funnel metrics
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db, users, meetings, drafts } from '@/lib/db';
import type {
  AnalyticsData,
  DailyDataPoint,
  PlatformStat,
  EmailFunnelData,
  EmailEngagementData,
  MeetingTypeStat,
  PeriodComparison,
  AtRiskMeeting,
  DailyCoverage,
} from '@/lib/types/analytics';

// Allow longer timeout for cold starts
export const maxDuration = 60;

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

// Meeting type colors
const MEETING_TYPE_COLORS: Record<string, string> = {
  sales_call: '#F59E0B',        // Amber
  internal_sync: '#3B82F6',     // Blue
  client_review: '#A855F7',     // Purple
  technical_discussion: '#10B981', // Green
  general: '#6B7280',           // Gray
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

export async function GET(request: Request) {
  console.log('[ANALYTICS-1] Starting analytics request');

  // Parse date range from query params (default 14 days)
  const { searchParams } = new URL(request.url);
  const daysParam = parseInt(searchParams.get('days') || '14', 10);
  const chartDays = Math.min(Math.max(daysParam, 7), 90); // Clamp between 7-90

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
    dailyMeetings: generateDateRange(chartDays).map(date => ({ date, count: 0 })),
    dailyEmails: generateDateRange(chartDays).map(date => ({ date, count: 0 })),
    platformBreakdown: [],
    emailFunnel: { total: 0, ready: 0, sent: 0, conversionRate: 0 },
    engagement: { sent: 0, opened: 0, clicked: 0, replied: 0, openRate: 0, clickRate: 0, replyRate: 0, avgTimeToOpen: null },
    meetingTypeBreakdown: [],
    aiUsage: { totalCost: 0, avgLatency: 0, totalMeetingMinutes: 0 },
    medianFollowUpTimeHours: null,
    atRiskMeetings: [],
    dailyCoverage: [],
    aiOnboardingComplete: false,
    hourlyRate: DEFAULT_HOURLY_RATE,
  };

  try {
    // Find user by Clerk ID
    console.log('[ANALYTICS-2] Finding user by clerkId:', clerkUserId);
    const [user] = await db
      .select({ id: users.id, email: users.email, hourlyRate: users.hourlyRate, aiOnboardingComplete: users.aiOnboardingComplete })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      console.log('[ANALYTICS-3] No user found, returning empty response');
      return NextResponse.json<AnalyticsData>(emptyResponse);
    }
    console.log('[ANALYTICS-4] User found:', user.id);

    // Get all user meetings filtered by userId (consistent with dashboard)
    console.log('[ANALYTICS-5] Querying meetings for userId:', user.id);

    let userMeetings: { id: string; platform: string | null; createdAt: Date | null; duration: number | null; topic: string | null; hostEmail: string; endTime: Date | null; participants: unknown }[] = [];

    try {
      userMeetings = await db
        .select({
          id: meetings.id,
          platform: meetings.platform,
          createdAt: meetings.createdAt,
          duration: meetings.duration,
          topic: meetings.topic,
          hostEmail: meetings.hostEmail,
          endTime: meetings.endTime,
          participants: meetings.participants,
        })
        .from(meetings)
        .where(eq(meetings.userId, user.id));

      console.log('[ANALYTICS-6] Meetings found:', userMeetings.length);
    } catch (e) {
      console.log('[ANALYTICS-WARN] Error fetching meetings:', e);
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

    // Total meeting minutes
    const totalMeetingMinutes = userMeetings.reduce((sum, m) => sum + (m.duration || 0), 0);

    // Daily meetings (last 14 days)
    const dateRange = generateDateRange(chartDays);
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

    // Email engagement tracking
    let emailsOpened = 0;
    let emailsClicked = 0;
    let emailsReplied = 0;
    let totalTimeToOpen = 0;
    let openedWithTime = 0;

    // AI usage tracking
    let totalCostUsd = 0;
    let totalLatencyMs = 0;
    let latencyCount = 0;
    const meetingTypeCounts: Record<string, number> = {};
    const dailySentCounts: Record<string, number> = {};
    dateRange.forEach(d => { dailySentCounts[d] = 0; });

    if (meetingIds.length > 0) {
      try {
        // Get all drafts for user's meetings with engagement data
        const userDrafts = await db
          .select({
            id: drafts.id,
            meetingId: drafts.meetingId,
            status: drafts.status,
            createdAt: drafts.createdAt,
            sentAt: drafts.sentAt,
            openedAt: drafts.openedAt,
            clickedAt: drafts.clickedAt,
            repliedAt: drafts.repliedAt,
            meetingType: drafts.meetingType,
            costUsd: drafts.costUsd,
            generationDurationMs: drafts.generationDurationMs,
          })
          .from(drafts)
          .where(inArray(drafts.meetingId, meetingIds));

        console.log('[ANALYTICS-7] Drafts found:', userDrafts.length);

        emailsGenerated = userDrafts.length;
        emailsSent = userDrafts.filter(d => d.status === 'sent').length;
        emailsReady = userDrafts.filter(d => d.status === 'generated').length;

        // Count engagement metrics
        userDrafts.forEach(d => {
          if (d.openedAt) {
            emailsOpened++;
            // Calculate time to open in hours
            if (d.sentAt) {
              const timeToOpen = (new Date(d.openedAt).getTime() - new Date(d.sentAt).getTime()) / (1000 * 60 * 60);
              totalTimeToOpen += timeToOpen;
              openedWithTime++;
            }
          }
          if (d.clickedAt) emailsClicked++;
          if (d.repliedAt) emailsReplied++;
        });

        userDrafts.forEach(d => {
          if (d.createdAt) {
            const dateStr = new Date(d.createdAt).toISOString().split('T')[0];
            if (dailyEmailCounts[dateStr] !== undefined) {
              dailyEmailCounts[dateStr]++;
            }
          }
          // Track actual sent dates for accurate comparison
          if (d.sentAt) {
            const sentDate = new Date(d.sentAt).toISOString().split('T')[0];
            if (dailySentCounts[sentDate] !== undefined) {
              dailySentCounts[sentDate]++;
            }
          }
          // Meeting type breakdown
          const mt = d.meetingType || 'general';
          meetingTypeCounts[mt] = (meetingTypeCounts[mt] || 0) + 1;
          // AI cost aggregation
          if (d.costUsd) {
            totalCostUsd += parseFloat(d.costUsd);
          }
          // Latency aggregation
          if (d.generationDurationMs) {
            totalLatencyMs += d.generationDurationMs;
            latencyCount++;
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
    const emailFunnel: EmailFunnelData = {
      total: emailsGenerated,
      ready: emailsReady,
      sent: emailsSent,
      conversionRate: emailsGenerated > 0 ? (emailsSent / emailsGenerated) * 100 : 0,
    };

    // Email engagement metrics
    const engagement: EmailEngagementData = {
      sent: emailsSent,
      opened: emailsOpened,
      clicked: emailsClicked,
      replied: emailsReplied,
      openRate: emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0,
      clickRate: emailsOpened > 0 ? Math.round((emailsClicked / emailsOpened) * 100) : 0,
      replyRate: emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0,
      avgTimeToOpen: openedWithTime > 0 ? Math.round((totalTimeToOpen / openedWithTime) * 10) / 10 : null,
    };

    // Time saved
    const timeSavedMinutes = emailsGenerated * MINUTES_PER_EMAIL;

    // Calculate period comparisons (this week vs last week from daily data)
    const thisWeekMeetings = dailyMeetings.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeekMeetings = dailyMeetings.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
    const thisWeekEmails = dailyEmails.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const lastWeekEmails = dailyEmails.slice(0, 7).reduce((sum, d) => sum + d.count, 0);

    // Use actual sent dates for accurate comparison
    const dailySentData = dateRange.map(date => dailySentCounts[date] || 0);
    const thisWeekSent = dailySentData.slice(-7).reduce((sum, c) => sum + c, 0);
    const lastWeekSent = dailySentData.slice(0, 7).reduce((sum, c) => sum + c, 0);

    // Meeting type breakdown
    const MEETING_TYPE_LABELS: Record<string, string> = {
      sales_call: 'Sales',
      internal_sync: 'Internal',
      client_review: 'Client',
      technical_discussion: 'Technical',
      general: 'General',
    };
    const meetingTypeBreakdown: MeetingTypeStat[] = Object.entries(meetingTypeCounts).map(([type, count]) => ({
      type: MEETING_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      color: MEETING_TYPE_COLORS[type] || '#6B7280',
    }));

    // ROI calculation
    const userHourlyRate = user.hourlyRate ?? DEFAULT_HOURLY_RATE;
    const hoursSaved = timeSavedMinutes / 60;
    const dollarValue = hoursSaved * userHourlyRate;

    console.log('[ANALYTICS-8] Returning analytics data');

    // --- New metrics: median follow-up time, at-risk meetings, daily coverage ---

    // Build a map of meetingId → best draft for at-risk + median computation
    const draftsByMeeting = new Map<string, { id: string; status: string | null; sentAt: Date | null }>();
    if (meetingIds.length > 0) {
      try {
        const allDrafts = await db
          .select({ id: drafts.id, meetingId: drafts.meetingId, status: drafts.status, sentAt: drafts.sentAt })
          .from(drafts)
          .where(inArray(drafts.meetingId, meetingIds));

        for (const d of allDrafts) {
          const existing = draftsByMeeting.get(d.meetingId);
          // Keep the "best" draft: prefer sent > generated > failed > none
          if (!existing || (d.status === 'sent' && existing.status !== 'sent')) {
            draftsByMeeting.set(d.meetingId, { id: d.id, status: d.status, sentAt: d.sentAt });
          }
        }
      } catch (e) {
        console.log('[ANALYTICS-WARN] Error building draft map:', e);
      }
    }

    // Median follow-up time: median of (draft.sentAt - meeting.endTime) for sent drafts
    const followUpTimesHours: number[] = [];
    for (const m of userMeetings) {
      if (!m.endTime) continue;
      const draft = draftsByMeeting.get(m.id);
      if (draft?.sentAt) {
        const hours = (new Date(draft.sentAt).getTime() - new Date(m.endTime).getTime()) / (1000 * 60 * 60);
        if (hours >= 0) followUpTimesHours.push(hours);
      }
    }
    let medianFollowUpTimeHours: number | null = null;
    if (followUpTimesHours.length > 0) {
      followUpTimesHours.sort((a, b) => a - b);
      const mid = Math.floor(followUpTimesHours.length / 2);
      medianFollowUpTimeHours = followUpTimesHours.length % 2 === 0
        ? Math.round(((followUpTimesHours[mid - 1] + followUpTimesHours[mid]) / 2) * 10) / 10
        : Math.round(followUpTimesHours[mid] * 10) / 10;
    }

    // At-risk meetings: meetings without a sent draft
    const atRiskMeetings: AtRiskMeeting[] = [];
    for (const m of userMeetings) {
      const draft = draftsByMeeting.get(m.id);
      if (draft?.status === 'sent') continue; // followed up — not at risk

      // Extract contact name from first participant that isn't the host
      let contactName: string | null = null;
      if (Array.isArray(m.participants)) {
        const contact = (m.participants as { user_name?: string; email?: string }[]).find(
          p => p.email && p.email !== m.hostEmail
        );
        contactName = contact?.user_name || null;
      }

      atRiskMeetings.push({
        meetingId: m.id,
        topic: m.topic,
        hostEmail: m.hostEmail,
        endTime: m.endTime ? new Date(m.endTime).toISOString() : null,
        draftStatus: !draft ? 'none' : draft.status === 'failed' ? 'failed' : 'generated',
        draftId: draft?.id || null,
        contactName,
      });
    }
    // Sort by endTime descending (most recent first)
    atRiskMeetings.sort((a, b) => {
      if (!a.endTime) return 1;
      if (!b.endTime) return -1;
      return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
    });

    // Daily coverage: per-day meetings count, followed-up count, coverage %
    const dailyCoverageMap: Record<string, { meetings: number; followedUp: number }> = {};
    dateRange.forEach(d => { dailyCoverageMap[d] = { meetings: 0, followedUp: 0 }; });
    for (const m of userMeetings) {
      if (!m.createdAt) continue;
      const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
      if (dailyCoverageMap[dateStr] === undefined) continue;
      dailyCoverageMap[dateStr].meetings++;
      const draft = draftsByMeeting.get(m.id);
      if (draft?.status === 'sent') {
        dailyCoverageMap[dateStr].followedUp++;
      }
    }
    const dailyCoverage: DailyCoverage[] = dateRange.map(date => {
      const d = dailyCoverageMap[date];
      return {
        date,
        meetingsCount: d.meetings,
        followedUpCount: d.followedUp,
        coveragePercent: d.meetings > 0 ? Math.round((d.followedUp / d.meetings) * 100) : 100,
      };
    });

    return NextResponse.json<AnalyticsData>({
      totalMeetings,
      emailsGenerated,
      emailsSent,
      timeSavedMinutes,
      meetingsComparison: calculateComparison(thisWeekMeetings, lastWeekMeetings),
      emailsComparison: calculateComparison(thisWeekEmails, lastWeekEmails),
      sentComparison: calculateComparison(thisWeekSent, lastWeekSent),
      roi: {
        hoursSaved: Math.round(hoursSaved * 10) / 10,
        dollarValue: Math.round(dollarValue),
        hourlyRate: userHourlyRate,
        emailsPerHour: 4,
      },
      dailyMeetings,
      dailyEmails,
      platformBreakdown,
      emailFunnel,
      engagement,
      meetingTypeBreakdown,
      aiUsage: {
        totalCost: Math.round(totalCostUsd * 10000) / 10000,
        avgLatency: latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : 0,
        totalMeetingMinutes,
      },
      medianFollowUpTimeHours,
      atRiskMeetings,
      dailyCoverage,
      aiOnboardingComplete: user.aiOnboardingComplete,
      hourlyRate: userHourlyRate,
    });
  } catch (error) {
    console.error('[ANALYTICS-ERROR] Unexpected error:', error);
    // Return empty data instead of error to prevent dashboard from breaking
    return NextResponse.json<AnalyticsData>(emptyResponse);
  }
}
