/**
 * Resend Webhook Handler
 *
 * Handles email delivery events from Resend:
 * - email.delivered/opened/clicked: records positive events in email_events table
 * - email.bounced: marks draft as bounced, notifies user
 * - email.complained: tracks complaint, auto-pauses sending after 3 complaints
 * - email.delivery_delayed: logs the delay for monitoring
 *
 * Signature verification uses Svix (Resend's underlying webhook infrastructure).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { eq, sql } from 'drizzle-orm';
import { db, drafts, users } from '@/lib/db';
import { meetings, emailEvents } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import type { BounceType } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Auto-pause email sending after this many complaints
const COMPLAINT_PAUSE_THRESHOLD = 3;

// Resend webhook event types we handle
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained'
  | 'email.delivery_delayed';

// Resend webhook event payload structure
interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce-specific fields
    bounce?: {
      message: string;
      type?: string; // 'hard' or 'soft'
    };
    // Click-specific fields
    click?: {
      link: string;
    };
  };
}

/**
 * Verify Resend webhook signature using Svix.
 * Returns the parsed event on success, null on failure.
 */
function verifyWebhookSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string
): ResendWebhookEvent | null {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If no secret configured, skip verification (development only)
    console.log(JSON.stringify({
      level: 'warn',
      message: 'RESEND_WEBHOOK_SECRET not configured, skipping signature verification',
    }));
    try {
      return JSON.parse(rawBody) as ResendWebhookEvent;
    } catch {
      return null;
    }
  }

  try {
    const wh = new Webhook(webhookSecret);
    const event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendWebhookEvent;
    return event;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[RESEND-WEBHOOK]',
      message: 'Webhook signature verification failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`resend-webhook:${clientId}`, RATE_LIMITS.WEBHOOK);
  if (!rateLimitResult.success) {
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Rate limit exceeded',
      clientId,
    }));
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Extract Svix signature headers
    const svixId = request.headers.get('svix-id') || '';
    const svixTimestamp = request.headers.get('svix-timestamp') || '';
    const svixSignature = request.headers.get('svix-signature') || '';

    // Verify signature
    if (!svixId || !svixTimestamp || !svixSignature) {
      // If RESEND_WEBHOOK_SECRET is set but headers are missing, reject
      if (process.env.RESEND_WEBHOOK_SECRET) {
        console.log(JSON.stringify({
          level: 'warn',
          tag: '[RESEND-WEBHOOK]',
          message: 'Missing Svix signature headers',
        }));
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }
    }

    const event = verifyWebhookSignature(rawBody, svixId, svixTimestamp, svixSignature);
    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: 'Webhook event received',
      eventType: event.type,
      emailId: event.data.email_id,
      to: event.data.to,
    }));

    // Route to appropriate handler
    switch (event.type) {
      case 'email.delivered':
      case 'email.opened':
      case 'email.clicked':
        await handlePositiveEvent(event);
        break;

      case 'email.bounced':
        await handleEmailBounced(event);
        break;

      case 'email.complained':
        await handleEmailComplained(event);
        break;

      case 'email.delivery_delayed':
        await handleDeliveryDelayed(event);
        break;

      case 'email.sent':
        // Logged above, no additional handling needed
        break;

      default:
        console.log(JSON.stringify({
          level: 'info',
          tag: '[RESEND-WEBHOOK]',
          message: 'Unhandled Resend event type',
          eventType: event.type,
        }));
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: 'Webhook processed successfully',
      eventType: event.type,
      emailId: event.data.email_id,
      duration: Date.now() - startTime,
    }));

    // Always return 200 to prevent Resend retries
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(JSON.stringify({
      level: 'error',
      tag: '[RESEND-WEBHOOK]',
      message: 'Webhook processing error',
      error: errorMessage,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }));

    // Return 200 to prevent Resend retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * Handle positive email events (delivered, opened, clicked).
 * Records in email_events table for tracking and Follow-Up Sequence auto-pause.
 */
