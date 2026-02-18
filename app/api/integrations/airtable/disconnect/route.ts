/**
 * DELETE /api/integrations/airtable/disconnect
 * Disconnects Airtable CRM for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, airtableConnections } from '@/lib/db';

export async function DELETE() {
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

    await db
      .delete(airtableConnections)
      .where(eq(airtableConnections.userId, user.id));

    console.log(JSON.stringify({
      level: 'info',
      message: 'Airtable disconnected',
      userId: user.id,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AIRTABLE-DISCONNECT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
