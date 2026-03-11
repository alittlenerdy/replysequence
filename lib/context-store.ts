/**
 * Conversation Context Store — Query Helpers
 *
 * Provides typed CRUD operations for the deal_contexts and signals tables.
 * Used by:
 *   - Signal Extraction Engine (writes signals after transcript processing)
 *   - Decision Engines (reads accumulated context for predictions)
 *   - Dashboard (displays deal intelligence)
 */

import { db } from '@/lib/db';
import { dealContexts, signals, meetings } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { Signal } from '@/lib/signals/types';
import type { DealStage, NewSignalRecord } from '@/lib/db/schema';

// ── Upsert Deal Context ──────────────────────────────────────────────

interface UpsertDealContextParams {
  userId: string;
  companyName: string;
  companyDomain?: string;
  dealStage?: DealStage;
}

/**
 * Create or update a deal context for a user + company.
 * Uses companyDomain as the dedup key when available.
 */
export async function upsertDealContext(params: UpsertDealContextParams) {
  const { userId, companyName, companyDomain, dealStage } = params;

  // Try to find existing by user + domain (if domain provided)
  if (companyDomain) {
    const [existing] = await db
      .select()
      .from(dealContexts)
      .where(
        and(
          eq(dealContexts.userId, userId),
          eq(dealContexts.companyDomain, companyDomain),
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(dealContexts)
        .set({
          companyName,
          ...(dealStage && { dealStage }),
          updatedAt: new Date(),
        })
        .where(eq(dealContexts.id, existing.id))
        .returning();
      return updated;
    }
  }

  // Create new
  const [created] = await db
    .insert(dealContexts)
    .values({
      userId,
      companyName,
      companyDomain: companyDomain || null,
      dealStage: dealStage || 'prospecting',
    })
    .returning();

  return created;
}

// ── Insert Signals ───────────────────────────────────────────────────

interface InsertSignalsParams {
  meetingId: string;
  dealContextId?: string;
  signals: Signal[];
}

/**
 * Insert a batch of extracted signals for a meeting.
 * Idempotent: deletes any existing signals for the meetingId first,
 * so reprocessing a meeting always produces a clean signal set.
 * Returns the inserted signal records.
 */
export async function insertSignals(params: InsertSignalsParams) {
  const { meetingId, dealContextId, signals: signalBatch } = params;

  if (signalBatch.length === 0) return [];

  // Delete existing signals for this meeting (idempotency — last write wins)
  await db.delete(signals).where(eq(signals.meetingId, meetingId));

  const rows: NewSignalRecord[] = signalBatch.map((s) => ({
    meetingId,
    dealContextId: dealContextId || null,
    type: s.type,
    value: s.value,
    confidence: String(s.confidence),
    speaker: s.speaker || null,
    quote: s.quote || null,
  }));

  const inserted = await db
    .insert(signals)
    .values(rows)
    .returning();

  return inserted;
}

// ── Read Deal Context ────────────────────────────────────────────────

/**
 * Get a deal context by ID, including its recent signals.
 */
export async function getDealContextWithSignals(dealContextId: string) {
  const [dealContext] = await db
    .select()
    .from(dealContexts)
    .where(eq(dealContexts.id, dealContextId))
    .limit(1);

  if (!dealContext) return null;

  const dealSignals = await db
    .select()
    .from(signals)
    .where(eq(signals.dealContextId, dealContextId))
    .orderBy(desc(signals.createdAt));

  return {
    ...dealContext,
    signals: dealSignals,
  };
}

/**
 * Get deal context for a user + company domain.
 */
export async function getDealContextByDomain(userId: string, companyDomain: string) {
  const [dealContext] = await db
    .select()
    .from(dealContexts)
    .where(
      and(
        eq(dealContexts.userId, userId),
        eq(dealContexts.companyDomain, companyDomain),
      )
    )
    .limit(1);

  return dealContext || null;
}

/**
 * Get all deal contexts for a user, ordered by most recent meeting.
 */
export async function listDealContexts(userId: string) {
  return db
    .select()
    .from(dealContexts)
    .where(eq(dealContexts.userId, userId))
    .orderBy(desc(dealContexts.lastMeetingAt));
}

// ── Link Meeting to Deal ─────────────────────────────────────────────

interface LinkMeetingParams {
  meetingId: string;
  dealContextId: string;
}

/**
 * Associate a meeting with a deal context and update the deal's
 * lastMeetingId, lastMeetingAt, and meetingCount.
 */
export async function linkMeetingToDeal(params: LinkMeetingParams) {
  const { meetingId, dealContextId } = params;

  // Update the meeting's dealContextId
  await db
    .update(meetings)
    .set({ dealContextId })
    .where(eq(meetings.id, meetingId));

  // Get meeting startTime for lastMeetingAt
  const [meeting] = await db
    .select({ startTime: meetings.startTime })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  // Update deal context with meeting count using SQL subquery
  const [updated] = await db
    .update(dealContexts)
    .set({
      lastMeetingId: meetingId,
      lastMeetingAt: meeting?.startTime || new Date(),
      meetingCount: sql`(SELECT count(*) FROM meetings WHERE deal_context_id = ${dealContextId})::int`,
      updatedAt: new Date(),
    })
    .where(eq(dealContexts.id, dealContextId))
    .returning();

  return updated;
}

// ── Update Accumulated Context ───────────────────────────────────────

interface UpdateAccumulatedContextParams {
  dealContextId: string;
  stakeholders?: string[];
  objections?: string[];
  commitments?: string[];
  risks?: string[];
  nextSteps?: string[];
  signalCount?: number;
}

/**
 * Update the accumulated context fields on a deal context.
 * Called after signal extraction to merge new signals into the running totals.
 */
export async function updateAccumulatedContext(params: UpdateAccumulatedContextParams) {
  const { dealContextId, ...fields } = params;

  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.stakeholders) setFields.stakeholders = fields.stakeholders;
  if (fields.objections) setFields.objections = fields.objections;
  if (fields.commitments) setFields.commitments = fields.commitments;
  if (fields.risks) setFields.risks = fields.risks;
  if (fields.nextSteps) setFields.nextSteps = fields.nextSteps;
  if (fields.signalCount !== undefined) setFields.signalCount = fields.signalCount;

  const [updated] = await db
    .update(dealContexts)
    .set(setFields)
    .where(eq(dealContexts.id, dealContextId))
    .returning();

  return updated;
}

// ── Get Signals for Meeting ──────────────────────────────────────────

/**
 * Get all signals extracted from a specific meeting.
 */
export async function getSignalsForMeeting(meetingId: string) {
  return db
    .select()
    .from(signals)
    .where(eq(signals.meetingId, meetingId))
    .orderBy(desc(signals.confidence));
}
