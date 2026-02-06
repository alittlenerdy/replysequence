import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, meetEventSubscriptions } from '@/lib/db';
import { eq, and, lt } from 'drizzle-orm';
import { getValidMeetToken } from '@/lib/meet-token';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Workspace Events API endpoint
const EVENTS_API_BASE = 'https://workspaceevents.googleapis.com/v1';

/**
 * Structured logging helper
 */
function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'meet-renew',
      ...data,
    })
  );
}

interface RenewalResponse {
  name: string;
  expireTime: string;
  state: string;
}

/**
 * POST /api/meet/renew-subscription
 * Renews the user's Workspace Events subscription to maximum TTL
 */
export async function POST() {
  const startTime = Date.now();

  try {
    // Authenticate user
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log('info', '[MEET-RENEW-1] Starting subscription renewal', { clerkId });

    // Get user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(meetEventSubscriptions)
      .where(eq(meetEventSubscriptions.userId, user.id))
      .limit(1);

    if (!subscription) {
      log('warn', '[MEET-RENEW-2] No subscription found', { userId: user.id });
      return NextResponse.json(
        { error: 'No subscription found. Create one first.' },
        { status: 404 }
      );
    }

    log('info', '[MEET-RENEW-2] Found subscription', {
      subscriptionName: subscription.subscriptionName,
      currentExpireTime: subscription.expireTime,
    });

    // Get valid access token
    const accessToken = await getValidMeetToken(user.id);

    if (!accessToken) {
      log('error', '[MEET-RENEW-3] Failed to get access token', { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to get valid access token' },
        { status: 401 }
      );
    }

    log('info', '[MEET-RENEW-3] Token obtained');

    // Call PATCH to renew subscription with ttl: "0" (maximum)
    const response = await fetch(
      `${EVENTS_API_BASE}/${subscription.subscriptionName}?updateMask=ttl`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: '0' }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log('error', '[MEET-RENEW-4] Renewal API call failed', {
        status: response.status,
        error: errorText,
      });

      // Update failure count
      await db
        .update(meetEventSubscriptions)
        .set({
          renewalFailures: subscription.renewalFailures + 1,
          lastError: `Renewal failed: ${response.status} - ${errorText}`,
          updatedAt: new Date(),
        })
        .where(eq(meetEventSubscriptions.id, subscription.id));

      if (response.status === 404) {
        // Subscription was deleted, mark as expired
        await db
          .update(meetEventSubscriptions)
          .set({
            status: 'expired',
            lastError: 'Subscription not found - may have expired',
            updatedAt: new Date(),
          })
          .where(eq(meetEventSubscriptions.id, subscription.id));

        return NextResponse.json(
          { error: 'Subscription expired. Please create a new one.' },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to renew subscription' },
        { status: response.status }
      );
    }

    const renewalData: RenewalResponse = await response.json();

    log('info', '[MEET-RENEW-4] Subscription renewed', {
      newExpireTime: renewalData.expireTime,
    });

    // Update database
    const newExpireTime = new Date(renewalData.expireTime);

    await db
      .update(meetEventSubscriptions)
      .set({
        expireTime: newExpireTime,
        lastRenewedAt: new Date(),
        renewalFailures: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(meetEventSubscriptions.id, subscription.id));

    log('info', '[MEET-RENEW-5] Database updated', {
      subscriptionName: subscription.subscriptionName,
      newExpireTime: newExpireTime.toISOString(),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        name: subscription.subscriptionName,
        expireTime: renewalData.expireTime,
        state: renewalData.state,
      },
    });
  } catch (error) {
    log('error', '[MEET-RENEW-ERROR] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Internal function to renew subscription for a specific user
 * Used by cron jobs and lifecycle event handlers
 */
export async function renewSubscriptionForUser(
  userId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; newExpireTime?: Date }> {
  try {
    const [subscription] = await db
      .select()
      .from(meetEventSubscriptions)
      .where(eq(meetEventSubscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      return { success: false, error: 'No subscription found' };
    }

    const response = await fetch(
      `${EVENTS_API_BASE}/${subscription.subscriptionName}?updateMask=ttl`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: '0' }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      await db
        .update(meetEventSubscriptions)
        .set({
          renewalFailures: subscription.renewalFailures + 1,
          lastError: `Renewal failed: ${response.status}`,
          updatedAt: new Date(),
        })
        .where(eq(meetEventSubscriptions.id, subscription.id));

      return { success: false, error: errorText };
    }

    const renewalData: RenewalResponse = await response.json();
    const newExpireTime = new Date(renewalData.expireTime);

    await db
      .update(meetEventSubscriptions)
      .set({
        expireTime: newExpireTime,
        lastRenewedAt: new Date(),
        renewalFailures: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(meetEventSubscriptions.id, subscription.id));

    return { success: true, newExpireTime };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
