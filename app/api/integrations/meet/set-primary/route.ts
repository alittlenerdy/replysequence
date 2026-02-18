/**
 * POST /api/integrations/meet/set-primary
 * Sets a specific Meet connection as the primary connection
 * Body: { connectionId: string }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, users, meetConnections } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { connectionId } = body;

  if (!connectionId) {
    return NextResponse.json({ success: false, error: 'connectionId required' }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify the connection belongs to this user
    const [target] = await db
      .select({ id: meetConnections.id })
      .from(meetConnections)
      .where(and(
        eq(meetConnections.id, connectionId),
        eq(meetConnections.userId, user.id),
      ))
      .limit(1);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
    }

    // Clear all primary flags for this user, then set the target
    await db
      .update(meetConnections)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(meetConnections.userId, user.id));

    await db
      .update(meetConnections)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(meetConnections.id, connectionId));

    console.log('[MEET-SET-PRIMARY] Updated primary connection:', {
      clerkUserId,
      connectionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MEET-SET-PRIMARY] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update primary' },
      { status: 500 }
    );
  }
}
