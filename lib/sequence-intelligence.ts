/**
 * Sequence Intelligence
 *
 * Detects stale sequences (no engagement after 7+ days) and provides
 * intelligence features for sequence management.
 */

import { db, emailSequences, sequenceSteps } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';

// ── Types ────────────────────────────────────────────────────────────

export interface StaleSequence {
  sequenceId: string;
  recipientEmail: string;
  recipientName: string | null;
  meetingTopic: string | null;
  daysSinceLastActivity: number;
  stepsSent: number;
  totalSteps: number;
}

// ── Stale Detection ──────────────────────────────────────────────────

const STALE_THRESHOLD_DAYS = 7;

/**
 * Detect sequences that have gone cold: active sequences where the most
 * recently sent step was sent 7+ days ago with zero engagement (no opens,
 * no clicks, no replies on any sent step).
 */
export async function detectStaleSequences(
  userId: string,
): Promise<StaleSequence[]> {
  // Find active sequences for this user
  const activeSequences = await db
    .select({
      id: emailSequences.id,
      recipientEmail: emailSequences.recipientEmail,
      recipientName: emailSequences.recipientName,
      meetingTopic: emailSequences.meetingTopic,
      totalSteps: emailSequences.totalSteps,
      completedSteps: emailSequences.completedSteps,
    })
    .from(emailSequences)
    .where(
      and(
        eq(emailSequences.userId, userId),
        eq(emailSequences.status, 'active'),
      ),
    );

  if (activeSequences.length === 0) return [];

  const now = new Date();
  const stale: StaleSequence[] = [];

  for (const seq of activeSequences) {
    // Get all sent steps for this sequence
    const sentSteps = await db
      .select({
        sentAt: sequenceSteps.sentAt,
        openedAt: sequenceSteps.openedAt,
        clickedAt: sequenceSteps.clickedAt,
        repliedAt: sequenceSteps.repliedAt,
      })
      .from(sequenceSteps)
      .where(
        and(
          eq(sequenceSteps.sequenceId, seq.id),
          eq(sequenceSteps.status, 'sent'),
        ),
      );

    if (sentSteps.length === 0) continue;

    // Check if ANY sent step has engagement
    const hasEngagement = sentSteps.some(
      (s) => s.openedAt || s.clickedAt || s.repliedAt,
    );
    if (hasEngagement) continue;

    // Find most recent sent date
    const lastSentAt = sentSteps.reduce<Date | null>((latest, step) => {
      if (!step.sentAt) return latest;
      if (!latest) return step.sentAt;
      return step.sentAt > latest ? step.sentAt : latest;
    }, null);

    if (!lastSentAt) continue;

    const daysSince = Math.floor(
      (now.getTime() - lastSentAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSince >= STALE_THRESHOLD_DAYS) {
      stale.push({
        sequenceId: seq.id,
        recipientEmail: seq.recipientEmail,
        recipientName: seq.recipientName,
        meetingTopic: seq.meetingTopic,
        daysSinceLastActivity: daysSince,
        stepsSent: sentSteps.length,
        totalSteps: seq.totalSteps,
      });
    }
  }

  return stale;
}

// ── Meeting-Booked Auto-Pause ─────────────────────────────────────────

interface PauseResult {
  paused: boolean;
  sequenceIds: string[];
  reason?: string;
}

/**
 * Pause all active sequences for a user where the recipient is one of the
 * given participant emails. Called when a new meeting is booked (Recall webhook
 * or calendar sync) to prevent embarrassing follow-ups after a meeting is
 * already scheduled.
 */
export async function checkAndPauseSequencesForMeeting(
  userId: string,
  participantEmails: string[],
): Promise<PauseResult> {
  if (!participantEmails.length) {
    return { paused: false, sequenceIds: [], reason: 'no_participants' };
  }

  const normalised = participantEmails.map((e) => e.toLowerCase().trim());

  try {
    const activeSequences = await db
      .select({ id: emailSequences.id, recipientEmail: emailSequences.recipientEmail })
      .from(emailSequences)
      .where(
        and(
          eq(emailSequences.userId, userId),
          eq(emailSequences.status, 'active'),
          inArray(emailSequences.recipientEmail, normalised),
        ),
      );

    if (activeSequences.length === 0) {
      return { paused: false, sequenceIds: [], reason: 'no_matching_sequences' };
    }

    const sequenceIds = activeSequences.map((s) => s.id);
    const now = new Date();

    await db
      .update(emailSequences)
      .set({
        status: 'paused',
        pauseReason: 'meeting_booked',
        pausedAt: now,
        updatedAt: now,
      })
      .where(inArray(emailSequences.id, sequenceIds));

    await db
      .update(sequenceSteps)
      .set({ status: 'paused', updatedAt: now })
      .where(
        and(
          inArray(sequenceSteps.sequenceId, sequenceIds),
          inArray(sequenceSteps.status, ['pending', 'scheduled']),
        ),
      );

    console.log(
      JSON.stringify({
        level: 'info',
        tag: '[SEQUENCE-INTEL]',
        message: 'Sequences paused: meeting booked with recipient',
        userId,
        sequenceIds,
        recipientEmails: activeSequences.map((s) => s.recipientEmail),
      }),
    );

    return { paused: true, sequenceIds };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        tag: '[SEQUENCE-INTEL]',
        message: 'Failed to pause sequences for meeting',
        userId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { paused: false, sequenceIds: [], reason: 'unexpected_error' };
  }
}

// ── Reply-Intent Auto-Pause ───────────────────────────────────────────

/**
 * Handle reply intent classification results for sequence management.
 *
 * - auto_reply  -> pause with OOO reason, try to parse return date
 * - unsubscribe -> cancel sequence entirely
 * - interested / meeting_requested -> pause for manual decision
 * - other intents -> no automatic action
 */
export async function handleReplyIntent(
  draftId: string,
  intent: string,
  replyBody: string,
): Promise<PauseResult> {
  try {
    const sequences = await db
      .select({
        id: emailSequences.id,
        userId: emailSequences.userId,
        recipientEmail: emailSequences.recipientEmail,
        status: emailSequences.status,
      })
      .from(emailSequences)
      .where(eq(emailSequences.draftId, draftId));

    const activeSequences = sequences.filter((s) => s.status === 'active');

    if (activeSequences.length === 0) {
      return { paused: false, sequenceIds: [], reason: 'no_active_sequence_for_draft' };
    }

    const now = new Date();
    const affectedIds: string[] = [];

    for (const sequence of activeSequences) {
      if (intent === 'unsubscribe') {
        await db
          .update(emailSequences)
          .set({
            status: 'cancelled',
            pauseReason: 'complaint',
            pausedAt: now,
            updatedAt: now,
          })
          .where(eq(emailSequences.id, sequence.id));

        await db
          .update(sequenceSteps)
          .set({ status: 'skipped', updatedAt: now })
          .where(
            and(
              eq(sequenceSteps.sequenceId, sequence.id),
              inArray(sequenceSteps.status, ['pending', 'scheduled']),
            ),
          );

        console.log(
          JSON.stringify({
            level: 'info',
            tag: '[SEQUENCE-INTEL]',
            message: 'Sequence cancelled: unsubscribe request',
            draftId,
            sequenceId: sequence.id,
            recipientEmail: sequence.recipientEmail,
          }),
        );
        affectedIds.push(sequence.id);
      } else if (intent === 'auto_reply') {
        const resumeAt = parseReturnDate(replyBody);

        await db
          .update(emailSequences)
          .set({
            status: 'paused',
            pauseReason: 'ooo_detected',
            pausedAt: now,
            resumeAt,
            updatedAt: now,
          })
          .where(eq(emailSequences.id, sequence.id));

        await db
          .update(sequenceSteps)
          .set({ status: 'paused', updatedAt: now })
          .where(
            and(
              eq(sequenceSteps.sequenceId, sequence.id),
              inArray(sequenceSteps.status, ['pending', 'scheduled']),
            ),
          );

        const resumeLabel = resumeAt ? resumeAt.toISOString().split('T')[0] : 'unknown';
        console.log(
          JSON.stringify({
            level: 'info',
            tag: '[SEQUENCE-INTEL]',
            message: `Sequence paused: OOO detected, resuming ${resumeLabel}`,
            draftId,
            sequenceId: sequence.id,
            recipientEmail: sequence.recipientEmail,
            resumeAt: resumeAt?.toISOString() ?? null,
          }),
        );
        affectedIds.push(sequence.id);
      } else if (intent === 'interested' || intent === 'meeting_requested') {
        await db
          .update(emailSequences)
          .set({
            status: 'paused',
            pauseReason: 'positive_reply',
            pausedAt: now,
            updatedAt: now,
          })
          .where(eq(emailSequences.id, sequence.id));

        await db
          .update(sequenceSteps)
          .set({ status: 'paused', updatedAt: now })
          .where(
            and(
              eq(sequenceSteps.sequenceId, sequence.id),
              inArray(sequenceSteps.status, ['pending', 'scheduled']),
            ),
          );

        console.log(
          JSON.stringify({
            level: 'info',
            tag: '[SEQUENCE-INTEL]',
            message: `Sequence paused: positive reply (${intent})`,
            draftId,
            sequenceId: sequence.id,
            recipientEmail: sequence.recipientEmail,
          }),
        );
        affectedIds.push(sequence.id);
      }
      // For more_info, not_now, objection, other — no automatic action
    }

    return { paused: affectedIds.length > 0, sequenceIds: affectedIds };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        tag: '[SEQUENCE-INTEL]',
        message: 'Failed to handle reply intent for sequences',
        draftId,
        intent,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { paused: false, sequenceIds: [], reason: 'unexpected_error' };
  }
}

// ── OOO Return-Date Parser ────────────────────────────────────────────

/**
 * Parse a return/back date from an OOO message body.
 *
 * Looks for patterns like:
 *   "I'll be back on January 15"
 *   "returning March 3, 2026"
 *   "back in the office on 3/20"
 *   "out until 2026-03-25"
 *   "return on Jan 15th"
 */
export function parseReturnDate(body: string): Date | null {
  const text = body.toLowerCase();

  // Pattern 1: ISO-style dates (2026-03-25)
  const isoMatch = text.match(
    /(?:back|return|returning|until|through)\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/,
  );
  if (isoMatch) {
    const d = new Date(isoMatch[1] + 'T09:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 2: Month Day, Year (January 15, 2026 or Jan 15th 2026)
  const monthNames =
    'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  const monthDayPattern = new RegExp(
    `(?:back|return|returning|until|through)\\s+(?:on\\s+)?(?:the\\s+)?(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+(\\d{4}))?`,
  );
  const monthDayMatch = text.match(monthDayPattern);
  if (monthDayMatch) {
    const monthStr = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : new Date().getFullYear();
    const dateStr = `${monthStr} ${day}, ${year}`;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      if (d < new Date()) {
        d.setFullYear(d.getFullYear() + 1);
      }
      return d;
    }
  }

  // Pattern 3: US-style dates (3/20 or 3/20/2026)
  const usDateMatch = text.match(
    /(?:back|return|returning|until|through)\s+(?:on\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
  );
  if (usDateMatch) {
    const month = parseInt(usDateMatch[1], 10) - 1;
    const day = parseInt(usDateMatch[2], 10);
    let year = usDateMatch[3] ? parseInt(usDateMatch[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, 9, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
