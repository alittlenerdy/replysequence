/**
 * POST /api/meetings/[meetingId]/pipeline-stage
 *
 * Runs AI pipeline stage detection on a meeting's transcript/summary.
 * Stores the result in the associated deal context record.
 *
 * GET /api/meetings/[meetingId]/pipeline-stage
 *
 * Returns the current pipeline stage for the meeting's deal context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { meetings, dealContexts, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { detectPipelineStage } from '@/lib/agents/detect-pipeline-stage';
import type { DealStage } from '@/lib/db/schema';
import { PIPELINE_STAGES } from '@/lib/agents/detect-pipeline-stage';

async function resolveUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;

  try {
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify meeting ownership
    const [meeting] = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Look up deal context for this meeting
    const [dealContext] = await db
      .select({
        id: dealContexts.id,
        dealStage: dealContexts.dealStage,
        companyName: dealContexts.companyName,
      })
      .from(dealContexts)
      .where(eq(dealContexts.lastMeetingId, meetingId))
      .limit(1);

    return NextResponse.json({
      meetingId,
      dealContextId: dealContext?.id ?? null,
      stage: dealContext?.dealStage ?? null,
      companyName: dealContext?.companyName ?? null,
      stages: PIPELINE_STAGES,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[PIPELINE-STAGE-API]',
      message: 'Failed to fetch pipeline stage',
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stage' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;

  try {
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if this is a manual override
    const body = await request.json().catch(() => ({}));

    if (body.manualStage) {
      // Manual override — validate stage
      const manualStage = body.manualStage as string;
      if (!PIPELINE_STAGES.includes(manualStage as DealStage)) {
        return NextResponse.json(
          { error: `Invalid stage. Must be one of: ${PIPELINE_STAGES.join(', ')}` },
          { status: 400 },
        );
      }

      // Find deal context for this meeting
      const [dealContext] = await db
        .select({ id: dealContexts.id, dealStage: dealContexts.dealStage })
        .from(dealContexts)
        .where(eq(dealContexts.lastMeetingId, meetingId))
        .limit(1);

      if (!dealContext) {
        return NextResponse.json(
          { error: 'No deal context found for this meeting' },
          { status: 404 },
        );
      }

      const previousStage = dealContext.dealStage;

      await db
        .update(dealContexts)
        .set({
          dealStage: manualStage as DealStage,
          updatedAt: new Date(),
        })
        .where(eq(dealContexts.id, dealContext.id));

      return NextResponse.json({
        meetingId,
        stage: manualStage,
        confidence: 1.0,
        signals: ['Manually set by user'],
        previousStage,
        source: 'manual',
      });
    }

    // AI detection
    const result = await detectPipelineStage(meetingId, userId, {
      updateDealContext: true,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Stage detection failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      meetingId,
      stage: result.stage,
      confidence: result.confidence,
      signals: result.signals,
      previousStage: result.previousStage,
      source: 'ai',
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[PIPELINE-STAGE-API]',
      message: 'Stage detection failed',
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stage detection failed' },
      { status: 500 },
    );
  }
}
