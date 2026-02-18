/**
 * Webhook Retry Service
 * Handles failed webhook storage, retry logic with exponential backoff,
 * and dead letter queue management.
 */

import { db, webhookFailures, deadLetterQueue } from '@/lib/db';
import { eq, and, or, lte, gt, isNotNull, count, sql } from 'drizzle-orm';
import type {
  MeetingPlatform,
  WebhookFailure,
  DeadLetter,
  FailureHistoryEntry,
} from '@/lib/db/schema';

// Retry configuration
const RETRY_DELAYS_MS = [
  1 * 60 * 1000,   // 1 minute
  5 * 60 * 1000,   // 5 minutes
  15 * 60 * 1000,  // 15 minutes
];
const MAX_ATTEMPTS = 3;

// Webhook metrics interface
export interface WebhookMetrics {
  total: number;
  successful: number;
  failed: number;
  retried: number;
  deadLetter: number;
  byPlatform: Record<MeetingPlatform, {
    total: number;
    failed: number;
    deadLetter: number;
  }>;
}

/**
 * Record a webhook failure for retry
 */
export async function recordWebhookFailure(
  platform: MeetingPlatform,
  eventType: string,
  payload: unknown,
  error: string
): Promise<WebhookFailure> {
  const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[0]);

  console.log(JSON.stringify({
    level: 'error',
    tag: '[WEBHOOK-ERROR]',
    message: 'Recording webhook failure',
    platform,
    eventType,
    error,
    nextRetryAt: nextRetryAt.toISOString(),
    timestamp: new Date().toISOString(),
  }));

  const [failure] = await db
    .insert(webhookFailures)
    .values({
      platform,
      eventType,
      payload: payload as object,
      error,
      attempts: 1,
      maxAttempts: MAX_ATTEMPTS,
      nextRetryAt,
      status: 'pending',
    })
    .returning();

  return failure;
}

/**
 * Get webhooks ready for retry
 */
export async function getWebhooksForRetry(limit = 10): Promise<WebhookFailure[]> {
  const now = new Date();

  return db
    .select()
    .from(webhookFailures)
    .where(
      and(
        eq(webhookFailures.status, 'pending'),
        lte(webhookFailures.nextRetryAt, now),
        isNotNull(webhookFailures.nextRetryAt)
      )
    )
    .limit(limit);
}

/**
 * Mark a webhook retry as in progress
 */
export async function markRetryInProgress(failureId: string): Promise<void> {
  await db
    .update(webhookFailures)
    .set({
      status: 'retrying',
      updatedAt: new Date(),
    })
    .where(eq(webhookFailures.id, failureId));
}

/**
 * Handle successful retry - mark as completed
 */
export async function markRetrySuccessful(failureId: string): Promise<void> {
  const [failure] = await db
    .select()
    .from(webhookFailures)
    .where(eq(webhookFailures.id, failureId))
    .limit(1);

  if (!failure) return;

  console.log(JSON.stringify({
    level: 'info',
    tag: `[WEBHOOK-RETRY-${failure.attempts}]`,
    message: 'Webhook retry successful',
    failureId,
    platform: failure.platform,
    eventType: failure.eventType,
    attempts: failure.attempts,
    timestamp: new Date().toISOString(),
  }));

  await db
    .update(webhookFailures)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(webhookFailures.id, failureId));
}

/**
 * Handle failed retry - increment attempts or move to dead letter
 */
export async function handleRetryFailure(
  failureId: string,
  error: string
): Promise<{ movedToDeadLetter: boolean }> {
  const [failure] = await db
    .select()
    .from(webhookFailures)
    .where(eq(webhookFailures.id, failureId))
    .limit(1);

  if (!failure) {
    return { movedToDeadLetter: false };
  }

  const newAttempts = failure.attempts + 1;

  console.log(JSON.stringify({
    level: 'warn',
    tag: `[WEBHOOK-RETRY-${newAttempts}]`,
    message: 'Webhook retry failed',
    failureId,
    platform: failure.platform,
    eventType: failure.eventType,
    attempts: newAttempts,
    maxAttempts: failure.maxAttempts,
    error,
    timestamp: new Date().toISOString(),
  }));

  // Check if we've exhausted all retries
  if (newAttempts >= failure.maxAttempts) {
    return moveToDeadLetter(failure, error);
  }

  // Calculate next retry time with exponential backoff
  const delayIndex = Math.min(newAttempts - 1, RETRY_DELAYS_MS.length - 1);
  const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[delayIndex]);

  await db
    .update(webhookFailures)
    .set({
      attempts: newAttempts,
      error,
      lastAttemptAt: new Date(),
      nextRetryAt,
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(webhookFailures.id, failureId));

  return { movedToDeadLetter: false };
}

