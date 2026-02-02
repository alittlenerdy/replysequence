/**
 * Test Endpoint: Webhook Failure Simulation
 *
 * This endpoint is used to test the webhook retry system by:
 * 1. Creating a webhook failure record
 * 2. Optionally triggering immediate retry
 * 3. Verifying the complete flow from failure to dead letter
 *
 * IMPORTANT: Only enabled in development/test environments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordWebhookFailure,
  getWebhooksForRetry,
  handleRetryFailure,
  getWebhookMetrics,
  getUnresolvedDeadLetters,
} from '@/lib/webhook-retry';
import { db, webhookFailures, deadLetterQueue } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { MeetingPlatform } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

// Only allow in development
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
}

/**
 * GET: Get current webhook failure and dead letter stats
 */
export async function GET() {
  if (!isDevelopment()) {
    return NextResponse.json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  try {
    const [metrics, pendingRetries, deadLetters] = await Promise.all([
      getWebhookMetrics(),
      getWebhooksForRetry(100),
      getUnresolvedDeadLetters(100),
    ]);

    return NextResponse.json({
      metrics,
      pendingRetries: pendingRetries.map((r) => ({
        id: r.id,
        platform: r.platform,
        eventType: r.eventType,
        attempts: r.attempts,
        status: r.status,
        nextRetryAt: r.nextRetryAt,
        createdAt: r.createdAt,
      })),
      deadLetters: deadLetters.map((d) => ({
        id: d.id,
        platform: d.platform,
        eventType: d.eventType,
        totalAttempts: d.totalAttempts,
        error: d.error,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a test webhook failure
 *
 * Body options:
 * - action: 'create' | 'simulate_retries' | 'clear'
 * - platform: 'zoom' | 'google_meet' | 'microsoft_teams' (default: 'zoom')
 * - eventType: string (default: 'test.failure')
 * - simulateUntilDeadLetter: boolean (default: false)
 */
export async function POST(request: NextRequest) {
  if (!isDevelopment()) {
    return NextResponse.json({ error: 'Test endpoint only available in development' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const action = body.action || 'create';
    const platform = (body.platform || 'zoom') as MeetingPlatform;
    const eventType = body.eventType || 'test.failure';

    switch (action) {
      case 'create': {
        // Create a test webhook failure
        const testPayload = {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook failure for retry system verification',
          platform,
          eventType,
        };

        const failure = await recordWebhookFailure(
          platform,
          eventType,
          testPayload,
          'TEST ERROR: Intentional failure for testing retry system'
        );

        console.log(JSON.stringify({
          level: 'info',
          tag: '[WEBHOOK-TEST]',
          message: 'Test webhook failure created',
          failureId: failure.id,
          platform,
          eventType,
        }));

        return NextResponse.json({
          action: 'created',
          failure: {
            id: failure.id,
            platform: failure.platform,
            eventType: failure.eventType,
            attempts: failure.attempts,
            nextRetryAt: failure.nextRetryAt,
            status: failure.status,
          },
          message: 'Test failure created. Run /api/cron/process-webhook-retries to trigger retry.',
        });
      }

      case 'simulate_retries': {
        // Simulate retry attempts until dead letter
        const testPayload = {
          test: true,
          timestamp: new Date().toISOString(),
          simulationType: 'full_failure_flow',
        };

        // Create initial failure
        const failure = await recordWebhookFailure(
          platform,
          eventType,
          testPayload,
          'TEST ERROR: Simulating full failure flow'
        );

        console.log(JSON.stringify({
          level: 'info',
          tag: '[WEBHOOK-TEST]',
          message: 'Starting simulated retry flow',
          failureId: failure.id,
        }));

        const retryResults = [];

        // Simulate 3 retry failures to reach dead letter
        for (let i = 1; i <= 3; i++) {
          const result = await handleRetryFailure(
            failure.id,
            `TEST ERROR: Simulated retry ${i} failure`
          );

          console.log(JSON.stringify({
            level: 'info',
            tag: `[WEBHOOK-RETRY-${i}]`,
            message: `Simulated retry ${i}`,
            failureId: failure.id,
            movedToDeadLetter: result.movedToDeadLetter,
          }));

          retryResults.push({
            attempt: i,
            movedToDeadLetter: result.movedToDeadLetter,
          });

          if (result.movedToDeadLetter) {
            console.log(JSON.stringify({
              level: 'warn',
              tag: '[WEBHOOK-DEAD-LETTER]',
              message: 'Test failure moved to dead letter queue',
              failureId: failure.id,
            }));
            break;
          }
        }

        // Get the dead letter entry
        const [deadLetter] = await db
          .select()
          .from(deadLetterQueue)
          .where(eq(deadLetterQueue.webhookFailureId, failure.id))
          .limit(1);

        return NextResponse.json({
          action: 'simulated_retries',
          failureId: failure.id,
          retryResults,
          deadLetter: deadLetter
            ? {
                id: deadLetter.id,
                totalAttempts: deadLetter.totalAttempts,
                error: deadLetter.error,
                alertSent: deadLetter.alertSent,
              }
            : null,
          message: 'Full retry flow simulated. Check logs for [WEBHOOK-ERROR], [WEBHOOK-RETRY-N], [WEBHOOK-DEAD-LETTER] tags.',
        });
      }

      case 'clear': {
        // Clear all test webhook failures (only entries with test.failure event type)
        const deletedFailures = await db
          .delete(webhookFailures)
          .where(eq(webhookFailures.eventType, 'test.failure'))
          .returning();

        const deletedDeadLetters = await db
          .delete(deadLetterQueue)
          .where(eq(deadLetterQueue.eventType, 'test.failure'))
          .returning();

        return NextResponse.json({
          action: 'cleared',
          deletedFailures: deletedFailures.length,
          deletedDeadLetters: deletedDeadLetters.length,
          message: 'Test webhook failures cleared.',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use 'create', 'simulate_retries', or 'clear'.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-TEST]',
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
