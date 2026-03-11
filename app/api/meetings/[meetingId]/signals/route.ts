/**
 * GET /api/meetings/[meetingId]/signals
 *
 * Returns all extracted signals for a meeting.
 * Used by the dashboard signal review surface and debug tooling.
 * Requires authentication — scoped to the meeting owner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, meetings } from '@/lib/db';
import { signals } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;

  try {
    // Verify meeting belongs to the authenticated user
    const [meeting] = await db
      .select({ id: meetings.id, userId: meetings.userId })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch signals ordered by confidence (highest first)
    const meetingSignals = await db
      .select()
      .from(signals)
      .where(eq(signals.meetingId, meetingId))
      .orderBy(desc(signals.confidence));

    // Group by type for the review surface
    const byType: Record<string, typeof meetingSignals> = {};
    for (const signal of meetingSignals) {
      const type = signal.type;
      if (!byType[type]) byType[type] = [];
      byType[type].push(signal);
    }

    return NextResponse.json({
      meetingId,
      signalCount: meetingSignals.length,
      signals: meetingSignals,
      byType,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[SIGNALS-API]',
      message: 'Failed to fetch signals',
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 },
    );
  }
}
