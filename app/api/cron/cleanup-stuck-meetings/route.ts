/**
 * Cron Job: Cleanup Stuck Meetings
 * Detects meetings stuck in 'processing' or 'pending' for >15 minutes
 * and marks them as failed so users can see the error and retry.
 *
 * Schedule: Every 5 minutes (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { and, inArray, lt, sql } from 'drizzle-orm';
import { failProcessing } from '@/lib/processing-progress';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const STUCK_THRESHOLD_MINUTES = 15;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

    // Find meetings stuck in processing/pending states
    const stuckMeetings = await db
      .select({
        id: meetings.id,
        status: meetings.status,
        processingStep: meetings.processingStep,
        processingStartedAt: meetings.processingStartedAt,
        createdAt: meetings.createdAt,
        topic: meetings.topic,
      })
      .from(meetings)
      .where(
        and(
          inArray(meetings.status, ['processing', 'pending']),
          // Use processingStartedAt if available, fall back to createdAt
          sql`COALESCE(${meetings.processingStartedAt}, ${meetings.createdAt}) < ${cutoff}`
        )
      )
      .limit(50);

    if (stuckMeetings.length === 0) {
      return NextResponse.json({ cleaned: 0 });
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[CRON-CLEANUP]',
      message: `Found ${stuckMeetings.length} stuck meetings`,
      meetingIds: stuckMeetings.map(m => m.id),
    }));

    let cleaned = 0;
    for (const meeting of stuckMeetings) {
      const stuckSince = meeting.processingStartedAt || meeting.createdAt;
      const stuckMinutes = Math.round((Date.now() - stuckSince.getTime()) / 60000);
      const lastStep = meeting.processingStep || 'unknown';

      await failProcessing(
        meeting.id,
        `Processing timed out after ${stuckMinutes} minutes (stuck at step: ${lastStep}). This usually means the recording wasn't available yet — try retrying.`
      );
      cleaned++;

      console.log(JSON.stringify({
        level: 'warn',
        tag: '[CRON-CLEANUP]',
        message: 'Marked stuck meeting as failed',
        meetingId: meeting.id,
        topic: meeting.topic,
        stuckMinutes,
        lastStep,
      }));
    }

    return NextResponse.json({ cleaned, total: stuckMeetings.length });
  } catch (error) {
    console.error('[CRON-CLEANUP] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
