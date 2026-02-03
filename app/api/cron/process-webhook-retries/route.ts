/**
 * Cron Job: Process Webhook Retries
 * Runs periodically to retry failed webhooks with exponential backoff.
 *
 * Schedule: Every 1 minute (configured in vercel.json)
 *
 * Flow:
 * 1. Get webhooks ready for retry (next_retry_at <= now)
 * 2. Process each webhook through appropriate handler
 * 3. Mark success or increment failure count
 * 4. Move to dead letter after max attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWebhooksForRetry,
  markRetryInProgress,
  markRetrySuccessful,
  handleRetryFailure,
  getWebhookMetrics,
} from '@/lib/webhook-retry';
import { processZoomEvent } from '@/lib/process-zoom-event';
import { processTeamsEvent } from '@/lib/process-teams-event';
import { processMeetEvent } from '@/lib/process-meet-event';
import { db, rawEvents } from '@/lib/db';
import type { RawEvent } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Verify cron request is from Vercel or has valid secret
function verifyCronAuth(request: NextRequest): boolean {
  // Method 1: Check for CRON_SECRET in Authorization header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    console.log('[CRON-AUTH] Verified via CRON_SECRET');
    return true;
  }

  // Method 2: Check for Vercel's cron verification header
  // Vercel sets this header for cron jobs when CRON_SECRET is configured
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  if (vercelCronHeader) {
    console.log('[CRON-AUTH] Verified via x-vercel-cron header');
    return true;
  }

  // Method 3: Allow in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON-AUTH] Allowed in development mode');
    return true;
  }

  // Log auth failure details for debugging
  console.log('[CRON-AUTH] Verification failed', {
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!cronSecret,
    hasVercelCronHeader: !!vercelCronHeader,
    nodeEnv: process.env.NODE_ENV,
  });

  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify authorization
  if (!verifyCronAuth(request)) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Unauthorized cron access attempt',
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(JSON.stringify({
    level: 'info',
    tag: '[WEBHOOK-CRON]',
    message: 'Starting webhook retry processing',
    timestamp: new Date().toISOString(),
  }));

  try {
    // Get webhooks ready for retry
    const pendingRetries = await getWebhooksForRetry(10);

    if (pendingRetries.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        tag: '[WEBHOOK-CRON]',
        message: 'No pending retries found',
        duration: Date.now() - startTime,
      }));

      return NextResponse.json({
        processed: 0,
        successful: 0,
        failed: 0,
        movedToDeadLetter: 0,
      });
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[WEBHOOK-CRON]',
      message: `Processing ${pendingRetries.length} pending retries`,
      count: pendingRetries.length,
    }));

    let successful = 0;
    let failed = 0;
    let movedToDeadLetter = 0;

    // Process each retry
    for (const failure of pendingRetries) {
      try {
        // Mark as in progress
        await markRetryInProgress(failure.id);

        console.log(JSON.stringify({
          level: 'info',
          tag: `[WEBHOOK-RETRY-${failure.attempts}]`,
          message: 'Processing retry',
          failureId: failure.id,
          platform: failure.platform,
          eventType: failure.eventType,
          attempt: failure.attempts,
        }));

        // Create a synthetic raw event for processing
        const rawEvent: RawEvent = {
          id: failure.id,
          eventType: failure.eventType,
          zoomEventId: `retry-${failure.id}-${Date.now()}`,
          payload: failure.payload as object,
          status: 'pending',
          meetingId: null,
          endTime: null,
          recordingAvailable: null,
          transcriptAvailable: null,
          errorMessage: null,
          receivedAt: new Date(),
          processedAt: null,
          createdAt: failure.createdAt,
          updatedAt: new Date(),
        };

        // Route to appropriate processor based on platform
        let processingResult: unknown;
        const payload = failure.payload as Record<string, unknown>;

        switch (failure.platform) {
          case 'zoom':
            processingResult = await processZoomEvent(rawEvent);
            break;
          case 'microsoft_teams': {
            // Extract notification from stored payload
            // The payload should contain the Graph notification structure
            const notifications = (payload.value as unknown[]) || [];
            const notification = notifications[0] as Parameters<typeof processTeamsEvent>[1];
            if (!notification) {
              throw new Error('No notification data found in stored payload');
            }
            processingResult = await processTeamsEvent(rawEvent, notification);
            break;
          }
          case 'google_meet': {
            // Extract meet event from stored payload
            // The payload is a Pub/Sub message with base64 encoded event data
            const message = payload.message as { data?: string } | undefined;
            if (!message?.data) {
              throw new Error('No message data found in stored payload');
            }
            const eventData = Buffer.from(message.data, 'base64').toString('utf-8');
            const meetEvent = JSON.parse(eventData) as Parameters<typeof processMeetEvent>[1];
            processingResult = await processMeetEvent(rawEvent, meetEvent);
            break;
          }
          default:
            throw new Error(`Unknown platform: ${failure.platform}`);
        }

        // Mark as successful
        await markRetrySuccessful(failure.id);
        successful++;

        console.log(JSON.stringify({
          level: 'info',
          tag: `[WEBHOOK-RETRY-${failure.attempts}]`,
          message: 'Retry successful',
          failureId: failure.id,
          platform: failure.platform,
          result: processingResult,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const result = await handleRetryFailure(failure.id, errorMessage);

        if (result.movedToDeadLetter) {
          movedToDeadLetter++;
        } else {
          failed++;
        }

        console.log(JSON.stringify({
          level: 'error',
          tag: `[WEBHOOK-RETRY-${failure.attempts}]`,
          message: 'Retry failed',
          failureId: failure.id,
          platform: failure.platform,
          error: errorMessage,
          movedToDeadLetter: result.movedToDeadLetter,
        }));
      }
    }

    // Get updated metrics
    const metrics = await getWebhookMetrics();

    console.log(JSON.stringify({
      level: 'info',
      tag: '[WEBHOOK-CRON]',
      message: 'Webhook retry processing completed',
      processed: pendingRetries.length,
      successful,
      failed,
      movedToDeadLetter,
      duration: Date.now() - startTime,
      metrics,
    }));

    return NextResponse.json({
      processed: pendingRetries.length,
      successful,
      failed,
      movedToDeadLetter,
      metrics,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-CRON]',
      message: 'Cron job failed',
      error: errorMessage,
      duration: Date.now() - startTime,
    }));

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
