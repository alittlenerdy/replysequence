/**
 * Google Sheets Disconnect Route
 * Removes user's Sheets connection
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { sheetsConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE() {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db
      .delete(sheetsConnections)
      .where(eq(sheetsConnections.userId, user.id));

    console.log('[SHEETS-DISCONNECT] Disconnected', { clerkId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SHEETS-DISCONNECT] Error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
