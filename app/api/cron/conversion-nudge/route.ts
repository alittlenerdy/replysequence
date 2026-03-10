/**
 * Cron Job: Trial-to-Paid Conversion Nudge
 * When free-tier users hit 3/5 or 4/5 monthly draft limit, send a
 * contextual email with their time-savings data and upgrade CTA.
 *
 * Schedule: Every 15 minutes (configured in vercel.json)
 *
 * Logic:
 * 1. Find free-tier users with 3+ drafts this month
 * 2. Skip if already nudged this month
 * 3. Calculate personalized time-savings data
 * 4. Send email with Stripe checkout link
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, usageLogs, drafts, meetings } from '@/lib/db/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NUDGE_THRESHOLD = 3; // Send nudge at 3/5 drafts
const FREE_TIER_LIMIT = 5;
const DEFAULT_MINUTES_PER_DRAFT = 25; // Estimated minutes saved per AI draft

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Find free-tier users with 3+ drafts this month who haven't been nudged
    const freeUsersWithUsage = await db
      .select({
        userId: usageLogs.userId,
        draftCount: count(),
      })
      .from(usageLogs)
      .innerJoin(users, eq(usageLogs.userId, users.id))
      .where(
        and(
          eq(usageLogs.action, 'draft_generated'),
          gte(usageLogs.createdAt, startOfMonth),
          eq(users.subscriptionTier, 'free'),
        )
      )
      .groupBy(usageLogs.userId)
      .having(sql`count(*) >= ${NUDGE_THRESHOLD}`);

    if (freeUsersWithUsage.length === 0) {
      return NextResponse.json({ processed: 0, nudged: 0, durationMs: Date.now() - startTime });
    }

    // Check which users have already been nudged this month
    const userIds = freeUsersWithUsage.map(u => u.userId).filter((id): id is string => id !== null);
    const alreadyNudged = await db
      .select({ userId: usageLogs.userId })
      .from(usageLogs)
      .where(
        and(
          sql`${usageLogs.userId} = ANY(${userIds})`,
          eq(usageLogs.action, 'conversion_nudge_sent'),
          gte(usageLogs.createdAt, startOfMonth),
        )
      );

    const nudgedSet = new Set(alreadyNudged.map(n => n.userId));
    const usersToNudge = freeUsersWithUsage.filter(u => u.userId && !nudgedSet.has(u.userId));

    if (usersToNudge.length === 0) {
      return NextResponse.json({ processed: freeUsersWithUsage.length, nudged: 0, skippedAlreadyNudged: nudgedSet.size, durationMs: Date.now() - startTime });
    }

    // Get user details for email sending
    const nudgeUserIds = usersToNudge.map(u => u.userId).filter((id): id is string => id !== null);
    const userDetails = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        hourlyRate: users.hourlyRate,
        onboardingEmailsUnsubscribed: users.onboardingEmailsUnsubscribed,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${nudgeUserIds})`);

    const userDetailMap = new Map(userDetails.map(u => [u.id, u]));

    // Get total draft count per user (all time) for the email
    const totalDrafts = await db
      .select({
        userId: usageLogs.userId,
        total: count(),
      })
      .from(usageLogs)
      .where(
        and(
          sql`${usageLogs.userId} = ANY(${nudgeUserIds})`,
          eq(usageLogs.action, 'draft_generated'),
        )
      )
      .groupBy(usageLogs.userId);

    const totalDraftMap = new Map(totalDrafts.map(d => [d.userId, d.total]));

    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.replysequence.com';
    let nudged = 0;
    let errors = 0;

    for (const userUsage of usersToNudge) {
      const user = userUsage.userId ? userDetailMap.get(userUsage.userId) : undefined;
      if (!user || !userUsage.userId || user.onboardingEmailsUnsubscribed) continue;

      const monthlyDrafts = userUsage.draftCount;
      const allTimeDrafts = totalDraftMap.get(userUsage.userId!) ?? monthlyDrafts;
      const hourlyRate = user.hourlyRate ?? 100;
      const minutesSaved = allTimeDrafts * DEFAULT_MINUTES_PER_DRAFT;
      const hoursSaved = (minutesSaved / 60).toFixed(1);
      const dollarsSaved = Math.round((minutesSaved / 60) * hourlyRate);
      const remaining = FREE_TIER_LIMIT - monthlyDrafts;
      const firstName = user.name?.split(' ')[0] || 'there';

      const upgradeUrl = `${appUrl}/dashboard/billing`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReplySequence <noreply@resend.dev>',
          to: user.email,
          subject: remaining <= 1
            ? `You've used ${monthlyDrafts} of ${FREE_TIER_LIMIT} drafts — unlock unlimited`
            : `ReplySequence saved you ${hoursSaved} hours so far`,
          html: buildNudgeEmail({
            firstName,
            monthlyDrafts,
            remaining,
            hoursSaved,
            dollarsSaved,
            upgradeUrl,
          }),
        });

        // Record that we nudged this user
        await db.insert(usageLogs).values({
          userId: userUsage.userId,
          action: 'conversion_nudge_sent',
          metadata: {
            monthlyDrafts,
            remaining,
            hoursSaved,
            dollarsSaved,
          },
        });

        nudged++;

        console.log(JSON.stringify({
          level: 'info',
          tag: '[NUDGE]',
          message: 'Conversion nudge sent',
          userId: userUsage.userId,
          monthlyDrafts,
          remaining,
          hoursSaved,
          dollarsSaved,
        }));
      } catch (err) {
        errors++;
        console.log(JSON.stringify({
          level: 'error',
          tag: '[NUDGE]',
          message: 'Failed to send nudge email',
          userId: userUsage.userId,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    }

    const durationMs = Date.now() - startTime;

    console.log(JSON.stringify({
      level: 'info',
      tag: '[NUDGE]',
      message: 'Conversion nudge cron completed',
      eligible: freeUsersWithUsage.length,
      alreadyNudged: nudgedSet.size,
      nudged,
      errors,
      durationMs,
    }));

    return NextResponse.json({ processed: freeUsersWithUsage.length, nudged, errors, durationMs });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[NUDGE]',
      message: 'Conversion nudge cron failed',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Build the HTML email for the conversion nudge
 */
