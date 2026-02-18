/**
 * GET /api/integrations/airtable/status
 * Returns current Airtable connection status for the authenticated user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, airtableConnections } from '@/lib/db';

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
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

    const connection = await db.query.airtableConnections.findFirst({
      where: eq(airtableConnections.userId, user.id),
      columns: {
        id: true,
        baseId: true,
        contactsTable: true,
        meetingsTable: true,
        connectedAt: true,
        lastSyncAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: true,
      baseId: connection.baseId,
      contactsTable: connection.contactsTable,
      meetingsTable: connection.meetingsTable,
      connectedAt: connection.connectedAt,
      lastSyncAt: connection.lastSyncAt,
    });
  } catch (error) {
    console.error('[AIRTABLE-STATUS] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
