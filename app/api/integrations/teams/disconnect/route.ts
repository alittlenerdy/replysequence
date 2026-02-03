/**
 * DELETE /api/integrations/teams/disconnect
 * Disconnects Microsoft Teams for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, teamsConnections } from '@/lib/db';

export async function DELETE() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Find user by Clerk ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Delete Teams connection record
    await db
      .delete(teamsConnections)
      .where(eq(teamsConnections.userId, user.id));

    // Update user's teams_connected flag to false (boolean)
    await db
      .update(users)
      .set({
        teamsConnected: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('[TEAMS-DISCONNECT] Disconnected Teams for user:', {
      clerkUserId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TEAMS-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
