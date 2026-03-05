import { NextRequest, NextResponse } from 'next/server';
import { db, meetEventSubscriptions, meetConnections } from '@/lib/db';
import { eq, and, lt } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption';
import { renewSubscriptionForUser } from '@/app/api/meet/renew-subscription/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

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
      service: 'cron-renew-meet',
      ...data,
    })
  );
}

/**
 * Refresh access token for a user
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * GET /api/cron/renew-meet-subscriptions
 * Renews all Meet event subscriptions expiring within 48 hours.
 * Runs every 12 hours via Vercel cron.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    log('warn', 'Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log('info', 'Starting Meet subscription renewal check');

  try {
    // Find subscriptions expiring within 48 hours
    const renewalWindow = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const expiringSubscriptions = await db
      .select({
        id: meetEventSubscriptions.id,
        userId: meetEventSubscriptions.userId,
        subscriptionName: meetEventSubscriptions.subscriptionName,
        expireTime: meetEventSubscriptions.expireTime,
        status: meetEventSubscriptions.status,
      })
      .from(meetEventSubscriptions)
      .where(
        and(
          eq(meetEventSubscriptions.status, 'active'),
          lt(meetEventSubscriptions.expireTime, renewalWindow)
        )
      );

    if (expiringSubscriptions.length === 0) {
      log('info', 'No subscriptions need renewal');
      return NextResponse.json({
        success: true,
        renewed: 0,
        duration: Date.now() - startTime,
      });
    }

    log('info', 'Found expiring subscriptions', {
      count: expiringSubscriptions.length,
    });

    let renewed = 0;
    let failed = 0;

    for (const sub of expiringSubscriptions) {
      try {
        // Get user's Meet connection for token refresh
        const [connection] = await db
          .select({
            refreshTokenEncrypted: meetConnections.refreshTokenEncrypted,
          })
          .from(meetConnections)
          .where(eq(meetConnections.userId, sub.userId))
          .limit(1);

        if (!connection) {
          log('warn', 'No Meet connection found for user', {
            userId: sub.userId,
            subscriptionName: sub.subscriptionName,
          });
          failed++;
          continue;
        }

        const refreshToken = decrypt(connection.refreshTokenEncrypted);
        const accessToken = await refreshAccessToken(refreshToken);

        const result = await renewSubscriptionForUser(sub.userId, accessToken);

        if (result.success) {
          renewed++;
          log('info', 'Subscription renewed', {
            userId: sub.userId,
            subscriptionName: sub.subscriptionName,
            newExpireTime: result.newExpireTime?.toISOString(),
          });
        } else {
          failed++;
          log('warn', 'Subscription renewal failed', {
            userId: sub.userId,
            subscriptionName: sub.subscriptionName,
            error: result.error,
          });
        }
      } catch (error) {
        failed++;
        log('error', 'Error renewing subscription', {
          userId: sub.userId,
          subscriptionName: sub.subscriptionName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log('info', 'Meet subscription renewal complete', {
      total: expiringSubscriptions.length,
      renewed,
      failed,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      total: expiringSubscriptions.length,
      renewed,
      failed,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('error', 'Cron failed', { error: errorMsg });

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
