/**
 * Database queries for the dashboard.
 * Server-side only - do not import in client components.
 */

import { cache } from 'react';
import { db } from './db';
import { drafts, meetings, transcripts, users, zoomConnections, teamsConnections, meetConnections, emailSequences, sequenceSteps } from './db/schema';
import { eq, desc, sql, and, ilike, or, isNull, gt, lt, isNotNull } from 'drizzle-orm';
import type { DraftStatus, DraftType, MeetingStatus } from './db/schema';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Get the current user's database ID from Clerk.
 * Wrapped with React.cache() to deduplicate within a single server request —
 * multiple calls from getDraftStats, getDraftsWithMeetings, etc. only hit the DB once.
 */
const getCurrentUserId = cache(async (): Promise<string | null> => {
  const user = await currentUser();
  if (!user) return null;

  // Look up user by Clerk ID
  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  return dbUser?.id || null;
});

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
  meetingDuration: number | null;
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
  // Meeting type for template recommendations
  meetingType: string | null;
  // Document type (email, proposal, recap, crm_notes, internal_summary)
  draftType: DraftType | null;
  // Demo flag
  isDemo: boolean;
  // Reply intent classification
  replyIntent: string | null;
  replyIntentConfidence: string | null;
  replyIntentSummary: string | null;
  // A/B testing
  subjectVariantB: string | null;
  // Data flywheel fields
  originalBody: string | null;
  flywheelContextUsed: boolean | null;
  flywheelMetadata: {
    styleProfileUsed: boolean;
    styleEditCount: number;
    contactHistoryUsed: boolean;
    contactEmailCount: number;
    contactMeetingCount: number;
    contactEmail: string | null;
    referencedMeetingIds: string[];
    referencedDraftIds: string[];
  } | null;
}

export interface DraftsQueryParams {
  page?: number;
  limit?: number;
  status?: DraftStatus | 'all';
  draftType?: DraftType | 'all';
  search?: string;
  dateRange?: 'week' | 'month' | 'all';
  replyIntent?: string;
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
  const { page = 1, limit = 10, status = 'all', draftType = 'all', search = '', dateRange = 'all', replyIntent } = params;
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

  // Document type filter
  if (draftType !== 'all') {
    conditions.push(eq(drafts.draftType, draftType));
  }

  // Date range filter
  if (dateRange === 'week') {
    conditions.push(sql`${drafts.createdAt} >= NOW() - INTERVAL '7 days'`);
  } else if (dateRange === 'month') {
    conditions.push(sql`${drafts.createdAt} >= NOW() - INTERVAL '30 days'`);
  }

  // Reply intent filter
  if (replyIntent) {
    conditions.push(sql`${drafts.replyIntent} = ${replyIntent}`);
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
      meetingDuration: meetings.duration,
      isDemo: meetings.isDemo,
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
      // Meeting type
      meetingType: drafts.meetingType,
      // Document type
      draftType: drafts.draftType,
      // Reply intent classification
      replyIntent: drafts.replyIntent,
      replyIntentConfidence: drafts.replyIntentConfidence,
      replyIntentSummary: drafts.replyIntentSummary,
      // A/B testing
      subjectVariantB: drafts.subjectVariantB,
      // Data flywheel fields
      flywheelContextUsed: drafts.flywheelContextUsed,
      flywheelMetadata: drafts.flywheelMetadata,
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
      meetingDuration: meetings.duration,
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
      // Meeting type
      meetingType: drafts.meetingType,
      // Document type
      draftType: drafts.draftType,
      // Reply intent classification
      replyIntent: drafts.replyIntent,
      replyIntentConfidence: drafts.replyIntentConfidence,
      replyIntentSummary: drafts.replyIntentSummary,
      // A/B testing
      subjectVariantB: drafts.subjectVariantB,
      // Data flywheel fields
      originalBody: drafts.originalBody,
      flywheelContextUsed: drafts.flywheelContextUsed,
      flywheelMetadata: drafts.flywheelMetadata,
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
  sentimentAnalysis: {
    overall: {
      score: number;
      label: string;
      trend: string;
      tones: string[];
    };
    speakers: Array<{
      name: string;
      score: number;
      label: string;
      tones: string[];
    }>;
  } | null;
  sentimentAnalyzedAt: Date | null;
  processingStep: string | null;
  processingError: string | null;
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
      userRating: drafts.userRating,
      userFeedback: drafts.userFeedback,
      meetingType: drafts.meetingType,
      replyIntent: drafts.replyIntent,
      replyIntentConfidence: drafts.replyIntentConfidence,
      replyIntentSummary: drafts.replyIntentSummary,
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
    sentimentAnalysis: meeting.sentimentAnalysis as MeetingDetail['sentimentAnalysis'],
    sentimentAnalyzedAt: meeting.sentimentAnalyzedAt ?? null,
    processingStep: meeting.processingStep,
    processingError: meeting.processingError,
    processingProgress: meeting.processingProgress,
    processingLogs: meeting.processingLogs as MeetingDetail['processingLogs'],
    createdAt: meeting.createdAt,
    transcript: transcriptResult[0] || null,
    drafts: draftsResult as DraftWithMeeting[],
  };
}

