/**
 * Briefings API — list user's pre-meeting briefings
 *
 * GET /api/briefings — list all briefings (optionally filter by calendarEventId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, preMeetingBriefings, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';

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

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const calendarEventId = searchParams.get('calendarEventId');

  const conditions = [eq(preMeetingBriefings.userId, userId)];
  if (calendarEventId) {
    conditions.push(eq(preMeetingBriefings.calendarEventId, calendarEventId));
  }

  const briefings = await db
    .select()
    .from(preMeetingBriefings)
    .where(and(...conditions))
    .orderBy(desc(preMeetingBriefings.meetingStartTime))
    .limit(20);

  return NextResponse.json({ briefings });
}
