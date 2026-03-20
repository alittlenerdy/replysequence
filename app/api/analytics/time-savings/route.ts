/**
 * GET /api/analytics/time-savings
 *
 * Returns time savings analytics for the authenticated user.
 * Calculates hours saved, dollar value, and action counts
 * across weekly (7 days), monthly (30 days), and all-time periods.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, and, sql, gte, inArray } from 'drizzle-orm';
import {
  db,
  users,
  meetings,
  drafts,
  emailSequences,
  agentActions,
} from '@/lib/db';

export const maxDuration = 60;

// Time savings estimates per action type (minutes)
const MINUTES_PER_MEETING = 25; // Writing follow-up manually
const MINUTES_PER_SEQUENCE = 15; // Manual follow-up planning
const MINUTES_PER_CRM_UPDATE = 5; // Manual data entry
const DEFAULT_HOURLY_RATE = 150;

export interface TimeSavingsResponse {
  weekly: PeriodMetrics;
  monthly: PeriodMetrics;
  allTime: PeriodMetrics;
  hourlyRate: number;
}

export interface PeriodMetrics {
  hoursSaved: number;
  dollarValue: number;
  totalActions: number;
  breakdown: ActionBreakdown;
}

export interface ActionBreakdown {
  meetingsProcessed: number;
  draftsGenerated: number;
  emailsSent: number;
  sequencesCreated: number;
  crmUpdates: number;
}

function calculatePeriodMetrics(
  breakdown: ActionBreakdown,
  hourlyRate: number,
): PeriodMetrics {
  const minutesSaved =
    breakdown.meetingsProcessed * MINUTES_PER_MEETING +
    breakdown.sequencesCreated * MINUTES_PER_SEQUENCE +
    breakdown.crmUpdates * MINUTES_PER_CRM_UPDATE;

  const hoursSaved = Math.round((minutesSaved / 60) * 10) / 10;
  const dollarValue = Math.round(hoursSaved * hourlyRate);
  const totalActions =
    breakdown.meetingsProcessed +
    breakdown.draftsGenerated +
    breakdown.emailsSent +
    breakdown.sequencesCreated +
    breakdown.crmUpdates;

  return { hoursSaved, dollarValue, totalActions, breakdown };
}

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const emptyBreakdown: ActionBreakdown = {
    meetingsProcessed: 0,
    draftsGenerated: 0,
    emailsSent: 0,
    sequencesCreated: 0,
    crmUpdates: 0,
  };

  const emptyResponse: TimeSavingsResponse = {
    weekly: calculatePeriodMetrics(emptyBreakdown, DEFAULT_HOURLY_RATE),
    monthly: calculatePeriodMetrics(emptyBreakdown, DEFAULT_HOURLY_RATE),
    allTime: calculatePeriodMetrics(emptyBreakdown, DEFAULT_HOURLY_RATE),
    hourlyRate: DEFAULT_HOURLY_RATE,
  };

  try {
    // Find user
    const [user] = await db
      .select({ id: users.id, hourlyRate: users.hourlyRate })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json(emptyResponse);
    }

    const hourlyRate = user.hourlyRate ?? DEFAULT_HOURLY_RATE;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for each period
    const [
      allMeetings,
      weeklyMeetings,
      monthlyMeetings,
      allSequences,
      weeklySequences,
      monthlySequences,
      allCrmUpdates,
      weeklyCrmUpdates,
      monthlyCrmUpdates,
    ] = await Promise.all([
      // All-time meetings (ready or completed)
      db
        .select({ count: sql<number>`count(*)` })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, user.id),
            inArray(meetings.status, ['ready', 'completed']),
          ),
        ),
      // Weekly meetings
      db
        .select({ count: sql<number>`count(*)` })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, user.id),
            inArray(meetings.status, ['ready', 'completed']),
            gte(meetings.createdAt, sevenDaysAgo),
          ),
        ),
      // Monthly meetings
      db
        .select({ count: sql<number>`count(*)` })
        .from(meetings)
        .where(
          and(
            eq(meetings.userId, user.id),
            inArray(meetings.status, ['ready', 'completed']),
            gte(meetings.createdAt, thirtyDaysAgo),
          ),
        ),
      // All-time sequences
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailSequences)
        .where(eq(emailSequences.userId, user.id)),
      // Weekly sequences
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.userId, user.id),
            gte(emailSequences.createdAt, sevenDaysAgo),
          ),
        ),
      // Monthly sequences
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.userId, user.id),
            gte(emailSequences.createdAt, thirtyDaysAgo),
          ),
        ),
      // All-time CRM updates (agentActions userId is varchar, not uuid)
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentActions)
        .where(
          and(
            eq(agentActions.userId, user.id),
            eq(agentActions.agentName, 'crm-auto-populate'),
            eq(agentActions.status, 'success'),
          ),
        ),
      // Weekly CRM updates
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentActions)
        .where(
          and(
            eq(agentActions.userId, user.id),
            eq(agentActions.agentName, 'crm-auto-populate'),
            eq(agentActions.status, 'success'),
            gte(agentActions.createdAt, sevenDaysAgo),
          ),
        ),
      // Monthly CRM updates
      db
        .select({ count: sql<number>`count(*)` })
        .from(agentActions)
        .where(
          and(
            eq(agentActions.userId, user.id),
            eq(agentActions.agentName, 'crm-auto-populate'),
            eq(agentActions.status, 'success'),
            gte(agentActions.createdAt, thirtyDaysAgo),
          ),
        ),
    ]);

    // Get meeting IDs for draft queries (need to go through meetings table)
    const userMeetingIds = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.userId, user.id));

    const meetingIds = userMeetingIds.map((m) => m.id);

    let allDraftsCount = 0;
    let weeklyDraftsCount = 0;
    let monthlyDraftsCount = 0;
    let allSentCount = 0;
    let weeklySentCount = 0;
    let monthlySentCount = 0;

    if (meetingIds.length > 0) {
      const [allDrafts, weeklyDrafts, monthlyDrafts, allSent, weeklySent, monthlySent] =
        await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(inArray(drafts.meetingId, meetingIds)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(
              and(
                inArray(drafts.meetingId, meetingIds),
                gte(drafts.createdAt, sevenDaysAgo),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(
              and(
                inArray(drafts.meetingId, meetingIds),
                gte(drafts.createdAt, thirtyDaysAgo),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(
              and(
                inArray(drafts.meetingId, meetingIds),
                sql`${drafts.sentAt} IS NOT NULL`,
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(
              and(
                inArray(drafts.meetingId, meetingIds),
                sql`${drafts.sentAt} IS NOT NULL`,
                gte(drafts.sentAt, sevenDaysAgo),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(drafts)
            .where(
              and(
                inArray(drafts.meetingId, meetingIds),
                sql`${drafts.sentAt} IS NOT NULL`,
                gte(drafts.sentAt, thirtyDaysAgo),
              ),
            ),
        ]);

      allDraftsCount = Number(allDrafts[0]?.count || 0);
      weeklyDraftsCount = Number(weeklyDrafts[0]?.count || 0);
      monthlyDraftsCount = Number(monthlyDrafts[0]?.count || 0);
      allSentCount = Number(allSent[0]?.count || 0);
      weeklySentCount = Number(weeklySent[0]?.count || 0);
      monthlySentCount = Number(monthlySent[0]?.count || 0);
    }

    const weeklyBreakdown: ActionBreakdown = {
      meetingsProcessed: Number(weeklyMeetings[0]?.count || 0),
      draftsGenerated: weeklyDraftsCount,
      emailsSent: weeklySentCount,
      sequencesCreated: Number(weeklySequences[0]?.count || 0),
      crmUpdates: Number(weeklyCrmUpdates[0]?.count || 0),
    };

    const monthlyBreakdown: ActionBreakdown = {
      meetingsProcessed: Number(monthlyMeetings[0]?.count || 0),
      draftsGenerated: monthlyDraftsCount,
      emailsSent: monthlySentCount,
      sequencesCreated: Number(monthlySequences[0]?.count || 0),
      crmUpdates: Number(monthlyCrmUpdates[0]?.count || 0),
    };

    const allTimeBreakdown: ActionBreakdown = {
      meetingsProcessed: Number(allMeetings[0]?.count || 0),
      draftsGenerated: allDraftsCount,
      emailsSent: allSentCount,
      sequencesCreated: Number(allSequences[0]?.count || 0),
      crmUpdates: Number(allCrmUpdates[0]?.count || 0),
    };

    const response: TimeSavingsResponse = {
      weekly: calculatePeriodMetrics(weeklyBreakdown, hourlyRate),
      monthly: calculatePeriodMetrics(monthlyBreakdown, hourlyRate),
      allTime: calculatePeriodMetrics(allTimeBreakdown, hourlyRate),
      hourlyRate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[TIME-SAVINGS-ERROR]', error);
    return NextResponse.json(emptyResponse);
  }
}
