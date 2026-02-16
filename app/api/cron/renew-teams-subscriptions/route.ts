/**
 * Cron: Renew Teams Graph API Subscriptions
 *
 * Runs daily to renew any Teams subscriptions expiring within 24 hours.
 * Graph subscriptions for online meeting transcripts expire after ~3 days,
 * so we renew them every day to stay safely ahead.
 */

import { NextResponse } from 'next/server';
import { db, teamsConnections } from '@/lib/db';
import { lt, isNotNull, eq } from 'drizzle-orm';
import { renewTeamsSubscription } from '@/lib/teams-api';
import { getValidTeamsToken } from '@/lib/teams-token';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Find connections with subscriptions expiring within 24 hours
    const renewalThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const expiringConnections = await db
      .select({
        id: teamsConnections.id,
        userId: teamsConnections.userId,
        graphSubscriptionId: teamsConnections.graphSubscriptionId,
        graphSubscriptionExpiresAt: teamsConnections.graphSubscriptionExpiresAt,
      })
      .from(teamsConnections)
      .where(isNotNull(teamsConnections.graphSubscriptionId));

    // Filter to those expiring within 24 hours
    const needsRenewal = expiringConnections.filter(
      (c) => c.graphSubscriptionExpiresAt && c.graphSubscriptionExpiresAt < renewalThreshold
    );

    console.log(`[TEAMS-CRON] Found ${needsRenewal.length} subscriptions to renew out of ${expiringConnections.length} total`);

    let renewed = 0;
    let failed = 0;

    for (const connection of needsRenewal) {
      try {
        const token = await getValidTeamsToken(connection.userId);
        if (!token) {
          console.error(`[TEAMS-CRON] No valid token for user ${connection.userId}`);
          failed++;
          continue;
        }

        const result = await renewTeamsSubscription(token, connection.graphSubscriptionId!);
        if (result) {
          await db
            .update(teamsConnections)
            .set({
              graphSubscriptionExpiresAt: new Date(result.expirationDateTime),
              updatedAt: new Date(),
            })
            .where(eq(teamsConnections.id, connection.id));
          renewed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[TEAMS-CRON] Renewal error for ${connection.id}:`, error);
        failed++;
      }
    }

    console.log(`[TEAMS-CRON] Renewal complete: ${renewed} renewed, ${failed} failed, ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      total: expiringConnections.length,
      needsRenewal: needsRenewal.length,
      renewed,
      failed,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[TEAMS-CRON] Fatal error:', error);
    return NextResponse.json(
      { error: 'Renewal cron failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
