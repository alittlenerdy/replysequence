/**
 * DELETE /api/integrations/hubspot/disconnect
 * Disconnects HubSpot CRM for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, hubspotConnections, salesforceConnections, sheetsConnections, userOnboarding } from '@/lib/db';

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

    // Delete HubSpot connection record
    await db
      .delete(hubspotConnections)
      .where(eq(hubspotConnections.userId, user.id));

    // Check if any CRM connections remain; if not, reset onboarding crmConnected flag
    const [remainingSf, remainingSheets] = await Promise.all([
      db.select({ id: salesforceConnections.id }).from(salesforceConnections).where(eq(salesforceConnections.userId, user.id)).limit(1),
      db.select({ id: sheetsConnections.id }).from(sheetsConnections).where(eq(sheetsConnections.userId, user.id)).limit(1),
    ]);

    if (remainingSf.length === 0 && remainingSheets.length === 0) {
      await db
        .update(userOnboarding)
        .set({ crmConnected: false, updatedAt: new Date() })
        .where(eq(userOnboarding.clerkId, clerkUserId));
    }

    console.log('[HUBSPOT-DISCONNECT] Disconnected HubSpot for user:', {
      clerkUserId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HUBSPOT-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
