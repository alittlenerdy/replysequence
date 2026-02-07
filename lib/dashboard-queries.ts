/**
 * Database queries for the dashboard.
 * Server-side only - do not import in client components.
 */

import { db } from './db';
import { drafts, meetings, transcripts, users } from './db/schema';
import { eq, desc, sql, and, ilike, or, isNull } from 'drizzle-orm';
import type { DraftStatus } from './db/schema';
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

  // Get paginated drafts with meeting info
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
 * Get a single draft by ID with full details
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
    })
    .from(drafts)
    .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(eq(drafts.id, id))
    .limit(1);

  return (result[0] as DraftWithMeeting) || null;
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
