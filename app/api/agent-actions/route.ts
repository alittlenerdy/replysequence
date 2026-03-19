/**
 * Agent Actions API
 *
 * GET /api/agent-actions — list agent actions for user (AI transparency feed)
 * Query params: meetingId, agentName, status, limit, offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, agentActions, users } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const internalUserId = await getUserId(clerkId);
  if (!internalUserId) {
    return NextResponse.json({ actions: [], total: 0 });
  }

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');
  const agentName = searchParams.get('agentName');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build conditions
  const conditions = [eq(agentActions.userId, internalUserId)];
  if (meetingId) conditions.push(eq(agentActions.meetingId, meetingId));
  if (agentName) conditions.push(eq(agentActions.agentName, agentName));
  if (status === 'success' || status === 'failed') {
    conditions.push(eq(agentActions.status, status));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [actions, countResult] = await Promise.all([
    db
      .select()
      .from(agentActions)
      .where(where)
      .orderBy(desc(agentActions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(agentActions)
      .where(where),
  ]);

  return NextResponse.json({
    actions,
    total: Number(countResult[0]?.count ?? 0),
    limit,
    offset,
  });
}
