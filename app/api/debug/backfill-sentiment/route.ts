/**
 * Debug endpoint to backfill sentiment analysis for existing meetings.
 * Finds all meetings with transcripts but no sentiment data and runs analysis.
 *
 * POST /api/debug/backfill-sentiment
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetings, transcripts, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { analyzeSentiment } from '@/lib/sentiment';

export const maxDuration = 60;

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up internal user ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Find meetings with transcripts but no sentiment
  const meetingsToAnalyze = await db
    .select({
      meetingId: meetings.id,
      topic: meetings.topic,
      transcriptId: transcripts.id,
      speakerSegments: transcripts.speakerSegments,
    })
    .from(meetings)
    .innerJoin(transcripts, eq(transcripts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, user.id),
        isNull(meetings.sentimentAnalysis),
        eq(meetings.status, 'ready'),
      )
    );

  const results: Array<{ meetingId: string; topic: string | null; status: string }> = [];

  for (const m of meetingsToAnalyze) {
    if (!m.speakerSegments || m.speakerSegments.length === 0) {
      results.push({ meetingId: m.meetingId, topic: m.topic, status: 'skipped_no_segments' });
      continue;
    }

    try {
      await analyzeSentiment(m.meetingId, m.speakerSegments);
      results.push({ meetingId: m.meetingId, topic: m.topic, status: 'analyzed' });
    } catch (error) {
      results.push({
        meetingId: m.meetingId,
        topic: m.topic,
        status: `error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return NextResponse.json({
    total: meetingsToAnalyze.length,
    results,
  });
}
