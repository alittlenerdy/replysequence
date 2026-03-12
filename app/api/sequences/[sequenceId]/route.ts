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

const patchSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel']),
});

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
