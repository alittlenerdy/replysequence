/**
 * Deals at Risk API
 *
 * GET /api/deals/at-risk — returns deals with health score below 40
 * Joins with latest meeting to get last meeting date and top risk signal.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, dealContexts, users } from '@/lib/db';
import { eq, and, lt, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function scoreToLabel(score: number): string {
  if (score <= 20) return 'critical';
  if (score <= 40) return 'at_risk';
  if (score <= 60) return 'neutral';
  if (score <= 80) return 'healthy';
  return 'strong';
}

/**
 * Extract the top risk signal from a deal's risks array.
 * Risks are formatted as "[severity/category] description".
 * Returns the highest-severity risk description, or null.
 */
function extractTopRisk(risks: string[]): string | null {
  if (!risks || risks.length === 0) return null;

  const severityOrder = ['critical', 'high', 'medium', 'low'];

  for (const severity of severityOrder) {
    const match = risks.find((r) => r.toLowerCase().startsWith(`[${severity}/`));
    if (match) {
      // Strip the "[severity/category] " prefix
      const descMatch = match.match(/^\[\w+\/\w+\]\s*(.+)/);
      return descMatch ? descMatch[1] : match;
    }
  }

  // Fallback: return first risk as-is
  return risks[0];
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve internal user ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ deals: [] });
  }

  // Query deal contexts with health score < 40
  const atRiskDeals = await db
    .select({
      id: dealContexts.id,
      companyName: dealContexts.companyName,
      healthScore: dealContexts.dealHealthScore,
      lastMeetingAt: dealContexts.lastMeetingAt,
      risks: dealContexts.risks,
      dealStage: dealContexts.dealStage,
    })
    .from(dealContexts)
    .where(
      and(
        eq(dealContexts.userId, user.id),
        lt(dealContexts.dealHealthScore, 40)
      )
    )
    .orderBy(desc(dealContexts.dealHealthScore))
    .limit(5);

  const deals = atRiskDeals.map((deal) => ({
    dealContextId: deal.id,
    companyName: deal.companyName,
    healthScore: deal.healthScore ?? 0,
    healthLabel: scoreToLabel(deal.healthScore ?? 0),
    lastMeetingDate: deal.lastMeetingAt?.toISOString() ?? null,
    topRiskSignal: extractTopRisk((deal.risks as string[]) ?? []),
    dealStage: deal.dealStage,
  }));

  return NextResponse.json({ deals });
}
