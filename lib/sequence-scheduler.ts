/**
 * Sequence Scheduler
 *
 * After a draft is sent (manually or auto-send), this module:
 *  1. Generates a follow-up sequence via Claude
 *  2. Computes scheduledAt for each step based on sentAt + delayHours
 *  3. Transitions steps from 'pending' to 'scheduled'
 *
 * Called from both `lib/auto-send.ts` and `app/api/drafts/send/route.ts`.
 */

import { db, emailSequences, sequenceSteps, meetings, users } from './db';
import { eq, and } from 'drizzle-orm';
import { generateSequence } from './sequence-generator';
import type { Participant } from './db/schema';

interface ScheduleSequenceParams {
  draftId: string;
  meetingId: string;
  userId: string;
  recipientEmail: string;
  sentAt?: Date; // When the initial email was sent; defaults to now
}

interface ScheduleSequenceResult {
  scheduled: boolean;
  sequenceId?: string;
  stepCount?: number;
  reason?: string;
}

/**
 * Generate and schedule a follow-up sequence after a draft is sent.
 * Non-blocking: catches all errors internally and returns a result object.
 */
export async function scheduleFollowUpSequence(
  params: ScheduleSequenceParams
): Promise<ScheduleSequenceResult> {
  const { draftId, meetingId, userId, recipientEmail, sentAt = new Date() } = params;

  try {
    // Fetch meeting context
    const [meeting] = await db
      .select({
        topic: meetings.topic,
        summary: meetings.summary,
        actionItems: meetings.actionItems,
        participants: meetings.participants,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return { scheduled: false, reason: 'meeting_not_found' };
    }

    // Get recipient name from participants
    const participants = (meeting.participants as Participant[] | null) || [];
    const recipient = participants.find(
      (p) => p.email?.toLowerCase() === recipientEmail.toLowerCase()
    );
    const recipientName = recipient?.name || recipientEmail.split('@')[0];

    // Get sender name
    const [user] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const senderName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your contact';

    // Get the initial draft content
    const { drafts } = await import('./db/schema');
    const [draft] = await db
      .select({ subject: drafts.subject, body: drafts.body })
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return { scheduled: false, reason: 'draft_not_found' };
    }

    const actionItems = (meeting.actionItems || []).map(
      (item: string | { description: string; owner?: string }) =>
        typeof item === 'string' ? item : `${item.description} (${item.owner || 'unassigned'})`
    );

    // Generate the sequence
    const result = await generateSequence({
      userId,
      meetingId,
      draftId,
      context: {
        meetingTopic: meeting.topic || 'Meeting',
        meetingSummary: meeting.summary || '',
        actionItems,
        recipientName,
        recipientEmail,
        senderName,
        initialSubject: draft.subject,
        initialBody: draft.body,
      },
    });

    if (!result.success || !result.sequenceId) {
      return { scheduled: false, reason: result.error || 'generation_failed' };
    }

    // Schedule all steps: compute scheduledAt = sentAt + delayHours
    const sequenceId = result.sequenceId;
    const steps = await db
      .select({ id: sequenceSteps.id, delayHours: sequenceSteps.delayHours })
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, sequenceId));

    for (const step of steps) {
      const scheduledAt = new Date(sentAt.getTime() + step.delayHours * 60 * 60 * 1000);
      await db.update(sequenceSteps).set({
        scheduledAt,
        status: 'scheduled',
        updatedAt: new Date(),
      }).where(eq(sequenceSteps.id, step.id));
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[SEQUENCE]',
      message: 'Follow-up sequence scheduled',
      sequenceId,
      meetingId,
      draftId,
      recipientEmail,
      stepCount: steps.length,
    }));

    return {
      scheduled: true,
      sequenceId,
      stepCount: steps.length,
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[SEQUENCE]',
      message: 'Failed to schedule follow-up sequence',
      draftId,
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { scheduled: false, reason: 'unexpected_error' };
  }
}
