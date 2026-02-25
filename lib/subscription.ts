/**
 * Subscription helpers for grace period and feature gating.
 *
 * During the grace period (7 days after first payment failure), users keep
 * access to paid features even though their subscription status may be
 * past_due. Once Stripe cancels the subscription (or the grace period
 * expires), they are downgraded to the free tier.
 */

/** Number of days a user retains paid access after their first payment failure. */
export const GRACE_PERIOD_DAYS = 7;

interface GracePeriodUser {
  gracePeriodEndsAt: Date | null;
}

interface FeatureGateUser {
  subscriptionTier: string | null;
  gracePeriodEndsAt: Date | null;
}

/**
 * Returns true when the user is inside an active grace period
 * (payment failed, but the deadline has not yet passed).
 */
export function isInGracePeriod(user: GracePeriodUser): boolean {
  if (!user.gracePeriodEndsAt) return false;
  return new Date() < user.gracePeriodEndsAt;
}

/**
 * Returns true when the user should be allowed to use paid features.
 *
 * A user can access paid features if:
 *  1. They are on a paid tier (pro / team / agency), OR
 *  2. They are within a grace period after a payment failure.
 */
export function canAccessPaidFeatures(user: FeatureGateUser): boolean {
  if (user.subscriptionTier && user.subscriptionTier !== 'free') return true;
  return isInGracePeriod(user);
}

/**
 * Compute the grace period end timestamp (7 days from now).
 */
export function computeGracePeriodEnd(): Date {
  const end = new Date();
  end.setDate(end.getDate() + GRACE_PERIOD_DAYS);
  return end;
}