/**
 * Move a failed webhook to the dead letter queue
 */
async function moveToDeadLetter(
  failure: WebhookFailure,
  finalError: string
): Promise<{ movedToDeadLetter: boolean }> {
  console.log(JSON.stringify({
    level: 'error',
    tag: '[WEBHOOK-DEAD-LETTER]',
    message: 'Webhook moved to dead letter queue',
    failureId: failure.id,
    platform: failure.platform,
    eventType: failure.eventType,
    totalAttempts: failure.attempts + 1,
    finalError,
    timestamp: new Date().toISOString(),
  }));

  // Build failure history
  const failureHistory: FailureHistoryEntry[] = [
    {
      attempt: failure.attempts + 1,
      error: finalError,
      timestamp: new Date().toISOString(),
    },
  ];

  // Insert into dead letter queue
  const [deadLetter] = await db
    .insert(deadLetterQueue)
    .values({
      platform: failure.platform,
      eventType: failure.eventType,
      payload: failure.payload as object,
      error: finalError,
      totalAttempts: failure.attempts + 1,
      failureHistory,
      webhookFailureId: failure.id,
    })
    .returning();

  // Update original failure status
  await db
    .update(webhookFailures)
    .set({
      status: 'dead_letter',
      updatedAt: new Date(),
    })
    .where(eq(webhookFailures.id, failure.id));

  // Trigger alert (async, don't await)
  sendDeadLetterAlert(deadLetter).catch((alertError) => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to send dead letter alert',
      deadLetterId: deadLetter.id,
      error: alertError instanceof Error ? alertError.message : String(alertError),
    }));
  });

  return { movedToDeadLetter: true };
}

/**
 * Send alert for dead letter item
 */