async function handlePositiveEvent(event: ResendWebhookEvent): Promise<void> {
  const { email_id } = event.data;

  // Map Resend event type to our EmailEventType
  const eventTypeMap: Record<string, 'opened' | 'clicked'> = {
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  };

  // email.delivered is informational — we only persist opens/clicks as actionable events
  if (event.type === 'email.delivered') {
    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: 'Email delivered',
      emailId: email_id,
      to: event.data.to,
    }));
    return;
  }

  const eventType = eventTypeMap[event.type];
  if (!eventType) return;

  // Look up the draft by Resend message ID
  const [draft] = await db
    .select({
      id: drafts.id,
      trackingId: drafts.trackingId,
    })
    .from(drafts)
    .where(eq(drafts.resendMessageId, email_id))
    .limit(1);

  if (!draft || !draft.trackingId) {
    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: `${event.type} event for unknown/untracked email`,
      emailId: email_id,
    }));
    return;
  }

  // Insert email event
  try {
    await db.insert(emailEvents).values({
      draftId: draft.id,
      trackingId: draft.trackingId,
      eventType,
      clickedUrl: event.data.click?.link || null,
    });

    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: `Email ${eventType} event recorded`,
      emailId: email_id,
      draftId: draft.id,
      clickedUrl: event.data.click?.link,
    }));
  } catch (insertError) {
    // Duplicate events are expected (multiple opens) — log and continue
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: `Failed to record ${eventType} event (may be duplicate)`,
      emailId: email_id,
      draftId: draft.id,
      error: insertError instanceof Error ? insertError.message : String(insertError),
    }));
  }
}

/**
 * Handle email.bounced event.
 * Marks the draft as bounced and notifies the user.
 */
async function handleEmailBounced(event: ResendWebhookEvent): Promise<void> {
  const { email_id, bounce } = event.data;
  const bounceMessage = bounce?.message || 'Unknown bounce reason';
  const bounceKind: BounceType = bounce?.type === 'soft' ? 'soft_bounce' : 'hard_bounce';

  // Look up the draft by Resend message ID
  const [draft] = await db
    .select({
      id: drafts.id,
      meetingId: drafts.meetingId,
      subject: drafts.subject,
      sentTo: drafts.sentTo,
    })
    .from(drafts)
    .where(eq(drafts.resendMessageId, email_id))
    .limit(1);

  if (!draft) {
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Bounce event received for unknown email',
      emailId: email_id,
      bounceType: bounceKind,
    }));
    return;
  }

  // Mark draft as bounced
  await db
    .update(drafts)
    .set({
      bounceType: bounceKind,
      bounceReason: bounceMessage,
      bouncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, draft.id));

  console.log(JSON.stringify({
    level: 'info',
    tag: '[RESEND-WEBHOOK]',
    message: 'Draft marked as bounced',
    draftId: draft.id,
    bounceType: bounceKind,
    bounceReason: bounceMessage,
  }));

  // Find the meeting owner to notify them
  const [meeting] = await db
    .select({ userId: meetings.userId, hostEmail: meetings.hostEmail })
    .from(meetings)
    .where(eq(meetings.id, draft.meetingId))
    .limit(1);

  if (!meeting?.userId) {
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Could not find meeting owner for bounce notification',
      draftId: draft.id,
      meetingId: draft.meetingId,
    }));
    return;
  }

  // Look up the user's email
  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, meeting.userId))
    .limit(1);

  if (!user) return;

  // Send bounce notification to the user
  try {
    await sendEmail({
      to: user.email,
      subject: `Email bounce: ${draft.subject}`,
      body: [
        `Hi ${user.name || 'there'},`,
        '',
        `Your follow-up email to ${draft.sentTo || 'the recipient'} has bounced.`,
        '',
        `Subject: ${draft.subject}`,
        `Bounce type: ${bounceKind === 'hard_bounce' ? 'Hard bounce (permanent)' : 'Soft bounce (temporary)'}`,
        `Reason: ${bounceMessage}`,
        '',
        bounceKind === 'hard_bounce'
          ? 'This is a permanent failure. The recipient email address may be invalid or no longer exist. Please verify the email address and try again with the correct one.'
          : 'This is a temporary failure. You may want to try resending the email later.',
        '',
        'You can view and resend the draft from your ReplySequence dashboard.',
        '',
        'Best,',
        'ReplySequence',
      ].join('\n'),
      includeSignature: false,
    });

    console.log(JSON.stringify({
      level: 'info',
      tag: '[RESEND-WEBHOOK]',
      message: 'Bounce notification sent to user',
      userId: meeting.userId,
      userEmail: user.email,
      draftId: draft.id,
    }));
  } catch (notifyError) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[RESEND-WEBHOOK]',
      message: 'Failed to send bounce notification',
      userId: meeting.userId,
      error: notifyError instanceof Error ? notifyError.message : String(notifyError),
    }));
  }
}