/**
 * Update a draft's content.
 * Blocks updates if the draft is currently being sent (status = 'sending').
 */
export async function updateDraft(
  id: string,
  data: { subject?: string; body?: string }
): Promise<void> {
  await db
    .update(drafts)
    .set(data)
    .where(and(eq(drafts.id, id), sql`${drafts.status} NOT IN ('sending', 'sent')`));
}

/**
 * Atomically claim a draft for sending by transitioning status from 'generated' to 'sending'.
 * Returns true if the claim succeeded (this caller owns the send), false if the draft
 * was already claimed by another process (e.g., user editing, or another auto-send).
 */
export async function claimDraftForSending(id: string): Promise<boolean> {
  const result = await db
    .update(drafts)
    .set({ status: 'sending' as const })
    .where(and(eq(drafts.id, id), eq(drafts.status, 'generated')));
  // Drizzle pg/neon returns { rowCount }, check rows affected
  return (result as unknown as { rowCount: number }).rowCount > 0;
}

/**
 * Revert a draft from 'sending' back to 'generated' (e.g., after a send failure).
 */
export async function revertDraftFromSending(id: string): Promise<void> {
  await db
    .update(drafts)
    .set({ status: 'generated' as const })
    .where(and(eq(drafts.id, id), eq(drafts.status, 'sending')));
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
  summary: string | null;
  draftCount: number;
  sentCount: number;
  createdAt: Date;
  isDemo: boolean;
  detectedLanguage: string | null;
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
        isDemo: meetings.isDemo,
        detectedLanguage: meetings.detectedLanguage,
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
    summary: m.summary,
    draftCount: draftCounts[m.id]?.total || 0,
    sentCount: draftCounts[m.id]?.sent || 0,
    createdAt: m.createdAt,
    isDemo: m.isDemo,
    detectedLanguage: m.detectedLanguage ?? null,
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
  meetingsProcessed: number;
  sequencesActive: number;
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
      meetingsProcessed: 0,
      sequencesActive: 0,
    };
  }

  const [draftStats, meetingStats, activeSeqStats] = await Promise.all([
    db
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
      .where(eq(meetings.userId, userId)),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(meetings)
      .where(and(
        eq(meetings.userId, userId),
        or(eq(meetings.status, 'ready'), eq(meetings.status, 'completed')),
      )),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emailSequences)
      .where(and(eq(emailSequences.userId, userId), eq(emailSequences.status, 'active'))),
  ]);

  const result = draftStats[0];
  return {
    total: Number(result?.total || 0),
    generated: Number(result?.generated || 0),
    sent: Number(result?.sent || 0),
    failed: Number(result?.failed || 0),
    avgCost: Number(result?.avgCost || 0),
    avgLatency: Number(result?.avgLatency || 0),
    meetingsProcessed: Number(meetingStats[0]?.count || 0),
    sequencesActive: Number(activeSeqStats[0]?.count || 0),
  };
}

/**
 * Check if the current user has any connected meeting platforms (Zoom, Teams, or Meet).
 * Checks actual connection table rows rather than draft count, so this remains
 * accurate even after all drafts have been deleted.
 */
export async function getUserHasConnectedPlatforms(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Check all three platform connection tables in parallel.
  // We only need to know if at least one row exists, so limit 1.
  const [zoom, teams, meet] = await Promise.all([
    db
      .select({ id: zoomConnections.id })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, userId))
      .limit(1),
    db
      .select({ id: teamsConnections.id })
      .from(teamsConnections)
      .where(eq(teamsConnections.userId, userId))
      .limit(1),
    db
      .select({ id: meetConnections.id })
      .from(meetConnections)
      .where(eq(meetConnections.userId, userId))
      .limit(1),
  ]);

  return zoom.length > 0 || teams.length > 0 || meet.length > 0;
}

// ── Mission Control ──────────────────────────────────────────────────

