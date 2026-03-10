/**
 * Cron Job: Webhook Health Monitor
 * Proactive health checks for webhook processing pipeline.
 * Alerts via Slack when failure rates spike or retries get stuck.
 *
 * Schedule: Every 15 minutes (configured in vercel.json)
 *
 * Checks:
 * 1. Stuck retries - webhooks in "retrying" state > 5 minutes
 * 2. Failure rate spikes - more than 5 pending retries
 * 3. New dead letters since last check
 * 4. Platform-specific health breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, webhookFailures, deadLetterQueue } from '@/lib/db';
import { eq, and, lt, gt, count, sql } from 'drizzle-orm';
import type { MeetingPlatform } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Thresholds for health status
const STUCK_RETRY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in "retrying" state
const PENDING_RETRY_WARNING = 5;  // degraded if > 5 pending
const PENDING_RETRY_CRITICAL = 15; // critical if > 15 pending
const RECENT_DEAD_LETTER_WINDOW_MS = 15 * 60 * 1000; // 15-minute window

type HealthStatus = 'healthy' | 'degraded' | 'critical';

interface PlatformHealth {
  pending: number;
  stuck: number;
  recentDeadLetters: number;
}

interface HealthReport {
  status: HealthStatus;
  totalPending: number;
  totalStuck: number;
  totalRecentDeadLetters: number;
  totalUnresolvedDeadLetters: number;
  platforms: Record<string, PlatformHealth>;
  issues: string[];
  checkedAt: string;
  durationMs: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const stuckCutoff = new Date(now.getTime() - STUCK_RETRY_THRESHOLD_MS);
    const deadLetterWindow = new Date(now.getTime() - RECENT_DEAD_LETTER_WINDOW_MS);
    const platforms: MeetingPlatform[] = ['zoom', 'google_meet', 'microsoft_teams'];

    // Run all queries in parallel
    const [
      pendingByPlatform,
      stuckByPlatform,
      recentDeadLettersByPlatform,
      unresolvedDeadLetterCount,
    ] = await Promise.all([
      // Pending retries by platform
      db.select({
        platform: webhookFailures.platform,
        count: count(),
      })
      .from(webhookFailures)
      .where(eq(webhookFailures.status, 'pending'))
      .groupBy(webhookFailures.platform),

      // Stuck retries (in "retrying" > 5 min) by platform
      db.select({
        platform: webhookFailures.platform,
        count: count(),
      })
      .from(webhookFailures)
      .where(
        and(
          eq(webhookFailures.status, 'retrying'),
          lt(webhookFailures.updatedAt, stuckCutoff),
        )
      )
      .groupBy(webhookFailures.platform),

      // Recent dead letters (last 15 min) by platform
      db.select({
        platform: deadLetterQueue.platform,
        count: count(),
      })
      .from(deadLetterQueue)
      .where(gt(deadLetterQueue.createdAt, deadLetterWindow))
      .groupBy(deadLetterQueue.platform),

      // Total unresolved dead letters
      db.select({ count: count() })
        .from(deadLetterQueue)
        .where(eq(deadLetterQueue.resolved, 'false')),
    ]);

    // Build per-platform maps
    const pendingMap = new Map(pendingByPlatform.map(r => [r.platform, r.count]));
    const stuckMap = new Map(stuckByPlatform.map(r => [r.platform, r.count]));
    const deadLetterMap = new Map(recentDeadLettersByPlatform.map(r => [r.platform, r.count]));

    // Aggregate
    let totalPending = 0;
    let totalStuck = 0;
    let totalRecentDeadLetters = 0;
    const platformHealth: Record<string, PlatformHealth> = {};

    for (const platform of platforms) {
      const pending = pendingMap.get(platform) ?? 0;
      const stuck = stuckMap.get(platform) ?? 0;
      const recentDL = deadLetterMap.get(platform) ?? 0;

      totalPending += pending;
      totalStuck += stuck;
      totalRecentDeadLetters += recentDL;

      platformHealth[platform] = { pending, stuck, recentDeadLetters: recentDL };
    }

    const totalUnresolvedDeadLetters = unresolvedDeadLetterCount[0]?.count ?? 0;

    // Determine health status and collect issues
    const issues: string[] = [];
    let status: HealthStatus = 'healthy';

    if (totalStuck > 0) {
      status = 'critical';
      issues.push(`${totalStuck} webhook(s) stuck in "retrying" state for >5 minutes`);
    }

    if (totalRecentDeadLetters > 0) {
      status = 'critical';
      issues.push(`${totalRecentDeadLetters} new dead letter(s) in the last 15 minutes`);
    }

    if (totalUnresolvedDeadLetters > 0 && status !== 'critical') {
      status = 'degraded';
      issues.push(`${totalUnresolvedDeadLetters} unresolved dead letter(s) in queue`);
    }

    if (totalPending >= PENDING_RETRY_CRITICAL) {
      status = 'critical';
      issues.push(`${totalPending} pending retries (threshold: ${PENDING_RETRY_CRITICAL})`);
    } else if (totalPending >= PENDING_RETRY_WARNING && status === 'healthy') {
      status = 'degraded';
      issues.push(`${totalPending} pending retries (threshold: ${PENDING_RETRY_WARNING})`);
    }

    // Check per-platform issues
    for (const platform of platforms) {
      const ph = platformHealth[platform];
      if (ph.stuck > 0) {
        issues.push(`${platform}: ${ph.stuck} stuck retry(ies)`);
      }
      if (ph.recentDeadLetters > 0) {
        issues.push(`${platform}: ${ph.recentDeadLetters} new dead letter(s)`);
      }
    }

    // Unstick stuck retries by resetting them to pending
    if (totalStuck > 0) {
      await db
        .update(webhookFailures)
        .set({
          status: 'pending',
          nextRetryAt: new Date(), // Retry immediately
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(webhookFailures.status, 'retrying'),
            lt(webhookFailures.updatedAt, stuckCutoff),
          )
        );
      issues.push(`Reset ${totalStuck} stuck retry(ies) to pending`);
    }

    const durationMs = Date.now() - startTime;

    const report: HealthReport = {
      status,
      totalPending,
      totalStuck,
      totalRecentDeadLetters,
      totalUnresolvedDeadLetters,
      platforms: platformHealth,
      issues,
      checkedAt: now.toISOString(),
      durationMs,
    };

    // Log the health check
    console.log(JSON.stringify({
      level: status === 'healthy' ? 'info' : 'warn',
      tag: '[WEBHOOK-HEALTH]',
      message: `Webhook health: ${status}`,
      ...report,
    }));

    // Send Slack alert if degraded or critical
    if (status !== 'healthy') {
      await sendHealthAlert(report).catch((err) => {
        console.log(JSON.stringify({
          level: 'error',
          tag: '[WEBHOOK-HEALTH]',
          message: 'Failed to send health alert',
          error: err instanceof Error ? err.message : String(err),
        }));
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-HEALTH]',
      message: 'Health check failed',
      error: errorMessage,
      durationMs: Date.now() - startTime,
    }));
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Send Slack alert for degraded/critical webhook health
 */
