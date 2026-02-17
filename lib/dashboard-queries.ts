/**
 * Database queries for the dashboard.
 * Server-side only - do not import in client components.
 */

import { db } from './db';
import { drafts, meetings, transcripts, users } from './db/schema';
import { eq, desc, sql, and, ilike, or, isNull } from 'drizzle-orm';
import type { DraftStatus, MeetingStatus } from './db/schema';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Get the current user's database ID from Clerk
 */
async function getCurrentUserId(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;

  // Look up user by Clerk ID
  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  return dbUser?.id || null;
}

export interface DraftWithMeeting {
  id: string;
  subject: string;
  body: string;
  status: DraftStatus;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: string | null;
  generationDurationMs: number | null;
  sentAt: Date | null;
  sentTo: string | null;
  createdAt: Date | null;
  meetingId: string;
  meetingTopic: string | null;
  meetingHostEmail: string;
  meetingStartTime: Date | null;
  meetingPlatform: string;
  trackingId: string | null;
  // Email engagement tracking fields
  openedAt: Date | null;
  openCount: number | null;
  lastOpenedAt: Date | null;
  clickedAt: Date | null;
  clickCount: number | null;
  repliedAt: Date | null;
  // Quality grading scores (0-100)
  qualityScore: number | null;
  toneScore: number | null;
  completenessScore: number | null;
  personalizationScore: number | null;
  accuracyScore: number | null;
  gradingNotes: string | null;
  // User feedback
  userRating: 'up' | 'down' | null;
  userFeedback: string | null;
}

export interface DraftsQueryParams {
  page?: number;
  limit?: number;
  status?: DraftStatus | 'all';
  search?: string;
  dateRange?: 'week' | 'month' | 'all';
}