export interface PriorityItem {
  id: string;
  type: 'draft_review' | 'missing_followup' | 'deal_at_risk' | 'sequence_step_due' | 'high_engagement';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  timestamp: Date | null;
}

export interface MomentumData {
  score: number; // 0-100
  followUpCoverage: number; // percentage of meetings with at least one sent draft
  avgFollowUpHours: number; // average hours from meeting to first sent draft
  sequencesActive: number;
  dealsAtRisk: number;
  draftsReviewed: number; // sent out of total
  totalDrafts: number;
}

export interface MissionControlData {
  priorities: PriorityItem[];
  momentum: MomentumData;
}

/**
 * Fetch priority inbox items and momentum metrics for the Mission Control panel.
 */
export async function getMissionControlData(): Promise<MissionControlData> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      priorities: [],
      momentum: { score: 0, followUpCoverage: 0, avgFollowUpHours: 0, sequencesActive: 0, dealsAtRisk: 0, draftsReviewed: 0, totalDrafts: 0 },
    };
  }

  const [
    pendingDrafts,
    meetingsWithoutFollowups,
    failedDrafts,
    sequenceStepsDue,
    highEngagementNoReply,
    coverageStats,
    avgFollowUpResult,
    activeSequenceCount,
  ] = await Promise.all([
    // 1. Drafts awaiting review (generated but not sent)
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        meetingTopic: meetings.topic,
        createdAt: drafts.createdAt,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(eq(meetings.userId, userId), eq(drafts.status, 'generated')))
      .orderBy(desc(drafts.createdAt))
      .limit(5),

    // 2. Completed meetings with no drafts at all
    db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        startTime: meetings.startTime,
      })
      .from(meetings)
      .leftJoin(drafts, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(meetings.status, 'completed'),
        isNull(drafts.id),
      ))
      .orderBy(desc(meetings.startTime))
      .limit(5),

    // 3. Failed drafts (deals at risk)
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        meetingTopic: meetings.topic,
        createdAt: drafts.createdAt,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(eq(meetings.userId, userId), eq(drafts.status, 'failed')))
      .orderBy(desc(drafts.createdAt))
      .limit(5),

    // 4. Sequence steps due soon (scheduled within next 24h, still pending)
    db
      .select({
        id: sequenceSteps.id,
        subject: sequenceSteps.subject,
        scheduledAt: sequenceSteps.scheduledAt,
        recipientEmail: emailSequences.recipientEmail,
        recipientName: emailSequences.recipientName,
        sequenceId: sequenceSteps.sequenceId,
      })
      .from(sequenceSteps)
      .innerJoin(emailSequences, eq(sequenceSteps.sequenceId, emailSequences.id))
      .where(and(
        eq(emailSequences.userId, userId),
        eq(sequenceSteps.status, 'pending'),
        eq(emailSequences.status, 'active'),
        isNotNull(sequenceSteps.scheduledAt),
        lt(sequenceSteps.scheduledAt, sql`NOW() + INTERVAL '24 hours'`),
      ))
      .orderBy(sequenceSteps.scheduledAt)
      .limit(5),

    // 5. Emails opened/clicked but no reply (high engagement, no response)
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        sentTo: drafts.sentTo,
        openCount: drafts.openCount,
        clickCount: drafts.clickCount,
        sentAt: drafts.sentAt,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(drafts.status, 'sent'),
        isNull(drafts.repliedAt),
        gt(drafts.openCount, 0),
      ))
      .orderBy(desc(drafts.openCount))
      .limit(5),

    // 6. Coverage: meetings with at least one sent draft vs total processed meetings
    db
      .select({
        totalMeetings: sql<number>`count(distinct ${meetings.id})`,
        coveredMeetings: sql<number>`count(distinct case when ${drafts.status} = 'sent' then ${meetings.id} end)`,
        totalDrafts: sql<number>`count(${drafts.id})`,
        sentDrafts: sql<number>`count(*) filter (where ${drafts.status} = 'sent')`,
      })
      .from(meetings)
      .leftJoin(drafts, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        or(eq(meetings.status, 'ready'), eq(meetings.status, 'completed')),
      )),

    // 7. Average follow-up time (hours from meeting start to first sent draft)
    db
      .select({
        avgHours: sql<number>`avg(extract(epoch from (${drafts.sentAt} - ${meetings.startTime})) / 3600)`,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(drafts.status, 'sent'),
        isNotNull(drafts.sentAt),
        isNotNull(meetings.startTime),
      )),

    // 8. Active sequences count
    db
      .select({ count: sql<number>`count(*)` })
      .from(emailSequences)
      .where(and(eq(emailSequences.userId, userId), eq(emailSequences.status, 'active'))),
  ]);

  // Build priority items
  const priorities: PriorityItem[] = [];

  for (const d of pendingDrafts) {
    priorities.push({
      id: d.id,
      type: 'draft_review',
      severity: 'warning',
      title: d.subject || 'Untitled draft',
      description: d.meetingTopic ? `From: ${d.meetingTopic}` : 'Follow-up draft ready',
      href: `/dashboard/drafts`,
      actionLabel: 'Review',
      timestamp: d.createdAt,
    });
  }

  for (const m of meetingsWithoutFollowups) {
    priorities.push({
      id: m.id,
      type: 'missing_followup',
      severity: 'critical',
      title: m.topic || 'Untitled meeting',
      description: 'No follow-up email generated yet',
      href: `/dashboard/meetings`,
      actionLabel: 'Generate',
      timestamp: m.startTime,
    });
  }

  for (const d of failedDrafts) {
    priorities.push({
      id: d.id,
      type: 'deal_at_risk',
      severity: 'critical',
      title: d.subject || 'Failed draft',
      description: d.meetingTopic ? `Failed for: ${d.meetingTopic}` : 'Draft generation failed',
      href: `/dashboard/drafts`,
      actionLabel: 'Retry',
      timestamp: d.createdAt,
    });
  }

  for (const s of sequenceStepsDue) {
    priorities.push({
      id: s.id,
      type: 'sequence_step_due',
      severity: 'info',
      title: s.subject,
      description: `To: ${s.recipientName || s.recipientEmail}`,
      href: `/dashboard/sequences`,
      actionLabel: 'View',
      timestamp: s.scheduledAt,
    });
  }

  for (const e of highEngagementNoReply) {
    priorities.push({
      id: e.id,
      type: 'high_engagement',
      severity: 'info',
      title: e.subject || 'Opened email',
      description: `${e.openCount} opens, ${e.clickCount || 0} clicks — no reply yet`,
      href: `/dashboard/drafts`,
      actionLabel: 'Follow up',
      timestamp: e.sentAt,
    });
  }

  // Sort: critical first, then warning, then info; within severity by timestamp desc
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  priorities.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    const ta = a.timestamp?.getTime() ?? 0;
    const tb = b.timestamp?.getTime() ?? 0;
    return tb - ta;
  });

  // Compute momentum
  const coverage = coverageStats[0];
  const totalMeetings = Number(coverage?.totalMeetings || 0);
  const coveredMeetings = Number(coverage?.coveredMeetings || 0);
  const totalDrafts = Number(coverage?.totalDrafts || 0);
  const sentDrafts = Number(coverage?.sentDrafts || 0);
  const followUpCoverage = totalMeetings > 0 ? Math.round((coveredMeetings / totalMeetings) * 100) : 0;
  const avgFollowUpHours = Math.round(Number(avgFollowUpResult[0]?.avgHours || 0) * 10) / 10;
  const sequencesActive = Number(activeSequenceCount[0]?.count || 0);
  const dealsAtRisk = failedDrafts.length;

  // Momentum score: weighted blend of coverage(40%), follow-up speed(30%), low risk(30%)
  const coverageScore = followUpCoverage; // 0-100
  const speedScore = avgFollowUpHours <= 0 ? 0 : Math.max(0, 100 - (avgFollowUpHours / 48) * 100); // 0h=100, 48h+=0
  const riskScore = totalDrafts > 0 ? Math.max(0, 100 - (dealsAtRisk / Math.max(totalDrafts, 1)) * 200) : 0;
  const score = totalMeetings > 0 ? Math.round(coverageScore * 0.4 + speedScore * 0.3 + riskScore * 0.3) : 0;

  return {
    priorities: priorities.slice(0, 8),
    momentum: {
      score: Math.min(100, Math.max(0, score)),
      followUpCoverage,
      avgFollowUpHours,
      sequencesActive,
      dealsAtRisk,
      draftsReviewed: sentDrafts,
      totalDrafts,
    },
  };
}

