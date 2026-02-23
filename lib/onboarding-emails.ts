/**
 * Onboarding Email Drip Sequence
 *
 * 4-email series sent over 7 days to guide new users through
 * connecting a platform, generating their first draft, and staying engaged.
 *
 * Smart skipping: emails 2 and 3 are skipped if the user has already
 * completed the relevant action (tracked in user_onboarding table).
 */

import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/db';
import { onboardingEmails } from '@/lib/db/schema';
import type { UserOnboarding } from '@/lib/db/schema';

const BASE_URL = 'https://www.replysequence.com';
const FROM_EMAIL = 'Jimmy at ReplySequence <jimmy@replysequence.com>';

// Hours after signup when each email becomes eligible
const EMAIL_TIMING_HOURS: Record<number, number> = {
  1: 0,    // Immediate
  2: 24,   // +24 hours
  3: 72,   // +3 days
  4: 168,  // +7 days
};

interface OnboardingEmailContent {
  emailNumber: number;
  subject: string;
  plainText: string;
  html: string;
}

/**
 * Generate a signed unsubscribe token for a user
 */
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.CRON_SECRET || 'dev-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(userId)
    .digest('hex');
}

/**
 * Verify an unsubscribe token
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId);
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

function unsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${BASE_URL}/api/onboarding-emails/unsubscribe?userId=${userId}&token=${token}`;
}

function emailFooter(userId: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
  <tr>
    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.5; text-align: center;">
      <p style="margin: 0;">
        You're receiving this because you signed up for ReplySequence.
        <br>
        <a href="${unsubscribeUrl(userId)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from onboarding emails</a>
      </p>
    </td>
  </tr>
</table>`.trim();
}

function wrapHtml(bodyHtml: string, userId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
${bodyHtml}
${emailFooter(userId)}
</body>
</html>`;
}

/**
 * Build email content for a given email number and user
 */
export function getEmailContent(emailNumber: number, userId: string, userName?: string | null): OnboardingEmailContent {
  const firstName = userName?.split(' ')[0] || 'there';

  switch (emailNumber) {
    case 1:
      return {
        emailNumber: 1,
        subject: 'Welcome to ReplySequence',
        plainText: [
          `Hey ${firstName},`,
          '',
          `Welcome to ReplySequence! I'm Jimmy, the founder. I built this because I was tired of spending hours writing follow-up emails after every meeting.`,
          '',
          `Here's how it works:`,
          `1. Connect your meeting platform (Zoom, Google Meet, or Teams)`,
          `2. Have a meeting — we'll automatically capture the transcript`,
          `3. Get an AI-drafted follow-up email ready to review and send`,
          '',
          `Ready to get started? Connect your first platform:`,
          `${BASE_URL}/onboarding`,
          '',
          `If you have any questions, just reply to this email — it comes straight to me.`,
          '',
          `- Jimmy`,
        ].join('\n'),
        html: wrapHtml(`
<p style="margin: 0 0 16px;">Hey ${firstName},</p>

<p style="margin: 0 0 16px;">Welcome to ReplySequence! I'm Jimmy, the founder. I built this because I was tired of spending hours writing follow-up emails after every meeting.</p>

<p style="margin: 0 0 8px;"><strong>Here's how it works:</strong></p>
<ol style="margin: 0 0 16px; padding-left: 24px;">
  <li style="margin-bottom: 4px;">Connect your meeting platform (Zoom, Google Meet, or Teams)</li>
  <li style="margin-bottom: 4px;">Have a meeting — we'll automatically capture the transcript</li>
  <li>Get an AI-drafted follow-up email ready to review and send</li>
</ol>

<p style="margin: 0 0 20px;">Ready to get started?</p>

<a href="${BASE_URL}/onboarding" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Connect Your First Platform</a>

<p style="margin: 20px 0 0; color: #6b7280;">If you have any questions, just reply to this email — it comes straight to me.</p>

<p style="margin: 16px 0 0;">- Jimmy</p>`, userId),
      };

    case 2:
      return {
        emailNumber: 2,
        subject: 'Connect your first meeting platform (60 seconds)',
        plainText: [
          `Hey ${firstName},`,
          '',
          `Quick reminder — you haven't connected a meeting platform yet. It takes about 60 seconds and it's the only setup step you need.`,
          '',
          `We support:`,
          `• Zoom`,
          `• Google Meet`,
          `• Microsoft Teams`,
          '',
          `Once connected, ReplySequence automatically captures transcripts from your meetings and drafts follow-up emails. No manual work.`,
          '',
          `Connect now: ${BASE_URL}/onboarding`,
          '',
          `- Jimmy`,
        ].join('\n'),
        html: wrapHtml(`
<p style="margin: 0 0 16px;">Hey ${firstName},</p>

<p style="margin: 0 0 16px;">Quick reminder — you haven't connected a meeting platform yet. It takes about 60 seconds and it's the only setup step you need.</p>

<p style="margin: 0 0 8px;"><strong>We support:</strong></p>
<ul style="margin: 0 0 16px; padding-left: 24px;">
  <li style="margin-bottom: 4px;">Zoom</li>
  <li style="margin-bottom: 4px;">Google Meet</li>
  <li>Microsoft Teams</li>
</ul>

<p style="margin: 0 0 20px;">Once connected, ReplySequence automatically captures transcripts from your meetings and drafts follow-up emails. No manual work.</p>

<a href="${BASE_URL}/onboarding" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Connect a Platform</a>

<p style="margin: 16px 0 0;">- Jimmy</p>`, userId),
      };

    case 3:
      return {
        emailNumber: 3,
        subject: 'Your meetings are ready for follow-ups',
        plainText: [
          `Hey ${firstName},`,
          '',
          `You've connected your meeting platform — nice! Now the magic happens.`,
          '',
          `After your next meeting, ReplySequence will:`,
          `• Pull the transcript automatically`,
          `• Identify action items and key discussion points`,
          `• Draft a personalized follow-up email for you to review`,
          '',
          `Most users save 15-30 minutes per meeting on follow-ups.`,
          '',
          `Check your dashboard for any drafts: ${BASE_URL}/dashboard`,
          '',
          `- Jimmy`,
        ].join('\n'),
        html: wrapHtml(`
<p style="margin: 0 0 16px;">Hey ${firstName},</p>

<p style="margin: 0 0 16px;">You've connected your meeting platform — nice! Now the magic happens.</p>

<p style="margin: 0 0 8px;"><strong>After your next meeting, ReplySequence will:</strong></p>
<ul style="margin: 0 0 16px; padding-left: 24px;">
  <li style="margin-bottom: 4px;">Pull the transcript automatically</li>
  <li style="margin-bottom: 4px;">Identify action items and key discussion points</li>
  <li>Draft a personalized follow-up email for you to review</li>
</ul>

<p style="margin: 0 0 20px;">Most users save 15-30 minutes per meeting on follow-ups.</p>

<a href="${BASE_URL}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Your Dashboard</a>

<p style="margin: 16px 0 0;">- Jimmy</p>`, userId),
      };

    case 4:
      return {
        emailNumber: 4,
        subject: "How's ReplySequence working for you?",
        plainText: [
          `Hey ${firstName},`,
          '',
          `It's been a week since you signed up — how's everything going?`,
          '',
          `I'd love to hear:`,
          `• Is the draft quality meeting your expectations?`,
          `• Any features you wish existed?`,
          `• Anything confusing or broken?`,
          '',
          `Your feedback directly shapes what I build next. Just hit reply — I read every response.`,
          '',
          `Thanks for giving ReplySequence a shot.`,
          '',
          `- Jimmy`,
        ].join('\n'),
        html: wrapHtml(`
<p style="margin: 0 0 16px;">Hey ${firstName},</p>

<p style="margin: 0 0 16px;">It's been a week since you signed up — how's everything going?</p>

<p style="margin: 0 0 8px;"><strong>I'd love to hear:</strong></p>
<ul style="margin: 0 0 16px; padding-left: 24px;">
  <li style="margin-bottom: 4px;">Is the draft quality meeting your expectations?</li>
  <li style="margin-bottom: 4px;">Any features you wish existed?</li>
  <li>Anything confusing or broken?</li>
</ul>

<p style="margin: 0 0 16px;">Your feedback directly shapes what I build next. Just hit reply — I read every response.</p>

<p style="margin: 0 0 16px;">Thanks for giving ReplySequence a shot.</p>

<p style="margin: 0 0 0;">- Jimmy</p>`, userId),
      };

    default:
      throw new Error(`Invalid email number: ${emailNumber}`);
  }
}

