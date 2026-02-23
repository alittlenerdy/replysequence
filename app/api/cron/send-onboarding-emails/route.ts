/**
 * Cron Job: Send Onboarding Emails
 *
 * Runs every 15 minutes. For each user who signed up in the last 14 days
 * and hasn't unsubscribed, checks if the next drip email is due and sends it.
 *
 * Schedule: Every 15 minutes (configured in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userOnboarding, onboardingEmails } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import {
  getNextEmailToSend,
  sendOnboardingEmail,
  shouldSkipEmail,
  isEmailDue,
} from '@/lib/onboarding-emails';
import type { UserOnboarding } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SAFETY_WINDOW_DAYS = 14;
const TOTAL_EMAILS = 4;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const cutoffDate = new Date(Date.now() - SAFETY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Find users who:
    // 1. Signed up within the safety window
    // 2. Haven't unsubscribed
    // 3. Haven't received all 4 emails yet
    const eligibleUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          gte(users.createdAt, cutoffDate),
          eq(users.onboardingEmailsUnsubscribed, false),
        )
      );

    if (eligibleUsers.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        message: 'No eligible users for onboarding emails',
        duration: Date.now() - startTime,
      }));
      return NextResponse.json({ processed: 0 });
    }

    // Get all sent emails for eligible users in one query
    const userIds = eligibleUsers.map(u => u.id);
    const sentRecords = await db
      .select({
        userId: onboardingEmails.userId,
        emailNumber: onboardingEmails.emailNumber,
      })
      .from(onboardingEmails)
      .where(sql`${onboardingEmails.userId} = ANY(${userIds})`);

    // Group sent emails by user
    const sentByUser = new Map<string, number[]>();
    for (const record of sentRecords) {
      const existing = sentByUser.get(record.userId) || [];
      existing.push(record.emailNumber);
      sentByUser.set(record.userId, existing);
    }

    // Filter out users who have already received all emails
    const usersNeedingEmails = eligibleUsers.filter(u => {
      const sent = sentByUser.get(u.id) || [];
      return sent.length < TOTAL_EMAILS;
    });

    if (usersNeedingEmails.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        message: 'All eligible users have received all onboarding emails',
        totalEligible: eligibleUsers.length,
        duration: Date.now() - startTime,
      }));
      return NextResponse.json({ processed: 0 });
    }

    // Get onboarding progress for users who need emails
    const onboardingUserIds = usersNeedingEmails.map(u => u.id);
    // userOnboarding uses clerkId, not userId — we need to join through users table
    const onboardingRecords = await db
      .select({
        clerkId: userOnboarding.clerkId,
        platformConnected: userOnboarding.platformConnected,
        draftGenerated: userOnboarding.draftGenerated,
        completedAt: userOnboarding.completedAt,
      })
      .from(userOnboarding);

    // Also get clerkIds for our users
    const userClerkIds = await db
      .select({ id: users.id, clerkId: users.clerkId })
      .from(users)
      .where(sql`${users.id} = ANY(${onboardingUserIds})`);

    const clerkIdToUserId = new Map<string, string>();
    const userIdToClerkId = new Map<string, string>();
    for (const u of userClerkIds) {
      clerkIdToUserId.set(u.clerkId, u.id);
      userIdToClerkId.set(u.id, u.clerkId);
    }

    // Map onboarding records by userId
    const onboardingByUserId = new Map<string, UserOnboarding>();
    for (const record of onboardingRecords) {
      const userId = clerkIdToUserId.get(record.clerkId);
      if (userId) {
        onboardingByUserId.set(userId, record as unknown as UserOnboarding);
      }
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersNeedingEmails) {
      const sentNumbers = sentByUser.get(user.id) || [];
      const onboarding = onboardingByUserId.get(user.id) || null;

      const nextEmail = getNextEmailToSend(user.createdAt, sentNumbers, onboarding);

      if (nextEmail === null) {
        skipped++;
        continue;
      }

      // Record skipped emails (emails that should be skipped but aren't yet recorded)
      // so we don't re-evaluate them every cron run
      for (let num = 1; num < nextEmail; num++) {
        if (!sentNumbers.includes(num) && shouldSkipEmail(num, onboarding) && isEmailDue(num, user.createdAt)) {
          try {
            await db.insert(onboardingEmails).values({
              userId: user.id,
              emailNumber: num,
              resendMessageId: null,
            }).onConflictDoNothing();
          } catch {
            // Ignore conflicts — already recorded
          }
        }
      }

      try {
        const result = await sendOnboardingEmail(
          user.id,
          user.email,
          nextEmail,
          user.name,
        );

        if (result.success) {
          sent++;
          console.log(JSON.stringify({
            level: 'info',
            message: 'Onboarding email sent',
            userId: user.id,
            emailNumber: nextEmail,
            messageId: result.messageId,
          }));
        } else {
          errors++;
          console.log(JSON.stringify({
            level: 'error',
            tag: '[ONBOARDING-EMAIL-ERROR]',
            message: 'Failed to send onboarding email',
            userId: user.id,
            emailNumber: nextEmail,
            error: result.error,
          }));
        }
      } catch (err) {
        errors++;
        console.log(JSON.stringify({
          level: 'error',
          tag: '[ONBOARDING-EMAIL-ERROR]',
          message: 'Exception sending onboarding email',
          userId: user.id,
          emailNumber: nextEmail,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Onboarding email cron completed',
      eligible: eligibleUsers.length,
      needingEmails: usersNeedingEmails.length,
      sent,
      skipped,
      errors,
      duration: Date.now() - startTime,
    }));

    return NextResponse.json({ processed: usersNeedingEmails.length, sent, skipped, errors });
  } catch (err) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[ONBOARDING-EMAIL-CRON-ERROR]',
      message: 'Onboarding email cron failed',
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - startTime,
    }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