// ── Recent AI Actions Feed ───────────────────────────────────────────

export type AIActionType =
  | 'draft_generated'
  | 'draft_sent'
  | 'sequence_created'
  | 'sequence_paused'
  | 'sequence_step_sent'
  | 'meeting_processed'
  | 'deal_flagged';

export interface AIAction {
  id: string;
  type: AIActionType;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  timestamp: Date;
}

/**
 * Fetch recent AI-driven actions from the last 24 hours.
 * Derives activity from drafts, sequences, sequence steps, and meetings.
 */
export async function getRecentAIActions(): Promise<AIAction[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const since = sql`NOW() - INTERVAL '24 hours'`;

  const [
    recentDraftsGenerated,
    recentDraftsSent,
    recentSequencesCreated,
    recentSequencesPaused,
    recentStepsSent,
    recentMeetingsProcessed,
    recentFailedDrafts,
  ] = await Promise.all([
    // Drafts generated in last 24h
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        meetingTopic: meetings.topic,
        createdAt: drafts.createdAt,
        sentTo: drafts.sentTo,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(drafts.status, 'generated'),
        gt(drafts.createdAt, since),
      ))
      .orderBy(desc(drafts.createdAt))
      .limit(10),

    // Drafts sent in last 24h
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        sentTo: drafts.sentTo,
        sentAt: drafts.sentAt,
        meetingTopic: meetings.topic,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(drafts.status, 'sent'),
        isNotNull(drafts.sentAt),
        gt(drafts.sentAt, since),
      ))
      .orderBy(desc(drafts.sentAt))
      .limit(10),

    // Sequences created in last 24h
    db
      .select({
        id: emailSequences.id,
        recipientName: emailSequences.recipientName,
        recipientEmail: emailSequences.recipientEmail,
        meetingTopic: emailSequences.meetingTopic,
        createdAt: emailSequences.createdAt,
      })
      .from(emailSequences)
      .where(and(
        eq(emailSequences.userId, userId),
        gt(emailSequences.createdAt, since),
      ))
      .orderBy(desc(emailSequences.createdAt))
      .limit(10),

    // Sequences paused in last 24h
    db
      .select({
        id: emailSequences.id,
        recipientName: emailSequences.recipientName,
        recipientEmail: emailSequences.recipientEmail,
        pauseReason: emailSequences.pauseReason,
        pausedAt: emailSequences.pausedAt,
      })
      .from(emailSequences)
      .where(and(
        eq(emailSequences.userId, userId),
        eq(emailSequences.status, 'paused'),
        isNotNull(emailSequences.pausedAt),
        gt(emailSequences.pausedAt, since),
      ))
      .orderBy(desc(emailSequences.pausedAt))
      .limit(10),

    // Sequence steps sent in last 24h
    db
      .select({
        id: sequenceSteps.id,
        subject: sequenceSteps.subject,
        sentAt: sequenceSteps.sentAt,
        recipientName: emailSequences.recipientName,
        recipientEmail: emailSequences.recipientEmail,
        sequenceId: sequenceSteps.sequenceId,
      })
      .from(sequenceSteps)
      .innerJoin(emailSequences, eq(sequenceSteps.sequenceId, emailSequences.id))
      .where(and(
        eq(emailSequences.userId, userId),
        eq(sequenceSteps.status, 'sent'),
        isNotNull(sequenceSteps.sentAt),
        gt(sequenceSteps.sentAt, since),
      ))
      .orderBy(desc(sequenceSteps.sentAt))
      .limit(10),

    // Meetings processed (completed) in last 24h
    db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        startTime: meetings.startTime,
        summaryGeneratedAt: meetings.summaryGeneratedAt,
      })
      .from(meetings)
      .where(and(
        eq(meetings.userId, userId),
        eq(meetings.status, 'completed'),
        isNotNull(meetings.summaryGeneratedAt),
        gt(meetings.summaryGeneratedAt, since),
      ))
      .orderBy(desc(meetings.summaryGeneratedAt))
      .limit(10),

    // Failed drafts (deal at risk) in last 24h
    db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        meetingTopic: meetings.topic,
        createdAt: drafts.createdAt,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(meetings.userId, userId),
        eq(drafts.status, 'failed'),
        gt(drafts.createdAt, since),
      ))
      .orderBy(desc(drafts.createdAt))
      .limit(5),
  ]);

  const actions: AIAction[] = [];

  for (const d of recentDraftsGenerated) {
    actions.push({
      id: `gen-${d.id}`,
      type: 'draft_generated',
      title: `Generated follow-up${d.meetingTopic ? ` for ${d.meetingTopic}` : ''}`,
      description: d.subject || 'Follow-up email draft',
      href: '/dashboard/drafts',
      actionLabel: 'Review',
      timestamp: d.createdAt!,
    });
  }

  for (const d of recentDraftsSent) {
    actions.push({
      id: `sent-${d.id}`,
      type: 'draft_sent',
      title: `Sent follow-up to ${d.sentTo || 'contact'}`,
      description: d.subject || 'Follow-up email',
      href: '/dashboard/drafts',
      actionLabel: 'View',
      timestamp: d.sentAt!,
    });
  }

  for (const s of recentSequencesCreated) {
    actions.push({
      id: `seq-${s.id}`,
      type: 'sequence_created',
      title: `Created sequence for ${s.recipientName || s.recipientEmail}`,
      description: s.meetingTopic ? `From: ${s.meetingTopic}` : 'Nurture sequence',
      href: '/dashboard/sequences',
      actionLabel: 'View',
      timestamp: s.createdAt,
    });
  }

  const pauseReasonLabels: Record<string, string> = {
    recipient_replied: 'after reply received',
    link_clicked: 'after link click',
    manual: 'manually',
    bounce: 'due to bounce',
  };

  for (const s of recentSequencesPaused) {
    const reason = s.pauseReason ? pauseReasonLabels[s.pauseReason] || s.pauseReason : '';
    actions.push({
      id: `pause-${s.id}`,
      type: 'sequence_paused',
      title: `Paused sequence for ${s.recipientName || s.recipientEmail}`,
      description: reason ? `Paused ${reason}` : 'Sequence paused',
      href: '/dashboard/sequences',
      actionLabel: 'View',
      timestamp: s.pausedAt!,
    });
  }

  for (const s of recentStepsSent) {
    actions.push({
      id: `step-${s.id}`,
      type: 'sequence_step_sent',
      title: `Sent sequence step to ${s.recipientName || s.recipientEmail}`,
      description: s.subject,
      href: '/dashboard/sequences',
      actionLabel: 'View',
      timestamp: s.sentAt!,
    });
  }

  for (const m of recentMeetingsProcessed) {
    actions.push({
      id: `meet-${m.id}`,
      type: 'meeting_processed',
      title: `Processed ${m.topic || 'meeting'}`,
      description: 'Transcript analyzed, summary generated',
      href: `/dashboard/meetings`,
      actionLabel: 'View',
      timestamp: m.summaryGeneratedAt!,
    });
  }

  for (const d of recentFailedDrafts) {
    actions.push({
      id: `risk-${d.id}`,
      type: 'deal_flagged',
      title: `Flagged deal at risk${d.meetingTopic ? ` — ${d.meetingTopic}` : ''}`,
      description: 'Draft generation failed, follow-up overdue',
      href: '/dashboard/drafts',
      actionLabel: 'Retry',
      timestamp: d.createdAt!,
    });
  }

  // Sort all actions by timestamp descending
  actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return actions.slice(0, 15);
}