/**
 * Handle email.complained event.
 * Increments complaint count and auto-pauses sending after threshold.
 */
async function handleEmailComplained(event: ResendWebhookEvent): Promise<void> {
  const { email_id } = event.data;

  // Look up the draft by Resend message ID
  const [draft] = await db
    .select({
      id: drafts.id,
      meetingId: drafts.meetingId,
      subject: drafts.subject,
      sentTo: drafts.sentTo,
    })
    .from(drafts)
    .where(eq(drafts.resendMessageId, email_id))
    .limit(1);

  if (!draft) {
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Complaint event received for unknown email',
      emailId: email_id,
    }));
    return;
  }

  // Mark draft with complaint bounce type
  await db
    .update(drafts)
    .set({
      bounceType: 'complaint',
      bounceReason: 'Recipient marked email as spam',
      bouncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, draft.id));

  // Find the meeting owner
  const [meeting] = await db
    .select({ userId: meetings.userId })
    .from(meetings)
    .where(eq(meetings.id, draft.meetingId))
    .limit(1);

  if (!meeting?.userId) {
    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Could not find meeting owner for complaint tracking',
      draftId: draft.id,
    }));
    return;
  }

  // Increment complaint count atomically and check if we should pause
  const [updatedUser] = await db
    .update(users)
    .set({
      emailComplaintCount: sql`${users.emailComplaintCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, meeting.userId))
    .returning({ emailComplaintCount: users.emailComplaintCount, email: users.email, name: users.name });

  if (!updatedUser) return;

  console.log(JSON.stringify({
    level: 'info',
    tag: '[RESEND-WEBHOOK]',
    message: 'User complaint count incremented',
    userId: meeting.userId,
    complaintCount: updatedUser.emailComplaintCount,
    draftId: draft.id,
  }));

  // Auto-pause sending if threshold reached
  if (updatedUser.emailComplaintCount >= COMPLAINT_PAUSE_THRESHOLD) {
    await db
      .update(users)
      .set({
        emailSendingPaused: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, meeting.userId));

    console.log(JSON.stringify({
      level: 'warn',
      tag: '[RESEND-WEBHOOK]',
      message: 'Email sending auto-paused due to complaint threshold',
      userId: meeting.userId,
      complaintCount: updatedUser.emailComplaintCount,
      threshold: COMPLAINT_PAUSE_THRESHOLD,
    }));

    // Notify user that their sending has been paused
    try {
      await sendEmail({
        to: updatedUser.email,
        subject: 'Email sending paused on your ReplySequence account',
        body: [
          `Hi ${updatedUser.name || 'there'},`,
          '',
          `We've automatically paused email sending on your ReplySequence account because ${updatedUser.emailComplaintCount} of your sent emails have been marked as spam by recipients.`,
          '',
          'To protect your sender reputation and deliverability, email sending has been temporarily disabled.',
          '',
          'To resume sending:',
          '1. Review your email content to ensure it is relevant to recipients',
          '2. Verify that recipients are expecting follow-up emails from your meetings',
          '3. Contact support at jimmy@playgroundgiants.com to have sending re-enabled',
          '',
          'Best,',
          'ReplySequence',
        ].join('\n'),
        includeSignature: false,
      });
    } catch (notifyError) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[RESEND-WEBHOOK]',
        message: 'Failed to send pause notification',
        userId: meeting.userId,
        error: notifyError instanceof Error ? notifyError.message : String(notifyError),
      }));
    }
  }
}

/**
 * Handle email.delivery_delayed event.
 * Logs the delay for monitoring - no action needed.
 */
async function handleDeliveryDelayed(event: ResendWebhookEvent): Promise<void> {
  const { email_id, to, subject } = event.data;

  console.log(JSON.stringify({
    level: 'warn',
    tag: '[RESEND-WEBHOOK]',
    message: 'Email delivery delayed',
    emailId: email_id,
    to,
    subject: subject?.substring(0, 50),
    createdAt: event.created_at,
  }));

  // No database updates needed - just logging for monitoring
  // If the email eventually bounces, we'll handle it in the bounced event
}
