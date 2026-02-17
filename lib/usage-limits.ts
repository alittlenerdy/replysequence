/**
 * Usage limit enforcement for free tier users.
 * Free tier: 5 AI drafts per calendar month.
 * Pro/Team/Agency: unlimited.
 */

import { db, users, usageLogs, meetings } from './db';
import { eq, and, sql, gte } from 'drizzle-orm';
import type { SubscriptionTier } from './db/schema';

/** Monthly draft limits per tier */
const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  pro: Infinity,
  team: Infinity,
  agency: Infinity,
};

export interface UsageCheckResult {
  allowed: boolean;
  tier: SubscriptionTier;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Check if a user can generate a draft based on their subscription tier.
 * Counts drafts generated in the current calendar month.
 */
export async function checkDraftLimit(userId: string): Promise<UsageCheckResult> {
  // Get user's subscription tier
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const tier: SubscriptionTier = user?.subscriptionTier || 'free';
  const limit = TIER_LIMITS[tier];

  // Paid tiers have no limit
  if (limit === Infinity) {
    return { allowed: true, tier, used: 0, limit: -1, remaining: -1 };
  }

  // Count drafts generated this calendar month via usage_logs
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        eq(usageLogs.action, 'draft_generated'),
        gte(usageLogs.createdAt, startOfMonth)
      )
    );

  const used = Number(result?.count || 0);
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    tier,
    used,
    limit,
    remaining,
  };
}

/**
 * Log a usage event (call after successful draft generation).
 */
export async function logUsage(
  userId: string,
  action: 'draft_generated' | 'meeting_processed' | 'email_sent',
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.insert(usageLogs).values({
    userId,
    action,
    metadata: metadata || null,
  });
}

/**
 * Get the user ID from a meeting ID (for webhook-based draft generation).
 */
export async function getUserIdFromMeeting(meetingId: string): Promise<string | null> {
  const [meeting] = await db
    .select({ userId: meetings.userId })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  return meeting?.userId || null;
}