// ── Dashboard Component Data ─────────────────────────────────────────

/**
 * Get recent meetings for MeetingJobsTable component.
 * Returns the 5 most recent meetings with status and platform info.
 */
export async function getRecentMeetingsForDashboard(): Promise<Array<{
  id: string;
  name: string;
  source: 'zoom' | 'meet' | 'teams';
  time: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
  duration?: string;
}>> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const recentMeetings = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      platform: meetings.platform,
      status: meetings.status,
      startTime: meetings.startTime,
      duration: meetings.duration,
      createdAt: meetings.createdAt,
      processingStep: meetings.processingStep,
    })
    .from(meetings)
    .where(eq(meetings.userId, userId))
    .orderBy(desc(meetings.createdAt))
    .limit(5);

  return recentMeetings.map((m) => {
    // Map platform to source
    const source = m.platform === 'google_meet' ? 'meet' as const
      : m.platform === 'microsoft_teams' ? 'teams' as const
      : 'zoom' as const;

    // Map meeting status to component status
    let status: 'processing' | 'completed' | 'failed' | 'pending';
    if (m.status === 'failed') status = 'failed';
    else if (m.status === 'ready' || m.status === 'completed') status = 'completed';
    else if (m.status === 'processing') status = 'processing';
    else status = 'pending';

    // Format relative time
    const now = new Date();
    const created = m.createdAt;
    const diffMs = now.getTime() - created.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    let time: string;
    if (diffMin < 1) time = 'just now';
    else if (diffMin < 60) time = `${diffMin}m ago`;
    else if (diffHours < 24) time = `${diffHours}h ago`;
    else time = `${diffDays}d ago`;

    // Format duration
    const duration = m.duration ? `${m.duration}m` : undefined;

    return {
      id: m.id,
      name: m.topic || 'Untitled Meeting',
      source,
      time,
      status,
      duration,
    };
  });
}