async function sendDeadLetterAlert(deadLetter: DeadLetter): Promise<void> {
  // Check if alert already sent
  if (deadLetter.alertSent === 'true') return;

  const alertPayload = {
    type: 'dead_letter_webhook',
    id: deadLetter.id,
    platform: deadLetter.platform,
    eventType: deadLetter.eventType,
    totalAttempts: deadLetter.totalAttempts,
    error: deadLetter.error,
    createdAt: deadLetter.createdAt,
  };

  console.log(JSON.stringify({
    level: 'warn',
    tag: '[WEBHOOK-ALERT]',
    message: 'Dead letter alert triggered',
    ...alertPayload,
    timestamp: new Date().toISOString(),
  }));

  // Send to configured alert endpoints
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhookUrl) {
    try {
      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Webhook Dead Letter Alert`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Webhook Failed After ${deadLetter.totalAttempts} Attempts*`,
              },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Platform:*\n${deadLetter.platform}` },
                { type: 'mrkdwn', text: `*Event Type:*\n${deadLetter.eventType}` },
                { type: 'mrkdwn', text: `*Error:*\n${deadLetter.error.substring(0, 100)}` },
                { type: 'mrkdwn', text: `*ID:*\n${deadLetter.id}` },
              ],
            },
          ],
        }),
      });
    } catch (slackError) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'Failed to send Slack alert',
        error: slackError instanceof Error ? slackError.message : String(slackError),
      }));
    }
  }

  // Mark alert as sent
  await db
    .update(deadLetterQueue)
    .set({
      alertSent: 'true',
      updatedAt: new Date(),
    })
    .where(eq(deadLetterQueue.id, deadLetter.id));
}

/**
 * Get unresolved dead letter items
 */
export async function getUnresolvedDeadLetters(limit = 50): Promise<DeadLetter[]> {
  return db
    .select()
    .from(deadLetterQueue)
    .where(eq(deadLetterQueue.resolved, 'false'))
    .limit(limit);
}

/**
 * Manually retry a dead letter item
 */
export async function retryDeadLetter(deadLetterId: string): Promise<WebhookFailure | null> {
  const [deadLetter] = await db
    .select()
    .from(deadLetterQueue)
    .where(eq(deadLetterQueue.id, deadLetterId))
    .limit(1);

  if (!deadLetter) {
    return null;
  }

  console.log(JSON.stringify({
    level: 'info',
    tag: '[WEBHOOK-DEAD-LETTER-RETRY]',
    message: 'Manually retrying dead letter item',
    deadLetterId,
    platform: deadLetter.platform,
    eventType: deadLetter.eventType,
    timestamp: new Date().toISOString(),
  }));

  // Create new webhook failure entry with reset attempts
  const [newFailure] = await db
    .insert(webhookFailures)
    .values({
      platform: deadLetter.platform,
      eventType: deadLetter.eventType,
      payload: deadLetter.payload as object,
      error: 'Manual retry from dead letter queue',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      nextRetryAt: new Date(), // Retry immediately
      status: 'pending',
    })
    .returning();

  // Mark dead letter as resolved
  await db
    .update(deadLetterQueue)
    .set({
      resolved: 'true',
      resolvedAt: new Date(),
      resolutionNotes: `Manually retried as failure ${newFailure.id}`,
      updatedAt: new Date(),
    })
    .where(eq(deadLetterQueue.id, deadLetterId));

  return newFailure;
}

/**
 * Get webhook metrics for monitoring
 */
export async function getWebhookMetrics(): Promise<WebhookMetrics> {
  // Use SQL aggregation instead of loading all rows into memory
  const [
    failuresByPlatform,
    deadLettersByPlatform,
    globalStats,
  ] = await Promise.all([
    // Per-platform failure counts
    db.select({
      platform: webhookFailures.platform,
      total: count(),
      failed: count(sql`CASE WHEN ${webhookFailures.status} IN ('pending', 'retrying') THEN 1 END`),
    })
    .from(webhookFailures)
    .groupBy(webhookFailures.platform),

    // Per-platform unresolved dead letters
    db.select({
      platform: deadLetterQueue.platform,
      deadLetter: count(),
    })
    .from(deadLetterQueue)
    .where(eq(deadLetterQueue.resolved, 'false'))
    .groupBy(deadLetterQueue.platform),

    // Global aggregates
    db.select({
      total: count(),
      successful: count(sql`CASE WHEN ${webhookFailures.status} = 'completed' THEN 1 END`),
      failed: count(sql`CASE WHEN ${webhookFailures.status} IN ('pending', 'retrying') THEN 1 END`),
      retried: count(sql`CASE WHEN ${webhookFailures.attempts} > 1 THEN 1 END`),
    })
    .from(webhookFailures),
  ]);

  // Total unresolved dead letters
  const [deadLetterTotal] = await db
    .select({ count: count() })
    .from(deadLetterQueue)
    .where(eq(deadLetterQueue.resolved, 'false'));

  // Build per-platform map
  const platforms: MeetingPlatform[] = ['zoom', 'google_meet', 'microsoft_teams'];
  const failureMap = new Map(failuresByPlatform.map(r => [r.platform, r]));
  const deadLetterMap = new Map(deadLettersByPlatform.map(r => [r.platform, r]));

  const byPlatform = {} as WebhookMetrics['byPlatform'];
  for (const platform of platforms) {
    const f = failureMap.get(platform);
    const d = deadLetterMap.get(platform);
    byPlatform[platform] = {
      total: f?.total ?? 0,
      failed: f?.failed ?? 0,
      deadLetter: d?.deadLetter ?? 0,
    };
  }

  const stats = globalStats[0];
  return {
    total: stats?.total ?? 0,
    successful: stats?.successful ?? 0,
    failed: stats?.failed ?? 0,
    retried: stats?.retried ?? 0,
    deadLetter: deadLetterTotal?.count ?? 0,
    byPlatform,
  };
}

/**
 * Wrapper function for webhook handlers with error capture
 * Returns the result and any error that occurred
 */
export async function withWebhookErrorHandling<T>(
  platform: MeetingPlatform,
  eventType: string,
  payload: unknown,
  handler: () => Promise<T>
): Promise<{ result: T | null; error: Error | null; failureId: string | null }> {
  try {
    const result = await handler();
    return { result, error: null, failureId: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-ERROR]',
      message: 'Webhook handler failed',
      platform,
      eventType,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }));

    // Record failure for retry
    const failure = await recordWebhookFailure(platform, eventType, payload, errorMessage);

    return {
      result: null,
      error: error instanceof Error ? error : new Error(errorMessage),
      failureId: failure.id,
    };
  }
}
