/**
 * Cron Job: Waitlist-to-Signup Conversion Nudge
 * When invited waitlist users haven't accepted within 48 hours,
 * send a personalized reminder email with their tier and referral count.
 *
 * Schedule: Every 15 minutes (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistEntries } from '@/lib/db/schema';
import { and, eq, lt, isNotNull, isNull } from 'drizzle-orm';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NUDGE_AFTER_HOURS = 48; // Send nudge 48 hours after invite

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const nudgeCutoff = new Date(Date.now() - NUDGE_AFTER_HOURS * 60 * 60 * 1000);

    // Find invited users who:
    // 1. Status is 'invited'
    // 2. Were invited more than 48 hours ago
    // 3. Haven't accepted yet
    // 4. Haven't received a nudge (lastUpdateEmailAt is null or before invitedAt)
    const eligibleEntries = await db
      .select()
      .from(waitlistEntries)
      .where(
        and(
          eq(waitlistEntries.status, 'invited'),
          isNotNull(waitlistEntries.invitedAt),
          lt(waitlistEntries.invitedAt, nudgeCutoff),
          isNull(waitlistEntries.acceptedAt),
          isNull(waitlistEntries.lastUpdateEmailAt),
        )
      )
      .limit(50);

    if (eligibleEntries.length === 0) {
      return NextResponse.json({ processed: 0, nudged: 0, durationMs: Date.now() - startTime });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.replysequence.com';
    let nudged = 0;
    let errors = 0;

    for (const entry of eligibleEntries) {
      const firstName = entry.name?.split(' ')[0] || 'there';
      const tierLabel = entry.tier === 'vip' ? 'VIP' : entry.tier === 'priority' ? 'Priority' : 'Standard';
      const signupUrl = `${appUrl}/signup?ref=${entry.referralCode}`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'ReplySequence <noreply@resend.dev>',
          to: entry.email,
          subject: `Your ReplySequence invite is waiting${entry.tier !== 'standard' ? ` (${tierLabel} access)` : ''}`,
          html: buildNudgeEmail({
            firstName,
            tierLabel,
            referralCount: entry.referralCount,
            signupUrl,
            isExpiring: !!entry.inviteExpiresAt && entry.inviteExpiresAt.getTime() - Date.now() < 72 * 60 * 60 * 1000,
          }),
        });

        // Mark that we sent the nudge
        await db
          .update(waitlistEntries)
          .set({ lastUpdateEmailAt: new Date(), updatedAt: new Date() })
          .where(eq(waitlistEntries.id, entry.id));

        nudged++;

        console.log(JSON.stringify({
          level: 'info',
          tag: '[WAITLIST-NUDGE]',
          message: 'Nudge sent',
          email: entry.email,
          tier: entry.tier,
          referralCount: entry.referralCount,
        }));
      } catch (err) {
        errors++;
        console.log(JSON.stringify({
          level: 'error',
          tag: '[WAITLIST-NUDGE]',
          message: 'Failed to send nudge',
          email: entry.email,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    }

    const durationMs = Date.now() - startTime;

    console.log(JSON.stringify({
      level: 'info',
      tag: '[WAITLIST-NUDGE]',
      message: 'Waitlist nudge cron completed',
      eligible: eligibleEntries.length,
      nudged,
      errors,
      durationMs,
    }));

    return NextResponse.json({ processed: eligibleEntries.length, nudged, errors, durationMs });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WAITLIST-NUDGE]',
      message: 'Cron failed',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildNudgeEmail(params: {
  firstName: string;
  tierLabel: string;
  referralCount: number;
  signupUrl: string;
  isExpiring: boolean;
}): string {
  const { firstName, tierLabel, referralCount, signupUrl, isExpiring } = params;

  const urgencyLine = isExpiring
    ? `<p style="color: #ef4444; font-weight: 600;">Your invite expires soon — claim your spot before it's gone.</p>`
    : '';

  const referralLine = referralCount > 0
    ? `<p style="color: #374151; line-height: 1.6;">You referred <strong>${referralCount} ${referralCount === 1 ? 'person' : 'people'}</strong> — thanks for spreading the word!</p>`
    : '';

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

      <p style="color: #374151; line-height: 1.6;">
        Your <strong>${tierLabel}</strong> invite to ReplySequence is ready — you signed up for the waitlist and we've opened a spot for you.
      </p>

      ${urgencyLine}
      ${referralLine}

      <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 4px; font-size: 14px; color: #64748b;">What you get:</p>
        <ul style="margin: 8px 0 0; padding-left: 20px; color: #0f172a; line-height: 1.8;">
          <li>AI-powered follow-up emails from your Zoom, Meet, and Teams calls</li>
          <li>Action items and meeting summaries extracted automatically</li>
          <li>5 free drafts per month to try it out</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${signupUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Claim Your Spot
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">
        If you're no longer interested, no worries — this invite will remain open for you.
      </p>
    </div>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      <a href="https://www.replysequence.com" style="color: #9ca3af;">ReplySequence</a> &mdash; AI-powered meeting follow-ups
    </p>
  </div>
</body>
</html>`;
}
