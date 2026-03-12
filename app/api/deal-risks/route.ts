/**
 * Deal Risk Alerts API
 *
 * GET /api/deal-risks — get all active deal risks across user's deals
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, dealContexts } from '@/lib/db';
import { eq, and, isNotNull, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

/**
 * Parse risk strings stored as "[severity/category] description"
 */
function parseRiskString(risk: string): {
  severity: string;
  category: string;
  description: string;
} {
  const match = risk.match(/^\[(\w+)\/(\w+)\]\s*(.+)$/);
  if (match) {
    return { severity: match[1], category: match[2], description: match[3] };
  }
  return { severity: 'medium', category: 'process', description: risk };
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch all deal contexts with risks
  const deals = await db
    .select({
      id: dealContexts.id,
      companyName: dealContexts.companyName,
      companyDomain: dealContexts.companyDomain,
      dealStage: dealContexts.dealStage,
      risks: dealContexts.risks,
      dealHealthScore: dealContexts.dealHealthScore,
      lastMeetingAt: dealContexts.lastMeetingAt,
      meetingCount: dealContexts.meetingCount,
    })
    .from(dealContexts)
    .where(
      and(
        eq(dealContexts.userId, userId),
        sql`jsonb_array_length(${dealContexts.risks}) > 0`
      )
    )
    .orderBy(desc(dealContexts.lastMeetingAt))
    .limit(20);

  // Parse and flatten risks with deal context
  const alerts = deals.flatMap((deal) => {
    const risks = (deal.risks || []) as string[];
    return risks.map((riskStr) => {
      const parsed = parseRiskString(riskStr);
      return {
        ...parsed,
        dealContextId: deal.id,
        companyName: deal.companyName,
        companyDomain: deal.companyDomain,
        dealStage: deal.dealStage,
        dealHealthScore: deal.dealHealthScore,
        lastMeetingAt: deal.lastMeetingAt,
      };
    });
  });

  // Sort by severity (critical first)
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return NextResponse.json({
    alerts,
    dealCount: deals.length,
    totalRisks: alerts.length,
    bySeverity: {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    },
  });
}
