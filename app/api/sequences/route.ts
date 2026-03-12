/**
 * Sequences API — list user's sequences, create new ones
 *
 * GET  /api/sequences — list all sequences for the authenticated user
 * POST /api/sequences — generate a new follow-up sequence for a meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, emailSequences, sequenceSteps, users, meetings, drafts } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { generateSequence } from '@/lib/sequence-generator';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id, firstName: users.firstName })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

/**
 * GET /api/sequences — list sequences with their steps
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const sequences = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.userId, userId))
    .orderBy(desc(emailSequences.createdAt));

  // Fetch steps for each sequence
  const result = await Promise.all(
    sequences.map(async (seq) => {
      const steps = await db
        .select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, seq.id))
        .orderBy(sequenceSteps.stepNumber);
      return { ...seq, steps };
    })
  );

  return NextResponse.json({ sequences: result });
}

const createSchema = z.object({
  meetingId: z.string().uuid(),
  draftId: z.string().uuid().optional(),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(255),
});

/**
 * POST /api/sequences — generate a new follow-up sequence
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { meetingId, draftId, recipientEmail, recipientName } = parsed.data;

  // Verify meeting belongs to user
  const [meeting] = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      summary: meetings.summary,
      actionItems: meetings.actionItems,
      userId: meetings.userId,
    })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
    .limit(1);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  // Get the initial draft content if provided
  let initialSubject = `Follow-up: ${meeting.topic || 'Our meeting'}`;
  let initialBody = '';

  if (draftId) {
    const [draft] = await db
      .select({ subject: drafts.subject, body: drafts.body })
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);
    if (draft) {
      initialSubject = draft.subject;
      initialBody = draft.body;
    }
  }

  // Get sender name
  const [user] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const senderName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your contact';

  const actionItems = (meeting.actionItems || []).map(
    (item) => typeof item === 'string' ? item : `${item.description} (${item.owner || 'unassigned'})`
  );

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
      initialSubject,
      initialBody,
    },
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    sequenceId: result.sequenceId,
    steps: result.steps,
    costUsd: result.costUsd,
  });
}
