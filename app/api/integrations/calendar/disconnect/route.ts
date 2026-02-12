/**
 * DELETE /api/integrations/calendar/disconnect
 * Disconnects Google Calendar for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, calendarConnections, userOnboarding } from '@/lib/db';

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

    // Delete Calendar connection record
    await db
      .delete(calendarConnections)
      .where(eq(calendarConnections.userId, user.id));

    // Update user_onboarding to mark calendar as disconnected
    await db
      .update(userOnboarding)
      .set({
        calendarConnected: false,
        updatedAt: new Date(),
      })
      .where(eq(userOnboarding.clerkId, clerkUserId));

    console.log('[CALENDAR-DISCONNECT] Disconnected Google Calendar for user:', {
      clerkUserId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