/**
 * Check if an email should be skipped based on user progress
 */
export function shouldSkipEmail(emailNumber: number, onboarding: UserOnboarding | null): boolean {
  if (!onboarding) return false;

  switch (emailNumber) {
    case 1: return false; // Never skip welcome
    case 2: return !!onboarding.platformConnected; // Skip if platform already connected
    case 3: return !!onboarding.draftGenerated; // Skip if draft already generated
    case 4: return false; // Never skip feedback ask
    default: return false;
  }
}

/**
 * Check if enough time has passed since signup for a given email
 */
export function isEmailDue(emailNumber: number, userCreatedAt: Date): boolean {
  const requiredHours = EMAIL_TIMING_HOURS[emailNumber];
  if (requiredHours === undefined) return false;

  const eligibleAt = new Date(userCreatedAt.getTime() + requiredHours * 60 * 60 * 1000);
  return new Date() >= eligibleAt;
}

/**
 * Determine the next email to send for a user.
 * Returns the email number, or null if no email is due.
 */
export function getNextEmailToSend(
  userCreatedAt: Date,
  sentEmailNumbers: number[],
  onboarding: UserOnboarding | null,
): number | null {
  const sentSet = new Set(sentEmailNumbers);

  for (let num = 1; num <= 4; num++) {
    // Already sent
    if (sentSet.has(num)) continue;

    // Not yet due based on timing
    if (!isEmailDue(num, userCreatedAt)) return null; // Earlier emails must be sent/skipped first

    // Should be skipped based on user progress
    if (shouldSkipEmail(num, onboarding)) {
      // Mark as "sent" conceptually — skip and check next
      continue;
    }

    // This email is due and should be sent
    return num;
  }

  return null; // All emails sent or skipped
}

/**
 * Send an onboarding email and record it in the database
 */
export async function sendOnboardingEmail(
  userId: string,
  userEmail: string,
  emailNumber: number,
  userName?: string | null,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const content = getEmailContent(emailNumber, userId, userName);

  const result = await sendEmail({
    to: userEmail,
    subject: content.subject,
    body: content.plainText,
    html: content.html,
    from: FROM_EMAIL,
    replyTo: 'jimmy@replysequence.com',
    includeSignature: false,
  });

  if (result.success) {
    // Record that this email was sent
    await db.insert(onboardingEmails).values({
      userId,
      emailNumber,
      resendMessageId: result.messageId,
    });
  }

  return result;
}
