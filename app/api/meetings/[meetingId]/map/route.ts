/**
 * GET /api/meetings/[meetingId]/map
 *   Returns the MAP for a meeting (JSON, markdown, plain text).
 *
 * POST /api/meetings/[meetingId]/map
 *   Generates a new MAP from the meeting's extracted signals.
 *
 * Used by the dashboard MAP review surface and E2E validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, meetings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getMapForMeeting } from '@/lib/map/store';
import { generateMap } from '@/lib/map/generate';
import { toJson, toMarkdown, toPlainText } from '@/lib/map/export';

async function verifyMeetingOwnership(meetingId: string, userId: string) {
  const [meeting] = await db
    .select({ id: meetings.id, userId: meetings.userId, topic: meetings.topic })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) return { error: 'Meeting not found', status: 404 };
  if (meeting.userId !== userId) return { error: 'Forbidden', status: 403 };
  return { meeting };
}

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
    const ownership = await verifyMeetingOwnership(meetingId, user.id);
    if ('error' in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    const map = await getMapForMeeting(meetingId);

    if (!map) {
      return NextResponse.json({ exists: false, meetingId }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      meetingId,
      json: toJson(map, map.steps),
      markdown: toMarkdown(map, map.steps),
      plainText: toPlainText(map, map.steps),
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[MAP-API]',
      message: 'Failed to fetch MAP',
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Failed to fetch MAP' }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;

  try {
    const ownership = await verifyMeetingOwnership(meetingId, user.id);
    if ('error' in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    const result = await generateMap({
      meetingId,
      meetingTopic: ownership.meeting.topic || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        error: 'MAP generation failed',
        detail: result.error,
      }, { status: 500 });
    }

    if (result.stepCount === 0) {
      return NextResponse.json({
        generated: false,
        reason: 'No actionable signals found for MAP generation',
        meetingId,
      });
    }

    return NextResponse.json({
      generated: true,
      mapId: result.mapId,
      title: result.title,
      summary: result.summary,
      stepCount: result.stepCount,
      commitmentSteps: result.commitmentSteps,
      recommendedSteps: result.recommendedSteps,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[MAP-API]',
      message: 'MAP generation failed',
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'MAP generation failed' }, { status: 500 });
  }
}