/**
 * Get the most recent processing meeting for ProcessingStatusCard.
 * Returns the latest meeting that is still being processed, or the most recent completed one.
 */
export async function getProcessingStatus(): Promise<{
  status: 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'generating_sequence' | 'draft_ready' | 'failed';
  meetingName: string;
  lastUpdated: string;
  error?: string;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // First try to find a currently processing meeting
  let [meeting] = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      status: meetings.status,
      processingStep: meetings.processingStep,
      processingError: meetings.processingError,
      updatedAt: meetings.updatedAt,
    })
    .from(meetings)
    .where(and(eq(meetings.userId, userId), eq(meetings.status, 'processing')))
    .orderBy(desc(meetings.updatedAt))
    .limit(1);

  // If no processing meeting, get the most recent one
  if (!meeting) {
    [meeting] = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        status: meetings.status,
        processingStep: meetings.processingStep,
        processingError: meetings.processingError,
        updatedAt: meetings.updatedAt,
      })
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.updatedAt))
      .limit(1);
  }

  if (!meeting) return null;

  // Map processing step to pipeline status
  type PipelineStatus = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'generating_sequence' | 'draft_ready' | 'failed';
  let pipelineStatus: PipelineStatus;

  if (meeting.status === 'failed') {
    pipelineStatus = 'failed';
  } else if (meeting.status === 'ready' || meeting.status === 'completed') {
    // Check if draft exists
    const [draft] = await db
      .select({ id: drafts.id })
      .from(drafts)
      .where(eq(drafts.meetingId, meeting.id))
      .limit(1);
    pipelineStatus = draft ? 'draft_ready' : 'analyzing';
  } else {
    // Map processingStep to pipeline status
    // Valid ProcessingStep values: webhook_received, meeting_fetched, meeting_created,
    // transcript_download, transcript_pending, transcript_parse, transcript_stored,
    // draft_generation, completed, failed
    const step = meeting.processingStep;
    if (step === 'transcript_stored' || step === 'transcript_parse' || step === 'transcript_pending' || step === 'transcript_download') pipelineStatus = 'transcribing';
    else if (step === 'draft_generation') pipelineStatus = 'generating_sequence';
    else if (step === 'completed') pipelineStatus = 'draft_ready';
    else if (step === 'webhook_received' || step === 'meeting_fetched' || step === 'meeting_created') pipelineStatus = 'uploading';
    else pipelineStatus = 'analyzing';
  }

  // Format relative time
  const now = new Date();
  const diffMs = now.getTime() - meeting.updatedAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  let lastUpdated: string;
  if (diffMin < 1) lastUpdated = 'just now';
  else if (diffMin < 60) lastUpdated = `${diffMin} min ago`;
  else lastUpdated = `${diffHours}h ago`;

  return {
    status: pipelineStatus,
    meetingName: meeting.topic || 'Untitled Meeting',
    lastUpdated,
    error: meeting.processingError || undefined,
  };
}

