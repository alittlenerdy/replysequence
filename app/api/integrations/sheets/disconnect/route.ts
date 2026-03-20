/**
 * Google Sheets Disconnect Route
 * Removes user's Sheets connection
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { sheetsConnections, hubspotConnections, salesforceConnections, userOnboarding } from '@/lib/db/schema';
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

    // Check if any CRM connections remain; if not, reset onboarding crmConnected flag
    const [remainingHs, remainingSf] = await Promise.all([
      db.select({ id: hubspotConnections.id }).from(hubspotConnections).where(eq(hubspotConnections.userId, user.id)).limit(1),
      db.select({ id: salesforceConnections.id }).from(salesforceConnections).where(eq(salesforceConnections.userId, user.id)).limit(1),
    ]);

    if (remainingHs.length === 0 && remainingSf.length === 0) {
      await db
        .update(userOnboarding)
        .set({ crmConnected: false, updatedAt: new Date() })
        .where(eq(userOnboarding.clerkId, clerkId));
    }

    console.log('[SHEETS-DISCONNECT] Disconnected', { clerkId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SHEETS-DISCONNECT] Error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