export interface DraftsQueryResult {
  drafts: DraftWithMeeting[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch drafts with pagination and filters
 * IMPORTANT: This filters by the current logged-in user for multi-tenant isolation
 */
export async function getDraftsWithMeetings(
  params: DraftsQueryParams = {}
): Promise<DraftsQueryResult> {
  const { page = 1, limit = 10, status = 'all', search = '', dateRange = 'all' } = params;
  const offset = (page - 1) * limit;

  // Get current user for filtering
  const userId = await getCurrentUserId();

  // Build where conditions
  const conditions = [];

  // USER FILTER - Critical for multi-tenant isolation
  // Filter by userId on meetings table (if set), or fall back to no results if no user
  if (userId) {
    conditions.push(eq(meetings.userId, userId));
  } else {
    // No authenticated user - return empty results
    return {
      drafts: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  // Status filter
  if (status !== 'all') {
    conditions.push(eq(drafts.status, status));
  }

  // Date range filter
  if (dateRange === 'week') {
    conditions.push(sql`${drafts.createdAt} >= NOW() - INTERVAL '7 days'`);
  } else if (dateRange === 'month') {
    conditions.push(sql`${drafts.createdAt} >= NOW() - INTERVAL '30 days'`);
  }

  // Search filter (searches subject and meeting topic)
  if (search) {
    conditions.push(
      or(
        ilike(drafts.subject, `%${search}%`),
        ilike(meetings.topic, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(drafts)
    .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Get paginated drafts with meeting info and tracking data
  const result = await db
    .select({
      id: drafts.id,
      subject: drafts.subject,
      body: drafts.body,
      status: drafts.status,
      model: drafts.model,
      inputTokens: drafts.inputTokens,
      outputTokens: drafts.outputTokens,
      costUsd: drafts.costUsd,
      generationDurationMs: drafts.generationDurationMs,
      sentAt: drafts.sentAt,
      sentTo: drafts.sentTo,
      createdAt: drafts.createdAt,
      meetingId: drafts.meetingId,
      meetingTopic: meetings.topic,
      meetingHostEmail: meetings.hostEmail,
      meetingStartTime: meetings.startTime,
      meetingPlatform: meetings.platform,
      trackingId: drafts.trackingId,
      // Email engagement tracking
      openedAt: drafts.openedAt,
      openCount: drafts.openCount,
      lastOpenedAt: drafts.lastOpenedAt,
      clickedAt: drafts.clickedAt,
      clickCount: drafts.clickCount,
      repliedAt: drafts.repliedAt,
      // Quality grading scores
      qualityScore: drafts.qualityScore,
      toneScore: drafts.toneScore,
      completenessScore: drafts.completenessScore,
      personalizationScore: drafts.personalizationScore,
      accuracyScore: drafts.accuracyScore,
      gradingNotes: drafts.gradingNotes,
      // User feedback
      userRating: drafts.userRating,
      userFeedback: drafts.userFeedback,
    })
    .from(drafts)
    .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(whereClause)
    .orderBy(desc(drafts.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    drafts: result as DraftWithMeeting[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single draft by ID with full details including tracking data
 */
export async function getDraftById(id: string): Promise<DraftWithMeeting | null> {
  const result = await db
    .select({
      id: drafts.id,
      subject: drafts.subject,
      body: drafts.body,
      status: drafts.status,
      model: drafts.model,
      inputTokens: drafts.inputTokens,
      outputTokens: drafts.outputTokens,
      costUsd: drafts.costUsd,
      generationDurationMs: drafts.generationDurationMs,
      sentAt: drafts.sentAt,
      sentTo: drafts.sentTo,
      createdAt: drafts.createdAt,
      meetingId: drafts.meetingId,
      meetingTopic: meetings.topic,
      meetingHostEmail: meetings.hostEmail,
      meetingStartTime: meetings.startTime,
      meetingPlatform: meetings.platform,
      trackingId: drafts.trackingId,
      // Email engagement tracking
      openedAt: drafts.openedAt,
      openCount: drafts.openCount,
      lastOpenedAt: drafts.lastOpenedAt,
      clickedAt: drafts.clickedAt,
      clickCount: drafts.clickCount,
      repliedAt: drafts.repliedAt,
      // Quality grading scores
      qualityScore: drafts.qualityScore,
      toneScore: drafts.toneScore,
      completenessScore: drafts.completenessScore,
      personalizationScore: drafts.personalizationScore,
      accuracyScore: drafts.accuracyScore,
      gradingNotes: drafts.gradingNotes,
      // User feedback
      userRating: drafts.userRating,
      userFeedback: drafts.userFeedback,
    })
    .from(drafts)
    .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(eq(drafts.id, id))
    .limit(1);

  return (result[0] as DraftWithMeeting) || null;
}

/**
 * Meeting detail with all related data
 */
export interface MeetingDetail {
  id: string;
  platform: string;
  topic: string | null;
  hostEmail: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  participants: Array<{ user_id?: string; user_name: string; email?: string }>;
  status: string;
  summary: string | null;
  keyDecisions: Array<{ decision: string; context?: string }> | null;
  keyTopics: Array<{ topic: string; duration?: string }> | null;
  actionItems: Array<{ owner: string; task: string; deadline: string }> | null;
  summaryGeneratedAt: Date | null;
  processingStep: string | null;
  processingProgress: number | null;
  processingLogs: Array<{ timestamp: string; step: string; message: string; duration_ms?: number }> | null;
  createdAt: Date;
  transcript: {
    id: string;
    wordCount: number | null;
    source: string;
    status: string;
    createdAt: Date;
  } | null;
  drafts: DraftWithMeeting[];
}

/**
 * Fetch a single meeting with all related data (drafts, transcript)
 * IMPORTANT: Filters by current user for multi-tenant isolation
 */
export async function getMeetingDetail(meetingId: string): Promise<MeetingDetail | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Fetch meeting with ownership check
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
    .limit(1);

  if (!meeting) return null;

  // Fetch transcript and drafts in parallel
  const [transcriptResult, draftsResult] = await Promise.all([
    db
      .select({
        id: transcripts.id,
        wordCount: transcripts.wordCount,
        source: transcripts.source,
        status: transcripts.status,
        createdAt: transcripts.createdAt,
      })
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1),
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        status: drafts.status,
        model: drafts.model,
        inputTokens: drafts.inputTokens,
        outputTokens: drafts.outputTokens,
        costUsd: drafts.costUsd,
        generationDurationMs: drafts.generationDurationMs,
        sentAt: drafts.sentAt,
        sentTo: drafts.sentTo,
        createdAt: drafts.createdAt,
        meetingId: drafts.meetingId,
        meetingTopic: meetings.topic,
        meetingHostEmail: meetings.hostEmail,
        meetingStartTime: meetings.startTime,
        meetingPlatform: meetings.platform,
        trackingId: drafts.trackingId,
        openedAt: drafts.openedAt,
        openCount: drafts.openCount,
        lastOpenedAt: drafts.lastOpenedAt,
        clickedAt: drafts.clickedAt,
        clickCount: drafts.clickCount,
        repliedAt: drafts.repliedAt,
        qualityScore: drafts.qualityScore,
        toneScore: drafts.toneScore,
        completenessScore: drafts.completenessScore,
        personalizationScore: drafts.personalizationScore,
        accuracyScore: drafts.accuracyScore,
        gradingNotes: drafts.gradingNotes,
      })
      .from(drafts)
      .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(eq(drafts.meetingId, meetingId))
      .orderBy(desc(drafts.createdAt)),
  ]);

  return {
    id: meeting.id,
    platform: meeting.platform,
    topic: meeting.topic,
    hostEmail: meeting.hostEmail,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    duration: meeting.duration,
    participants: (meeting.participants as MeetingDetail['participants']) || [],
    status: meeting.status,
    summary: meeting.summary,
    keyDecisions: meeting.keyDecisions as MeetingDetail['keyDecisions'],
    keyTopics: meeting.keyTopics as MeetingDetail['keyTopics'],
    actionItems: meeting.actionItems as MeetingDetail['actionItems'],
    summaryGeneratedAt: meeting.summaryGeneratedAt,
    processingStep: meeting.processingStep,
    processingProgress: meeting.processingProgress,
    processingLogs: meeting.processingLogs as MeetingDetail['processingLogs'],
    createdAt: meeting.createdAt,
    transcript: transcriptResult[0] || null,
    drafts: draftsResult as DraftWithMeeting[],
  };
}

/**
 * Update a draft's content
 */
export async function updateDraft(
  id: string,
  data: { subject?: string; body?: string }
): Promise<void> {
  await db.update(drafts).set(data).where(eq(drafts.id, id));
}

/**
 * Update draft status to sent
 */
export async function markDraftAsSent(
  id: string,
  sentTo: string
): Promise<void> {
  await db
    .update(drafts)
    .set({
      status: 'sent',
      sentAt: new Date(),
      sentTo,
    })
    .where(eq(drafts.id, id));
}

/**
 * Delete a draft by ID
 */
export async function deleteDraft(id: string): Promise<void> {
  await db.delete(drafts).where(eq(drafts.id, id));
}

/**
 * Meeting list item (lighter than MeetingDetail)
 */
export interface MeetingListItem {
  id: string;
  platform: string;
  topic: string | null;
  hostEmail: string;
  startTime: Date | null;
  duration: number | null;
  status: string;
  hasSummary: boolean;
  draftCount: number;
  sentCount: number;
  createdAt: Date;
}

export interface MeetingsQueryParams {
  page?: number;
  limit?: number;
  platform?: string;
  status?: string;
  search?: string;
}

export interface MeetingsQueryResult {
  meetings: MeetingListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch meetings list with pagination and filters
 * IMPORTANT: Filters by the current logged-in user for multi-tenant isolation
 */
export async function getMeetingsList(
  params: MeetingsQueryParams = {}
): Promise<MeetingsQueryResult> {
  const { page = 1, limit = 20, platform, status, search } = params;
  const offset = (page - 1) * limit;

  const userId = await getCurrentUserId();
  if (!userId) {
    return { meetings: [], total: 0, page, totalPages: 0 };
  }

  const conditions = [eq(meetings.userId, userId)];

  if (platform && platform !== 'all') {
    conditions.push(eq(meetings.platform, platform as 'zoom' | 'google_meet' | 'microsoft_teams'));
  }
  if (status && status !== 'all') {
    conditions.push(eq(meetings.status, status as MeetingStatus));
  }
  if (search) {
    conditions.push(
      or(
        ilike(meetings.topic, `%${search}%`),
        ilike(meetings.hostEmail, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [countResult, meetingRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(meetings)
      .where(whereClause),
    db
      .select({
        id: meetings.id,
        platform: meetings.platform,
        topic: meetings.topic,
        hostEmail: meetings.hostEmail,
        startTime: meetings.startTime,
        duration: meetings.duration,
        status: meetings.status,
        summary: meetings.summary,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(whereClause)
      .orderBy(desc(meetings.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(countResult[0]?.count || 0);

  // Get draft counts for each meeting in one query
  const meetingIds = meetingRows.map(m => m.id);
  let draftCounts: Record<string, { total: number; sent: number }> = {};

  if (meetingIds.length > 0) {
    const draftRows = await db
      .select({
        meetingId: drafts.meetingId,
        total: sql<number>`count(*)`,
        sent: sql<number>`count(*) filter (where ${drafts.status} = 'sent')`,
      })
      .from(drafts)
      .where(sql`${drafts.meetingId} = ANY(ARRAY[${sql.join(meetingIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
      .groupBy(drafts.meetingId);

    for (const row of draftRows) {
      if (row.meetingId) {
        draftCounts[row.meetingId] = {
          total: Number(row.total),
          sent: Number(row.sent),
        };
      }
    }
  }

  const meetingsResult: MeetingListItem[] = meetingRows.map(m => ({
    id: m.id,
    platform: m.platform,
    topic: m.topic,
    hostEmail: m.hostEmail,
    startTime: m.startTime,
    duration: m.duration,
    status: m.status,
    hasSummary: !!m.summary,
    draftCount: draftCounts[m.id]?.total || 0,
    sentCount: draftCounts[m.id]?.sent || 0,
    createdAt: m.createdAt,
  }));

  return {
    meetings: meetingsResult,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get draft statistics
 * IMPORTANT: This filters by the current logged-in user for multi-tenant isolation
 */
export async function getDraftStats(): Promise<{
  total: number;
  generated: number;
  sent: number;
  failed: number;
  avgCost: number;
  avgLatency: number;
}> {
  // Get current user for filtering
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      total: 0,
      generated: 0,
      sent: 0,
      failed: 0,
      avgCost: 0,
      avgLatency: 0,
    };
  }

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      generated: sql<number>`count(*) filter (where ${drafts.status} = 'generated')`,
      sent: sql<number>`count(*) filter (where ${drafts.status} = 'sent')`,
      failed: sql<number>`count(*) filter (where ${drafts.status} = 'failed')`,
      avgCost: sql<number>`avg(${drafts.costUsd}::numeric)`,
      avgLatency: sql<number>`avg(${drafts.generationDurationMs})`,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(eq(meetings.userId, userId));

  const result = stats[0];
  return {
    total: Number(result?.total || 0),
    generated: Number(result?.generated || 0),
    sent: Number(result?.sent || 0),
    failed: Number(result?.failed || 0),
    avgCost: Number(result?.avgCost || 0),
    avgLatency: Number(result?.avgLatency || 0),
  };
}