/**
 * Get activity feed events for the ActivityFeed component.
 * Converts AIActions to the simpler FeedEvent format.
 */
export async function getActivityFeedEvents(): Promise<Array<{
  id: string;
  description: string;
  time: string;
  color: string;
}>> {
  const actions = await getRecentAIActions();

  const typeColors: Record<string, string> = {
    draft_generated: '#5B6CFF',
    draft_sent: '#4DFFA3',
    sequence_created: '#7A5CFF',
    sequence_paused: '#FFD75F',
    sequence_step_sent: '#4DFFA3',
    meeting_processed: '#38E8FF',
    deal_flagged: '#FF5D5D',
  };

  return actions.map((action) => {
    const now = new Date();
    const diffMs = now.getTime() - action.timestamp.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    let time: string;
    if (diffMin < 1) time = 'just now';
    else if (diffMin < 60) time = `${diffMin}m ago`;
    else if (diffHours < 24) time = `${diffHours}h ago`;
    else time = `${diffDays}d ago`;

    return {
      id: action.id,
      description: `${action.title}${action.description ? ` — ${action.description}` : ''}`,
      time,
      color: typeColors[action.type] || '#5B6CFF',
    };
  });
}

/**
 * Get AI insights for the most recent meeting with a summary.
 * Returns data formatted for the AIInsightsPanel component.
 */
