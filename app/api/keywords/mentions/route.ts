/**
 * Keyword Mentions API — recent keyword mentions across meetings
 *
 * GET /api/keywords/mentions — returns recent keyword mentions with meeting context
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, trackedKeywords, keywordMentions, meetings } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch recent mentions for all of this user's tracked keywords
  const rows = await db
    .select({
      id: keywordMentions.id,
      keyword: trackedKeywords.keyword,
      category: trackedKeywords.category,
      meetingTopic: meetings.topic,
      meetingDate: meetings.startTime,
      context: keywordMentions.context,
      speakerName: keywordMentions.speakerName,
      createdAt: keywordMentions.createdAt,
    })
    .from(keywordMentions)
    .innerJoin(trackedKeywords, eq(trackedKeywords.id, keywordMentions.keywordId))
    .innerJoin(meetings, eq(meetings.id, keywordMentions.meetingId))
    .where(eq(trackedKeywords.userId, userId))
    .orderBy(desc(keywordMentions.createdAt))
    .limit(50);

  const mentions = rows.map(r => ({
    id: r.id,
    keyword: r.keyword,
    category: r.category,
    meetingTopic: r.meetingTopic,
    meetingDate: r.meetingDate?.toISOString() || null,
    context: r.context,
    speakerName: r.speakerName,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ mentions });
}
