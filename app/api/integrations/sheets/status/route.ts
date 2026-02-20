/**
 * Google Sheets Status Route
 * Returns connection status and configuration
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { sheetsConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const connection = await db.query.sheetsConnections.findFirst({
      where: eq(sheetsConnections.userId, user.id),
      columns: {
        googleEmail: true,
        googleDisplayName: true,
        spreadsheetId: true,
        spreadsheetName: true,
        sheetTab: true,
        columnMappings: true,
        lastSyncAt: true,
        connectedAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: connection.googleEmail,
      displayName: connection.googleDisplayName,
      spreadsheetId: connection.spreadsheetId,
      spreadsheetName: connection.spreadsheetName,
      sheetTab: connection.sheetTab,
      columnMappings: connection.columnMappings,
      lastSyncAt: connection.lastSyncAt,
      connectedAt: connection.connectedAt,
      configured: !!connection.spreadsheetId,
    });
  } catch (err) {
    console.error('[SHEETS-STATUS] Error:', err);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