async function sendHealthAlert(report: HealthReport): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return;

  const statusEmoji = report.status === 'critical' ? ':rotating_light:' : ':warning:';
  const statusColor = report.status === 'critical' ? '#dc2626' : '#f59e0b';

  const platformLines = Object.entries(report.platforms)
    .filter(([, h]) => h.pending > 0 || h.stuck > 0 || h.recentDeadLetters > 0)
    .map(([p, h]) => {
      const parts: string[] = [];
      if (h.pending > 0) parts.push(`${h.pending} pending`);
      if (h.stuck > 0) parts.push(`${h.stuck} stuck`);
      if (h.recentDeadLetters > 0) parts.push(`${h.recentDeadLetters} dead letters`);
      return `*${p}:* ${parts.join(', ')}`;
    });

  await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${statusEmoji} Webhook Health: ${report.status.toUpperCase()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${statusEmoji} Webhook Health: ${report.status.toUpperCase()}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: report.issues.map(i => `- ${i}`).join('\n'),
          },
        },
        ...(platformLines.length > 0 ? [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Platform Breakdown:*\n${platformLines.join('\n')}`,
          },
        }] : []),
        {
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `Pending: ${report.totalPending} | Dead Letters: ${report.totalUnresolvedDeadLetters} | Checked: ${report.checkedAt}`,
          }],
        },
      ],
    }),
  });
}
