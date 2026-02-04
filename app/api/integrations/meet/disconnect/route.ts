/**
 * DELETE /api/integrations/meet/disconnect
 * Disconnects Google Meet for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, meetConnections } from '@/lib/db';

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

    // Delete Meet connection record
    await db
      .delete(meetConnections)
      .where(eq(meetConnections.userId, user.id));

    // Update user's meet_connected flag to false (boolean)
    await db
      .update(users)
      .set({
        meetConnected: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('[MEET-DISCONNECT] Disconnected Meet for user:', {
      clerkUserId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MEET-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
