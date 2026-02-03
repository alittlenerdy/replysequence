/**
 * GET /api/integrations/zoom/status
 * Returns Zoom connection status for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, zoomConnections } from '@/lib/db';

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
        zoomConnected: users.zoomConnected,
      })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    // If not connected, return early
    if (user.zoomConnected !== 'true') {
      return NextResponse.json({ connected: false });
    }

    // Get Zoom connection details
    const [connection] = await db
      .select({
        zoomUserId: zoomConnections.zoomUserId,
        zoomEmail: zoomConnections.zoomEmail,
        connectedAt: zoomConnections.connectedAt,
        scopes: zoomConnections.scopes,
      })
      .from(zoomConnections)
      .where(eq(zoomConnections.userId, user.id))
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
      email: connection.zoomEmail,
      zoomUserId: connection.zoomUserId,
      connectedAt: connection.connectedAt,
      scopes: connection.scopes?.split(' ') || [],
    });
  } catch (error) {
    console.error('[ZOOM-STATUS] Error checking status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
