/**
 * CRM Recent Updates API
 *
 * GET /api/crm/recent-updates — returns recent crm-auto-populate agent actions
 * with their metadata (dealStage, closeProbability, fields updated, etc.)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, agentActions, users, meetings } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ updates: [] });
  }

  // Query recent crm-auto-populate actions with success status
  const recentActions = await db
    .select({
      id: agentActions.id,
      meetingId: agentActions.meetingId,
      description: agentActions.description,
      metadata: agentActions.metadata,
      createdAt: agentActions.createdAt,
      status: agentActions.status,
    })
    .from(agentActions)
    .where(
      and(
        eq(agentActions.userId, user.id),
        eq(agentActions.agentName, 'crm-auto-populate'),
        eq(agentActions.status, 'success')
      )
    )
    .orderBy(desc(agentActions.createdAt))
    .limit(10);

  // Fetch meeting topics for each action that has a meetingId
  const meetingIds = recentActions
    .map((a) => a.meetingId)
    .filter((id): id is string => id !== null);

  const meetingTopics = new Map<string, string>();
  if (meetingIds.length > 0) {
    const meetingRows = await db
      .select({ id: meetings.id, topic: meetings.topic })
      .from(meetings)
      .where(
        // Use individual lookups since we have at most 10
        eq(meetings.userId, user.id)
      );

    for (const row of meetingRows) {
      if (meetingIds.includes(row.id) && row.topic) {
        meetingTopics.set(row.id, row.topic);
      }
    }
  }

  const updates = recentActions.map((action) => {
    const meta = (action.metadata ?? {}) as Record<string, unknown>;
    return {
      id: action.id,
      meetingTopic: action.meetingId ? meetingTopics.get(action.meetingId) ?? 'Unknown Meeting' : 'Unknown Meeting',
      dealStage: (meta.dealStage as string) ?? null,
      closeProbability: (meta.closeProbability as number) ?? null,
      crmSynced: (meta.crmSynced as boolean) ?? false,
      hubspot: (meta.hubspot as boolean) ?? false,
      salesforce: (meta.salesforce as boolean) ?? false,
      timestamp: action.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ updates });
}
