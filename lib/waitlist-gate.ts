import { clerkClient } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Admit a user through the waitlist gate.
 * Sets admittedAt in the DB and updates Clerk publicMetadata so middleware
 * can check admission without a DB query.
 *
 * Safe to call multiple times — no-ops if already admitted.
 */
export async function admitUser(clerkId: string): Promise<void> {
  // Check if already admitted to avoid unnecessary writes
  const [user] = await db
    .select({ admittedAt: users.admittedAt })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user || user.admittedAt) {
    return; // Already admitted or user not found
  }

  const now = new Date();

  // Update DB
  await db
    .update(users)
    .set({ admittedAt: now, updatedAt: now })
    .where(eq(users.clerkId, clerkId));

  // Update Clerk publicMetadata so middleware can check without DB query
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: { admitted: true },
    });
  } catch (error) {
    // Non-critical: the DB is the source of truth. Clerk metadata is a cache optimization.
    console.error('[WAITLIST-GATE] Failed to update Clerk metadata:', error);
  }

  console.log('[WAITLIST-GATE] User auto-admitted via platform connect:', clerkId);
}
