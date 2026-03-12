/**
 * Individual Briefing API
 *
 * GET    /api/briefings/:id — get a single briefing
 * PATCH  /api/briefings/:id — mark as viewed
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, preMeetingBriefings, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ briefingId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { briefingId } = await params;

  const [briefing] = await db
    .select()
    .from(preMeetingBriefings)
    .where(
      and(
        eq(preMeetingBriefings.id, briefingId),
        eq(preMeetingBriefings.userId, userId)
      )
    )
    .limit(1);

  if (!briefing) {
    return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
  }

  return NextResponse.json({ briefing });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ briefingId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { briefingId } = await params;

  // Mark as viewed
  const [updated] = await db
    .update(preMeetingBriefings)
    .set({
      viewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(preMeetingBriefings.id, briefingId),
        eq(preMeetingBriefings.userId, userId)
      )
    )
    .returning({ id: preMeetingBriefings.id });

  if (!updated) {
    return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