function buildNudgeEmail(params: {
  firstName: string;
  monthlyDrafts: number;
  remaining: number;
  hoursSaved: string;
  dollarsSaved: number;
  upgradeUrl: string;
}): string {
  const { firstName, monthlyDrafts, remaining, hoursSaved, dollarsSaved, upgradeUrl } = params;

  const urgencyLine = remaining <= 1
    ? `<p style="color: #ef4444; font-weight: 600;">You have ${remaining === 0 ? 'no' : 'just 1'} draft${remaining === 1 ? '' : 's'} left this month.</p>`
    : `<p>You've used <strong>${monthlyDrafts} of ${FREE_TIER_LIMIT}</strong> free drafts this month.</p>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Hey ${firstName},</h2>

      ${urgencyLine}

      <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Your ReplySequence impact so far:</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">
          ${hoursSaved} hours saved
          <span style="font-size: 16px; color: #64748b; font-weight: 400;"> &mdash; worth ~$${dollarsSaved}</span>
        </p>
      </div>

      <p style="color: #374151; line-height: 1.6;">
        Pro members get <strong>unlimited drafts</strong>, priority processing, and custom AI tone settings.
        Plans start at <strong>$19/mo</strong> (or $15/mo annual).
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${upgradeUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Upgrade to Pro
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">
        Your free drafts reset on the 1st of each month. Reply to this email if you have any questions.
      </p>
    </div>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      <a href="https://www.replysequence.com" style="color: #9ca3af;">ReplySequence</a> &mdash; AI-powered meeting follow-ups
    </p>
  </div>
</body>
</html>`;
}
