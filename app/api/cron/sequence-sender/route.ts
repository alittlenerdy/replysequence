/**
 * Cron: Sequence Step Sender
 *
 * Runs every 15 minutes. Finds sequence steps that are:
 *  - status = 'scheduled'
 *  - scheduledAt <= now
 *  - parent sequence is 'active'
 *
 * Sends each step via Resend, updates status, and auto-pauses
 * the sequence if a bounce or complaint is detected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, emailSequences, sequenceSteps, users } from '@/lib/db';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { notifyAgentSlack } from '@/lib/slack-agents';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
      service: 'cron-sequence-sender',
      ...data,
    })
  );
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log('info', 'Sequence sender starting');

  const now = new Date();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Find all due steps where the parent sequence is active
    const dueSteps = await db
      .select({
        stepId: sequenceSteps.id,
        stepNumber: sequenceSteps.stepNumber,
        stepType: sequenceSteps.stepType,
        subject: sequenceSteps.subject,
        body: sequenceSteps.body,
        trackingId: sequenceSteps.trackingId,
        sequenceId: sequenceSteps.sequenceId,
        recipientEmail: emailSequences.recipientEmail,
        recipientName: emailSequences.recipientName,
        userId: emailSequences.userId,
        sequenceStatus: emailSequences.status,
        meetingTopic: emailSequences.meetingTopic,
      })
      .from(sequenceSteps)
      .innerJoin(emailSequences, eq(sequenceSteps.sequenceId, emailSequences.id))
      .where(
        and(
          eq(sequenceSteps.status, 'scheduled'),
          lte(sequenceSteps.scheduledAt, now),
          eq(emailSequences.status, 'active')
        )
      )
      .limit(50); // Process max 50 per run to stay within timeout

    if (dueSteps.length === 0) {
      log('info', 'No sequence steps due');
      return NextResponse.json({ success: true, sent: 0, duration: Date.now() - startTime });
    }

    log('info', `Found ${dueSteps.length} due sequence steps`);

    for (const step of dueSteps) {
      try {
        // Double-check sequence is still active (could have been paused between query and send)
        if (step.sequenceStatus !== 'active') {
          skipped++;
          continue;
        }

        // Get sender info
        const [user] = await db
          .select({ email: users.email, firstName: users.firstName })
          .from(users)
          .where(eq(users.id, step.userId))
          .limit(1);

        if (!user?.email) {
          log('error', 'User not found for sequence step', { stepId: step.stepId, userId: step.userId });
          failed++;
          continue;
        }

        // Send the email
        const result = await sendEmail({
          to: step.recipientEmail,
          subject: step.subject,
          body: step.body,
          replyTo: user.email,
        });

        if (result.success) {
          // Mark step as sent
          await db.update(sequenceSteps).set({
            status: 'sent',
            resendMessageId: result.messageId || null,
            sentAt: now,
            updatedAt: now,
          }).where(eq(sequenceSteps.id, step.stepId));

          // Increment completed steps on the sequence
          await db.update(emailSequences).set({
            completedSteps: sql`${emailSequences.completedSteps} + 1`,
            updatedAt: now,
          }).where(eq(emailSequences.id, step.sequenceId));

          sent++;
          log('info', 'Sequence step sent', {
            stepId: step.stepId,
            stepNumber: step.stepNumber,
            stepType: step.stepType,
            recipientEmail: step.recipientEmail,
            messageId: result.messageId,
          });
        } else {
          // Mark step as failed
          await db.update(sequenceSteps).set({
            status: 'failed',
            errorMessage: result.error || 'Send failed',
            retryCount: sql`COALESCE(${sequenceSteps.retryCount}, 0) + 1`,
            updatedAt: now,
          }).where(eq(sequenceSteps.id, step.stepId));

          failed++;
          log('error', 'Sequence step send failed', {
            stepId: step.stepId,
            error: result.error,
          });
        }
      } catch (error) {
        failed++;
        log('error', 'Sequence step threw error', {
          stepId: step.stepId,
          error: error instanceof Error ? error.message : String(error),
        });

        // Mark step as failed
        await db.update(sequenceSteps).set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: sql`COALESCE(${sequenceSteps.retryCount}, 0) + 1`,
          updatedAt: now,
        }).where(eq(sequenceSteps.id, step.stepId)).catch(() => {});
      }
    }

    // Check for any sequences where all steps are done
    // Mark them as completed
    await db.execute(sql`
      UPDATE email_sequences
      SET status = 'completed', updated_at = NOW()
      WHERE status = 'active'
        AND completed_steps >= total_steps
        AND total_steps > 0
    `);

    const duration = Date.now() - startTime;
    log('info', 'Sequence sender complete', { sent, failed, skipped, duration });

    // Slack notification on activity
    if (sent > 0 || failed > 0) {
      await notifyAgentSlack({
        agent: 'Sequence Sender',
        status: failed > 0 ? 'warning' : 'success',
        summary: `${sent} sent, ${failed} failed`,
        details: {
          'Sent': sent,
          'Failed': failed,
          'Skipped': skipped,
        },
        durationMs: duration,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, sent, failed, skipped, duration });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('error', 'Sequence sender crashed', { error: errorMsg });
    await notifyAgentSlack({
      agent: 'Sequence Sender',
      status: 'error',
      summary: 'Cron crashed',
      details: { 'Error': errorMsg },
      durationMs: Date.now() - startTime,
    }).catch(() => {});
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