export async function getLatestMeetingInsights(): Promise<{
  meetingName: string;
  summary: string;
  nextSteps: string[];
  decisionMaker?: { name: string; title: string };
  timeline?: string;
  painPoints: string[];
  objections: string[];
  followUpPriority: 'high' | 'medium' | 'low';
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Find the most recent meeting with a summary
  const [meeting] = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      summary: meetings.summary,
      keyDecisions: meetings.keyDecisions,
      keyTopics: meetings.keyTopics,
      actionItems: meetings.actionItems,
      sentimentAnalysis: meetings.sentimentAnalysis,
    })
    .from(meetings)
    .where(and(
      eq(meetings.userId, userId),
      isNotNull(meetings.summary),
    ))
    .orderBy(desc(meetings.createdAt))
    .limit(1);

  if (!meeting || !meeting.summary) return null;

  const actionItems = (meeting.actionItems as Array<{ owner: string; task: string; deadline: string }>) || [];
  const keyTopics = (meeting.keyTopics as Array<{ topic: string; duration?: string }>) || [];
  const keyDecisions = (meeting.keyDecisions as Array<{ decision: string; context?: string }>) || [];
  const sentiment = meeting.sentimentAnalysis as { overall?: { score?: number } } | null;

  // Extract next steps from action items
  const nextSteps = actionItems.map((item) => `${item.task}${item.deadline ? ` (by ${item.deadline})` : ''}`);

  // Extract pain points from key topics
  const painPoints = keyTopics.slice(0, 4).map((t) => t.topic);

  // Map sentiment to priority
  let followUpPriority: 'high' | 'medium' | 'low' = 'medium';
  if (sentiment?.overall?.score !== undefined) {
    if (sentiment.overall.score >= 70) followUpPriority = 'high';
    else if (sentiment.overall.score <= 40) followUpPriority = 'low';
  }

  return {
    meetingName: meeting.topic || 'Recent Meeting',
    summary: meeting.summary,
    nextSteps,
    painPoints,
    objections: keyDecisions.slice(0, 3).map((d) => d.decision),
    followUpPriority,
  };
}

/**
 * Get the latest email sequence for SequencePreviewCard.
 */
export async function getLatestSequencePreview(): Promise<{
  meetingName: string;
  emails: Array<{
    step: number;
    subject: string;
    preview: string;
    body: string;
    timing: string;
    purpose: 'recap' | 'value' | 'nudge';
  }>;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Find the most recent email sequence
  const [sequence] = await db
    .select({
      id: emailSequences.id,
      meetingTopic: emailSequences.meetingTopic,
      recipientName: emailSequences.recipientName,
    })
    .from(emailSequences)
    .where(eq(emailSequences.userId, userId))
    .orderBy(desc(emailSequences.createdAt))
    .limit(1);

  if (!sequence) return null;

  // Get steps for this sequence
  const steps = await db
    .select({
      stepNumber: sequenceSteps.stepNumber,
      subject: sequenceSteps.subject,
      body: sequenceSteps.body,
      scheduledAt: sequenceSteps.scheduledAt,
      status: sequenceSteps.status,
    })
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequence.id))
    .orderBy(sequenceSteps.stepNumber);

  if (steps.length === 0) return null;

  const purposeMap: Array<'recap' | 'value' | 'nudge'> = ['recap', 'value', 'nudge'];

  return {
    meetingName: sequence.meetingTopic || sequence.recipientName || 'Recent Sequence',
    emails: steps.map((step, i) => ({
      step: step.stepNumber,
      subject: step.subject,
      preview: step.body.slice(0, 200),
      body: step.body,
      timing: step.status === 'sent' ? 'Sent' : step.scheduledAt
        ? `Scheduled ${step.scheduledAt.toLocaleDateString()}`
        : `Step ${step.stepNumber}`,
      purpose: purposeMap[Math.min(i, purposeMap.length - 1)],
    })),
  };
}

/** Get the most recent generated (ready-to-send) draft for the current user. */
export async function getLatestReadyDraft(): Promise<{
  id: string;
  subject: string;
  body: string;
  meetingTopic: string | null;
  meetingPlatform: string;
  generationMs: number | null;
  createdAt: Date | null;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [row] = await db
    .select({
      id: drafts.id,
      subject: drafts.subject,
      body: drafts.body,
      meetingTopic: meetings.topic,
      meetingPlatform: meetings.platform,
      generationMs: drafts.generationDurationMs,
      createdAt: drafts.createdAt,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(and(eq(meetings.userId, userId), eq(drafts.status, 'generated')))
    .orderBy(desc(drafts.createdAt))
    .limit(1);

  return row || null;
}
