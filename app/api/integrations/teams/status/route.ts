/**
 * GET /api/integrations/teams/status
 * Returns Microsoft Teams connection status for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, teamsConnections } from '@/lib/db';

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
        teamsConnected: users.teamsConnected,
      })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    // If not connected, return early (boolean comparison)
    if (user.teamsConnected !== true) {
      return NextResponse.json({ connected: false });
    }

    // Get Teams connection details
    const [connection] = await db
      .select({
        msUserId: teamsConnections.msUserId,
        msEmail: teamsConnections.msEmail,
        msDisplayName: teamsConnections.msDisplayName,
        connectedAt: teamsConnections.connectedAt,
        scopes: teamsConnections.scopes,
      })
      .from(teamsConnections)
      .where(eq(teamsConnections.userId, user.id))
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
      email: connection.msEmail,
      displayName: connection.msDisplayName,
      msUserId: connection.msUserId,
      connectedAt: connection.connectedAt,
      scopes: connection.scopes?.split(' ') || [],
    });
  } catch (error) {
    console.error('[TEAMS-STATUS] Error checking status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
