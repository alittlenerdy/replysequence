import { NextResponse } from 'next/server';
import { db, webhookFailures, deadLetterQueue, rawEvents } from '@/lib/db';
import { eq, gte, sql, and } from 'drizzle-orm';
import { isMeetConfigured } from '@/lib/meet-api';

export const dynamic = 'force-dynamic';

interface WebhookHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  platforms: {
    zoom: PlatformHealth;
    meet: PlatformHealth;
    teams: PlatformHealth;
  };
  failures: {
    pending: number;
    retrying: number;
    deadLetter: number;
  };
  recentEvents: {
    last24h: number;
    last7d: number;
  };
}

interface PlatformHealth {
  configured: boolean;
  recentEvents: number;
  failureRate: number; // percentage
}

/**
 * Health check endpoint for webhook monitoring
 * Returns overall health status and per-platform metrics
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Query failure counts
    const [pendingFailures] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookFailures)
      .where(eq(webhookFailures.status, 'pending'));

    const [retryingFailures] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookFailures)
      .where(eq(webhookFailures.status, 'retrying'));

    const [deadLetterCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deadLetterQueue)
      .where(eq(deadLetterQueue.resolved, 'false'));

    // Query recent events
    const [events24h] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rawEvents)
      .where(gte(rawEvents.receivedAt, twentyFourHoursAgo));

    const [events7d] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rawEvents)
      .where(gte(rawEvents.receivedAt, sevenDaysAgo));

    // Get per-platform event counts (last 24h)
    const platformEvents = await db
      .select({
        eventType: rawEvents.eventType,
        count: sql<number>`count(*)`,
      })
      .from(rawEvents)
      .where(gte(rawEvents.receivedAt, twentyFourHoursAgo))
      .groupBy(rawEvents.eventType);

    // Categorize events by platform
    let zoomEvents = 0;
    let meetEvents = 0;
    let teamsEvents = 0;

    for (const row of platformEvents) {
      const eventType = row.eventType.toLowerCase();
      if (eventType.includes('zoom') || eventType.includes('recording') || eventType.includes('recording.completed')) {
        zoomEvents += Number(row.count);
      } else if (eventType.includes('meet') || eventType.includes('conference')) {
        meetEvents += Number(row.count);
      } else if (eventType.includes('teams') || eventType.includes('microsoft')) {
        teamsEvents += Number(row.count);
      }
    }

    // Get per-platform failure counts (last 24h)
    const [zoomFailures] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookFailures)
      .where(
        and(
          eq(webhookFailures.platform, 'zoom'),
          gte(webhookFailures.createdAt, twentyFourHoursAgo)
        )
      );

    const [meetFailures] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookFailures)
      .where(
        and(
          eq(webhookFailures.platform, 'google_meet'),
          gte(webhookFailures.createdAt, twentyFourHoursAgo)
        )
      );

    const [teamsFailures] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookFailures)
      .where(
        and(
          eq(webhookFailures.platform, 'microsoft_teams'),
          gte(webhookFailures.createdAt, twentyFourHoursAgo)
        )
      );

    // Calculate failure rates
    const calculateFailureRate = (events: number, failures: number) => {
      if (events === 0) return 0;
      return Math.round((failures / (events + failures)) * 100);
    };

    // Check platform configurations
    const zoomConfigured = !!(process.env.ZOOM_WEBHOOK_SECRET);
    const meetConfigured = isMeetConfigured();
    const teamsConfigured = !!(process.env.TEAMS_WEBHOOK_SECRET);

    // Build platform health
    const platformHealth = {
      zoom: {
        configured: zoomConfigured,
        recentEvents: zoomEvents,
        failureRate: calculateFailureRate(zoomEvents, Number(zoomFailures?.count || 0)),
      },
      meet: {
        configured: meetConfigured,
        recentEvents: meetEvents,
        failureRate: calculateFailureRate(meetEvents, Number(meetFailures?.count || 0)),
      },
      teams: {
        configured: teamsConfigured,
        recentEvents: teamsEvents,
        failureRate: calculateFailureRate(teamsEvents, Number(teamsFailures?.count || 0)),
      },
    };

    // Determine overall health status
    const pendingCount = Number(pendingFailures?.count || 0);
    const retryingCount = Number(retryingFailures?.count || 0);
    const deadLetterCountNum = Number(deadLetterCount?.count || 0);

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Degraded if any platform has >10% failure rate or there are pending failures
    if (
      Object.values(platformHealth).some(p => p.failureRate > 10) ||
      pendingCount > 0 ||
      retryingCount > 5
    ) {
      overallStatus = 'degraded';
    }

    // Unhealthy if any platform has >25% failure rate or there are dead letters
    if (
      Object.values(platformHealth).some(p => p.failureRate > 25) ||
      deadLetterCountNum > 0
    ) {
      overallStatus = 'unhealthy';
    }

    const response: WebhookHealthStatus = {
      status: overallStatus,
      timestamp: now.toISOString(),
      platforms: platformHealth,
      failures: {
        pending: pendingCount,
        retrying: retryingCount,
        deadLetter: deadLetterCountNum,
      },
      recentEvents: {
        last24h: Number(events24h?.count || 0),
        last7d: Number(events7d?.count || 0),
      },
    };

    console.log(JSON.stringify({
      level: 'info',
      message: 'Webhook health check completed',
      status: overallStatus,
      duration: Date.now() - startTime,
    }));

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Webhook health check failed',
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    }));

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
