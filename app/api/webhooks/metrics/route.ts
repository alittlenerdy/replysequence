/**
 * Webhook Metrics API
 * Returns metrics for webhook processing health monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebhookMetrics, getUnresolvedDeadLetters, getWebhooksForRetry } from '@/lib/webhook-retry';

export const dynamic = 'force-dynamic';

/**
 * GET: Get webhook processing metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth header for protected access
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.METRICS_API_KEY;

    // Require API key in production
    if (process.env.NODE_ENV === 'production' && apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [metrics, pendingRetries, unresolvedDeadLetters] = await Promise.all([
      getWebhookMetrics(),
      getWebhooksForRetry(100),
      getUnresolvedDeadLetters(100),
    ]);

    // Calculate health status
    const healthStatus = calculateHealthStatus(metrics);

    return NextResponse.json({
      status: healthStatus,
      metrics,
      pendingRetries: {
        count: pendingRetries.length,
        oldest: pendingRetries[0]?.createdAt || null,
      },
      deadLetterQueue: {
        unresolvedCount: unresolvedDeadLetters.length,
        items: unresolvedDeadLetters.slice(0, 10).map((d) => ({
          id: d.id,
          platform: d.platform,
          eventType: d.eventType,
          totalAttempts: d.totalAttempts,
          error: d.error.substring(0, 100),
          createdAt: d.createdAt,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to fetch webhook metrics',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health status based on metrics
 */
function calculateHealthStatus(metrics: Awaited<ReturnType<typeof getWebhookMetrics>>): 'healthy' | 'degraded' | 'critical' {
  // Critical: Dead letter queue has unresolved items
  if (metrics.deadLetter > 0) {
    return 'critical';
  }

  // Degraded: More than 10 pending retries or high failure rate
  if (metrics.failed > 10) {
    return 'degraded';
  }

  // Calculate failure rate
  if (metrics.total > 0) {
    const failureRate = metrics.failed / metrics.total;
    if (failureRate > 0.1) {
      return 'degraded';
    }
  }

  return 'healthy';
}
