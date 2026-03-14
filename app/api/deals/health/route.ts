/**
 * Deal Health Dashboard API
 *
 * GET /api/deals/health — returns all deals with health scores for the dashboard widget
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, dealContexts } from '@/lib/db';
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
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const deals = await db
    .select({
      id: dealContexts.id,
      companyName: dealContexts.companyName,
      companyDomain: dealContexts.companyDomain,
      dealStage: dealContexts.dealStage,
      dealHealthScore: dealContexts.dealHealthScore,
      meetingCount: dealContexts.meetingCount,
      signalCount: dealContexts.signalCount,
      lastMeetingAt: dealContexts.lastMeetingAt,
      risks: dealContexts.risks,
      nextSteps: dealContexts.nextSteps,
      stakeholders: dealContexts.stakeholders,
      commitments: dealContexts.commitments,
    })
    .from(dealContexts)
    .where(eq(dealContexts.userId, userId))
    .orderBy(desc(dealContexts.lastMeetingAt))
    .limit(30);

  // Compute aggregates
  const withScores = deals.filter((d) => d.dealHealthScore !== null);
  const avgScore = withScores.length > 0
    ? Math.round(withScores.reduce((sum, d) => sum + (d.dealHealthScore ?? 0), 0) / withScores.length)
    : null;

  const byLabel = { critical: 0, at_risk: 0, neutral: 0, healthy: 0, strong: 0 };
  for (const d of withScores) {
    const s = d.dealHealthScore ?? 50;
    if (s <= 20) byLabel.critical++;
    else if (s <= 40) byLabel.at_risk++;
    else if (s <= 60) byLabel.neutral++;
    else if (s <= 80) byLabel.healthy++;
    else byLabel.strong++;
  }

  return NextResponse.json({
    deals: deals.map((d) => ({
      id: d.id,
      companyName: d.companyName,
      companyDomain: d.companyDomain,
      dealStage: d.dealStage,
      healthScore: d.dealHealthScore,
      meetingCount: d.meetingCount,
      signalCount: d.signalCount,
      lastMeetingAt: d.lastMeetingAt,
      riskCount: ((d.risks as string[]) || []).length,
      nextStepCount: ((d.nextSteps as string[]) || []).length,
      stakeholderCount: ((d.stakeholders as string[]) || []).length,
      commitmentCount: ((d.commitments as string[]) || []).length,
    })),
    totalDeals: deals.length,
    dealsWithScores: withScores.length,
    avgScore,
    byLabel,
  });
}
