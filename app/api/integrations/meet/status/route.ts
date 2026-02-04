/**
 * GET /api/integrations/meet/status
 * Returns Google Meet connection status for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, meetConnections } from '@/lib/db';

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ connected: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Find user by Clerk ID
    const [user] = await db
      .select({
        id: users.id,
        meetConnected: users.meetConnected,
      })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    // If not connected, return early (boolean comparison)
    if (user.meetConnected !== true) {
      return NextResponse.json({ connected: false });
    }

    // Get Meet connection details
    const [connection] = await db
      .select({
        googleUserId: meetConnections.googleUserId,
        googleEmail: meetConnections.googleEmail,
        googleDisplayName: meetConnections.googleDisplayName,
        connectedAt: meetConnections.connectedAt,
        scopes: meetConnections.scopes,
      })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id))
      .limit(1);

    if (!connection) {
      // User is marked connected but no connection record - inconsistent state
      return NextResponse.json({
        connected: true,
        email: null,
        warning: 'Connection record not found',
      });
    }

    return NextResponse.json({
      connected: true,
      email: connection.googleEmail,
      displayName: connection.googleDisplayName,
      googleUserId: connection.googleUserId,
      connectedAt: connection.connectedAt,
      scopes: connection.scopes?.split(' ') || [],
    });
  } catch (error) {
    console.error('[MEET-STATUS] Error checking status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
