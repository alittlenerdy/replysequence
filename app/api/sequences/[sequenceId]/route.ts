/**
 * Individual Sequence API
 *
 * GET    /api/sequences/[sequenceId] — get sequence with steps
 * PATCH  /api/sequences/[sequenceId] — pause/resume/cancel
 * DELETE /api/sequences/[sequenceId] — delete sequence and steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, emailSequences, sequenceSteps, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { SequenceStatus, SequencePauseReason } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ sequenceId: string }> };

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

async function getOwnedSequence(sequenceId: string, userId: string) {
  const [seq] = await db
    .select()
    .from(emailSequences)
    .where(and(eq(emailSequences.id, sequenceId), eq(emailSequences.userId, userId)))
    .limit(1);
  return seq || null;
}

/**
 * GET — fetch sequence with all steps
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { sequenceId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sequence = await getOwnedSequence(sequenceId, userId);
  if (!sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

  const steps = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId))
    .orderBy(sequenceSteps.stepNumber);

  return NextResponse.json({ ...sequence, steps });
}

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause') }),
  z.object({ action: z.literal('resume') }),
  z.object({ action: z.literal('cancel') }),
  z.object({
    action: z.literal('edit_step'),
    stepId: z.string().uuid(),
    subject: z.string().min(1).max(500).optional(),
    body: z.string().min(1).max(10000).optional(),
  }),
  z.object({
    action: z.literal('schedule_all'),
    startAt: z.string().datetime().optional(), // ISO string; defaults to now
  }),
]);

/**
 * PATCH — pause, resume, or cancel a sequence
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { sequenceId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sequence = await getOwnedSequence(sequenceId, userId);
  if (!sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { action } = parsed.data;
  const now = new Date();

  switch (action) {
    case 'pause': {
      if (sequence.status !== 'active') {
        return NextResponse.json({ error: 'Sequence is not active' }, { status: 400 });
      }
      await db.update(emailSequences).set({
        status: 'paused' as SequenceStatus,
        pauseReason: 'user_paused' as SequencePauseReason,
        pausedAt: now,
        updatedAt: now,
      }).where(eq(emailSequences.id, sequenceId));
      return NextResponse.json({ status: 'paused' });
    }

    case 'resume': {
      if (sequence.status !== 'paused') {
        return NextResponse.json({ error: 'Sequence is not paused' }, { status: 400 });
      }
      await db.update(emailSequences).set({
        status: 'active' as SequenceStatus,
        pauseReason: null,
        pausedAt: null,
        updatedAt: now,
      }).where(eq(emailSequences.id, sequenceId));
      return NextResponse.json({ status: 'active' });
    }

    case 'cancel': {
      if (sequence.status === 'completed' || sequence.status === 'cancelled') {
        return NextResponse.json({ error: 'Sequence is already finished' }, { status: 400 });
      }
      // Cancel sequence and skip all pending/scheduled steps
      await db.update(emailSequences).set({
        status: 'cancelled' as SequenceStatus,
        updatedAt: now,
      }).where(eq(emailSequences.id, sequenceId));

      await db.update(sequenceSteps).set({
        status: 'skipped',
        updatedAt: now,
      }).where(
        and(
          eq(sequenceSteps.sequenceId, sequenceId),
          eq(sequenceSteps.status, 'pending')
        )
      );
      await db.update(sequenceSteps).set({
        status: 'skipped',
        updatedAt: now,
      }).where(
        and(
          eq(sequenceSteps.sequenceId, sequenceId),
          eq(sequenceSteps.status, 'scheduled')
        )
      );

      return NextResponse.json({ status: 'cancelled' });
    }

    case 'edit_step': {
      const { stepId, subject, body: stepBody } = parsed.data;
      if (!subject && !stepBody) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
      }

      // Only allow editing pending or scheduled steps
      const [step] = await db
        .select({ id: sequenceSteps.id, status: sequenceSteps.status })
        .from(sequenceSteps)
        .where(
          and(
            eq(sequenceSteps.id, stepId),
            eq(sequenceSteps.sequenceId, sequenceId)
          )
        )
        .limit(1);

      if (!step) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 });
      }
      if (step.status !== 'pending' && step.status !== 'scheduled') {
        return NextResponse.json({ error: 'Can only edit pending or scheduled steps' }, { status: 400 });
      }

      const updates: Record<string, unknown> = { updatedAt: now };
      if (subject) updates.subject = subject;
      if (stepBody) updates.body = stepBody;

      await db.update(sequenceSteps).set(updates).where(eq(sequenceSteps.id, stepId));
      return NextResponse.json({ updated: true, stepId });
    }

    case 'schedule_all': {
      if (sequence.status !== 'active' && sequence.status !== 'paused') {
        return NextResponse.json({ error: 'Sequence is not active or paused' }, { status: 400 });
      }

      const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : now;

      // Get all pending steps and schedule them
      const pendingSteps = await db
        .select({ id: sequenceSteps.id, delayHours: sequenceSteps.delayHours })
        .from(sequenceSteps)
        .where(
          and(
            eq(sequenceSteps.sequenceId, sequenceId),
            eq(sequenceSteps.status, 'pending')
          )
        )
        .orderBy(sequenceSteps.stepNumber);

      for (const step of pendingSteps) {
        const scheduledAt = new Date(startAt.getTime() + step.delayHours * 60 * 60 * 1000);
        await db.update(sequenceSteps).set({
          scheduledAt,
          status: 'scheduled',
          updatedAt: now,
        }).where(eq(sequenceSteps.id, step.id));
      }

      // Ensure sequence is active
      if (sequence.status === 'paused') {
        await db.update(emailSequences).set({
          status: 'active',
          pauseReason: null,
          pausedAt: null,
          updatedAt: now,
        }).where(eq(emailSequences.id, sequenceId));
      }

      return NextResponse.json({
        scheduled: true,
        stepsScheduled: pendingSteps.length,
        startAt: startAt.toISOString(),
      });
    }
  }
}

/**
 * DELETE — remove sequence and all steps
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { sequenceId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sequence = await getOwnedSequence(sequenceId, userId);
  if (!sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

  // Steps cascade-delete from the FK
  await db.delete(emailSequences).where(eq(emailSequences.id, sequenceId));

  return NextResponse.json({ deleted: true });
}
