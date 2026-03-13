/**
 * Next Steps API
 *
 * GET  /api/next-steps              — list next steps for user (filterable)
 * PATCH /api/next-steps             — batch update status (complete/dismiss)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, nextStepsTable, users, meetings, dealContexts } from '@/lib/db';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { syncCompletedNextStepsToCRM } from '@/lib/crm-next-step-sync';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

/**
 * GET — list next steps with optional filters
 * Query params: status, meetingId, dealContextId, limit, offset
 */
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const statusFilter = params.get('status'); // pending, completed, dismissed, overdue
  const meetingIdFilter = params.get('meetingId');
  const dealContextIdFilter = params.get('dealContextId');
  const limit = Math.min(parseInt(params.get('limit') || '50'), 100);
  const offset = parseInt(params.get('offset') || '0');

  // Build conditions
  const conditions = [eq(nextStepsTable.userId, userId)];
  if (statusFilter) {
    conditions.push(eq(nextStepsTable.status, statusFilter as 'pending' | 'completed' | 'dismissed' | 'overdue'));
  }
  if (meetingIdFilter) {
    conditions.push(eq(nextStepsTable.meetingId, meetingIdFilter));
  }
  if (dealContextIdFilter) {
    conditions.push(eq(nextStepsTable.dealContextId, dealContextIdFilter));
  }

  const [steps, countResult] = await Promise.all([
    db
      .select({
        id: nextStepsTable.id,
        task: nextStepsTable.task,
        owner: nextStepsTable.owner,
        ownerType: nextStepsTable.ownerType,
        type: nextStepsTable.type,
        urgency: nextStepsTable.urgency,
        source: nextStepsTable.source,
        confidence: nextStepsTable.confidence,
        status: nextStepsTable.status,
        dueDate: nextStepsTable.dueDate,
        completedAt: nextStepsTable.completedAt,
        createdAt: nextStepsTable.createdAt,
        meetingId: nextStepsTable.meetingId,
        dealContextId: nextStepsTable.dealContextId,
        // Join meeting topic
        meetingTopic: meetings.topic,
        meetingDate: meetings.startTime,
        // Join deal company
        companyName: dealContexts.companyName,
      })
      .from(nextStepsTable)
      .leftJoin(meetings, eq(nextStepsTable.meetingId, meetings.id))
      .leftJoin(dealContexts, eq(nextStepsTable.dealContextId, dealContexts.id))
      .where(and(...conditions))
      .orderBy(desc(nextStepsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(nextStepsTable)
      .where(and(...conditions)),
  ]);

  return NextResponse.json({
    steps,
    total: countResult[0]?.count || 0,
    limit,
    offset,
  });
}

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['complete', 'dismiss', 'reopen']),
});

/**
 * PATCH — batch update next step status
 */
export async function PATCH(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  const now = new Date();

  // Verify ownership
  const owned = await db
    .select({ id: nextStepsTable.id })
    .from(nextStepsTable)
    .where(and(inArray(nextStepsTable.id, ids), eq(nextStepsTable.userId, userId)));

  const ownedIds = owned.map((r) => r.id);
  if (ownedIds.length === 0) {
    return NextResponse.json({ error: 'No matching steps found' }, { status: 404 });
  }

  switch (action) {
    case 'complete':
      await db
        .update(nextStepsTable)
        .set({ status: 'completed', completedAt: now, updatedAt: now })
        .where(inArray(nextStepsTable.id, ownedIds));
      // Fire-and-forget CRM sync — don't block the response
      syncCompletedNextStepsToCRM(userId, ownedIds).catch(() => {});
      break;
    case 'dismiss':
      await db
        .update(nextStepsTable)
        .set({ status: 'dismissed', updatedAt: now })
        .where(inArray(nextStepsTable.id, ownedIds));
      break;
    case 'reopen':
      await db
        .update(nextStepsTable)
        .set({ status: 'pending', completedAt: null, updatedAt: now })
        .where(inArray(nextStepsTable.id, ownedIds));
      break;
  }

  return NextResponse.json({ updated: ownedIds.length, action });
}
