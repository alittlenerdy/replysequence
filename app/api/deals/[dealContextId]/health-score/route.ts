/**
 * GET /api/deals/[dealContextId]/health-score
 *   Returns the current health score for a deal context.
 *
 * POST /api/deals/[dealContextId]/health-score
 *   Recalculates the health score from current accumulated context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDealContext, updateHealthScore } from '@/lib/context-store';
import { calculateHealthScore } from '@/lib/health-score/calculate';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dealContextId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dealContextId } = await params;

  try {
    const ctx = await getDealContext(dealContextId);
    if (!ctx) {
      return NextResponse.json({ error: 'Deal context not found' }, { status: 404 });
    }
    if (ctx.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (ctx.dealHealthScore === null) {
      return NextResponse.json({
        exists: false,
        dealContextId,
        message: 'No health score calculated yet. POST to recalculate.',
      });
    }

    return NextResponse.json({
      exists: true,
      dealContextId,
      score: ctx.dealHealthScore,
      companyName: ctx.companyName,
      meetingCount: ctx.meetingCount,
      signalCount: ctx.signalCount,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[HEALTH-SCORE-API]',
      message: 'Failed to fetch health score',
      dealContextId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Failed to fetch health score' }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ dealContextId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dealContextId } = await params;

  try {
    const ctx = await getDealContext(dealContextId);
    if (!ctx) {
      return NextResponse.json({ error: 'Deal context not found' }, { status: 404 });
    }
    if (ctx.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = calculateHealthScore({
      risks: (ctx.risks as string[]) || [],
      nextSteps: (ctx.nextSteps as string[]) || [],
      stakeholders: (ctx.stakeholders as string[]) || [],
      commitments: (ctx.commitments as string[]) || [],
      signalCount: ctx.signalCount,
      meetingCount: ctx.meetingCount,
    });

    await updateHealthScore(dealContextId, result.score);

    return NextResponse.json({
      dealContextId,
      score: result.score,
      label: result.label,
      breakdown: result.breakdown,
      companyName: ctx.companyName,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[HEALTH-SCORE-API]',
      message: 'Health score calculation failed',
      dealContextId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Health score calculation failed' }, { status: 500 });
  }
}
