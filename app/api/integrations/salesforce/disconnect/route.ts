/**
 * DELETE /api/integrations/salesforce/disconnect
 * Disconnects Salesforce CRM for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, salesforceConnections, hubspotConnections, sheetsConnections, userOnboarding } from '@/lib/db';

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

    // Delete Salesforce connection record
    await db
      .delete(salesforceConnections)
      .where(eq(salesforceConnections.userId, user.id));

    // Check if any CRM connections remain; if not, reset onboarding crmConnected flag
    const [remainingHs, remainingSheets] = await Promise.all([
      db.select({ id: hubspotConnections.id }).from(hubspotConnections).where(eq(hubspotConnections.userId, user.id)).limit(1),
      db.select({ id: sheetsConnections.id }).from(sheetsConnections).where(eq(sheetsConnections.userId, user.id)).limit(1),
    ]);

    if (remainingHs.length === 0 && remainingSheets.length === 0) {
      await db
        .update(userOnboarding)
        .set({ crmConnected: false, updatedAt: new Date() })
        .where(eq(userOnboarding.clerkId, clerkUserId));
    }

    console.log('[SALESFORCE-DISCONNECT] Disconnected Salesforce for user:', {
      clerkUserId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SALESFORCE-DISCONNECT] Error disconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
