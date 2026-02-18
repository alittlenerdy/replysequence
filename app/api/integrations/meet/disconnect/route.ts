/**
 * DELETE /api/integrations/meet/disconnect
 * Disconnects Google Meet for the current user
 * Supports ?connectionId=xxx to disconnect a specific connection
 * Without connectionId, disconnects ALL Meet connections
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, users, meetConnections } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const connectionId = request.nextUrl.searchParams.get('connectionId');

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

    if (connectionId) {
      // Delete specific connection (verify it belongs to this user)
      const [deleted] = await db
        .delete(meetConnections)
        .where(and(
          eq(meetConnections.id, connectionId),
          eq(meetConnections.userId, user.id),
        ))
        .returning({ isPrimary: meetConnections.isPrimary });

      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
      }

      // Check if any connections remain
      const remaining = await db
        .select({ id: meetConnections.id, isPrimary: meetConnections.isPrimary })
        .from(meetConnections)
        .where(eq(meetConnections.userId, user.id));

      if (remaining.length === 0) {
        // No connections left - set meetConnected to false
        await db
          .update(users)
          .set({ meetConnected: false, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      } else if (deleted.isPrimary && !remaining.some(c => c.isPrimary)) {
        // Deleted the primary - promote the first remaining connection
        await db
          .update(meetConnections)
          .set({ isPrimary: true, updatedAt: new Date() })
          .where(eq(meetConnections.id, remaining[0].id));
      }

      console.log('[MEET-DISCONNECT] Disconnected specific Meet connection:', {
        clerkUserId,
        connectionId,
        remainingCount: remaining.length,
      });
    } else {
      // Delete ALL Meet connections for this user
      await db
        .delete(meetConnections)
        .where(eq(meetConnections.userId, user.id));

      await db
        .update(users)
        .set({ meetConnected: false, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      console.log('[MEET-DISCONNECT] Disconnected all Meet connections for user:', {
        clerkUserId,
        userId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MEET-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
