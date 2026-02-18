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

    // Get all Meet connection details
    const connections = await db
      .select({
        id: meetConnections.id,
        googleUserId: meetConnections.googleUserId,
        googleEmail: meetConnections.googleEmail,
        googleDisplayName: meetConnections.googleDisplayName,
        isPrimary: meetConnections.isPrimary,
        connectedAt: meetConnections.connectedAt,
        scopes: meetConnections.scopes,
      })
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id));

    if (connections.length === 0) {
      // User is marked connected but no connection record - inconsistent state
      return NextResponse.json({
        connected: true,
        email: null,
        warning: 'Connection record not found',
      });
    }

    const primary = connections.find(c => c.isPrimary) || connections[0];

    return NextResponse.json({
      connected: true,
      email: primary.googleEmail,
      displayName: primary.googleDisplayName,
      googleUserId: primary.googleUserId,
      connectedAt: primary.connectedAt,
      scopes: primary.scopes?.split(' ') || [],
      connections: connections.map(c => ({
        id: c.id,
        email: c.googleEmail,
        displayName: c.googleDisplayName,
        isPrimary: c.isPrimary,
        connectedAt: c.connectedAt,
      })),
    });
  } catch (error) {
    console.error('[MEET-STATUS] Error checking status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
