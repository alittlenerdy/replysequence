/**
 * Cron: Next Step Overdue Reminders
 *
 * Runs daily. Finds overdue next steps (dueDate < now, status = pending)
 * and sends a digest email per user via Resend.
 * Also marks steps as 'overdue' status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, nextStepsTable, users, meetings } from '@/lib/db';
import { eq, and, lt, isNotNull, isNull } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

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
      service: 'cron-next-step-reminders',
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

  log('info', 'Next step reminders starting');

  const now = new Date();

  try {
    // Find overdue pending steps that haven't had a reminder sent today
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const overdueSteps = await db
      .select({
        stepId: nextStepsTable.id,
        task: nextStepsTable.task,
        owner: nextStepsTable.owner,
        urgency: nextStepsTable.urgency,
        dueDate: nextStepsTable.dueDate,
        userId: nextStepsTable.userId,
        meetingId: nextStepsTable.meetingId,
        reminderSentAt: nextStepsTable.reminderSentAt,
      })
      .from(nextStepsTable)
      .where(
        and(
          eq(nextStepsTable.status, 'pending'),
          isNotNull(nextStepsTable.dueDate),
          lt(nextStepsTable.dueDate, now)
        )
      )
      .limit(200);

    // Filter out steps that got a reminder in the last 24h
    const needsReminder = overdueSteps.filter(
      (s) => !s.reminderSentAt || new Date(s.reminderSentAt) < oneDayAgo
    );

    if (needsReminder.length === 0) {
      log('info', 'No overdue steps needing reminders');
      return NextResponse.json({ reminders: 0, durationMs: Date.now() - startTime });
    }

    // Mark as overdue
    const overdueIds = needsReminder.map((s) => s.stepId);
    for (const id of overdueIds) {
      await db
        .update(nextStepsTable)
        .set({ status: 'overdue', updatedAt: now })
        .where(eq(nextStepsTable.id, id));
    }

    // Group by user for digest emails
    const userSteps = new Map<string, typeof needsReminder>();
    for (const step of needsReminder) {
      const existing = userSteps.get(step.userId) || [];
      existing.push(step);
      userSteps.set(step.userId, existing);
    }

    let emailsSent = 0;

    for (const [userId, steps] of userSteps) {
      // Get user email
      const [user] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user?.email) continue;

      // Build digest email
      const stepsList = steps
        .map((s) => {
          const dueStr = s.dueDate ? new Date(s.dueDate).toLocaleDateString() : 'No date';
          return `<li style="margin-bottom: 8px;">
            <strong>${escapeHtml(s.task)}</strong><br>
            <span style="color: #6B7280; font-size: 13px;">Owner: ${escapeHtml(s.owner)} · Due: ${dueStr}</span>
          </li>`;
        })
        .join('');

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; font-size: 20px; margin: 0;">Overdue Action Items</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">
              You have ${steps.length} overdue next step${steps.length > 1 ? 's' : ''} from your meetings
            </p>
          </div>
          <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
            <ul style="list-style: none; padding: 0; margin: 0;">${stepsList}</ul>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.replysequence.com'}/dashboard"
                 style="display: inline-block; background: #4F46E5; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                View in Dashboard
              </a>
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: `${steps.length} overdue action item${steps.length > 1 ? 's' : ''} from your meetings`,
          html,
        });
        emailsSent++;

        // Mark reminder sent
        for (const step of steps) {
          await db
            .update(nextStepsTable)
            .set({ reminderSentAt: now })
            .where(eq(nextStepsTable.id, step.stepId));
        }
      } catch (err) {
        log('error', 'Failed to send reminder email', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const durationMs = Date.now() - startTime;
    log('info', 'Next step reminders complete', {
      overdueFound: overdueSteps.length,
      needingReminder: needsReminder.length,
      emailsSent,
      durationMs,
    });

    return NextResponse.json({
      overdueFound: overdueSteps.length,
      reminders: emailsSent,
      durationMs,
    });
  } catch (error) {
    log('error', 'Next step reminders failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
