/**
 * Auto-send: Automatically sends a draft email when the user has opted into auto_send.
 * Called from the webhook processing pipeline after draft generation.
 *
 * Determines recipient from meeting participants (non-host emails).
 * Only auto-sends when there's a single clear recipient.
 * Falls back to review mode (notification) for ambiguous cases.
 */

import { db, users } from './db';
import { drafts, meetings, emailConnections, emailEvents, userOnboarding, hubspotConnections } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from './email';
import { sendViaConnectedAccount } from './email-sender';
import { injectTracking } from './email-tracking';
import { syncSentEmailToCrm } from './airtable';
import { syncSentEmailToHubSpot, refreshHubSpotToken } from './hubspot';
import { decrypt, encrypt } from './encryption';
import { markDraftAsSent } from './dashboard-queries';
import type { Participant } from './db/schema';

interface AutoSendResult {
  autoSent: boolean;
  recipientEmail?: string;
  messageId?: string;
  reason?: string; // Why auto-send was skipped
}

/**
 * Check if a user has opted into auto-send.
 * Looks up the user's onboarding preference via their DB user ID.
 */
export async function getUserAutoSendPreference(userId: string): Promise<boolean> {
  try {
    // Get clerkId from users table
    const [user] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.clerkId) return false;

    // Look up onboarding preference
    const [onboarding] = await db
      .select({ emailPreference: userOnboarding.emailPreference })
      .from(userOnboarding)
      .where(eq(userOnboarding.clerkId, user.clerkId))
      .limit(1);

    return onboarding?.emailPreference === 'auto_send';
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[AUTO-SEND]',
      message: 'Failed to check auto-send preference',
      userId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return false;
  }
}

/**
 * Determine the auto-send recipient from meeting participants.
 * Returns a single email if there's exactly one non-host participant with an email.
 * Returns null if ambiguous (0 or 2+ participants with emails).
 */
export function determineAutoSendRecipient(
  participants: Participant[] | null | undefined,
  hostEmail: string
): string | null {
  if (!participants || participants.length === 0) return null;

  const recipientEmails = participants
    .filter(p => p.email && p.email.toLowerCase() !== hostEmail.toLowerCase())
    .map(p => p.email!);

  // Only auto-send when there's exactly one clear recipient
  if (recipientEmails.length === 1) {
    return recipientEmails[0];
  }

  return null;
}

/**
 * Attempt to auto-send a generated draft.
 * This is the main entry point called from the processing pipeline.
 *
 * Flow:
 * 1. Check user's auto-send preference
 * 2. Determine recipient from meeting participants
 * 3. Send email via connected account or Resend
 * 4. Mark draft as sent
 * 5. Log events and sync CRM (non-blocking)
 */
export async function attemptAutoSend(params: {
  draftId: string;
  meetingId: string;
  userId: string;
}): Promise<AutoSendResult> {
  const { draftId, meetingId, userId } = params;

  try {
    // 1. Check preference
    const isAutoSend = await getUserAutoSendPreference(userId);
    if (!isAutoSend) {
      return { autoSent: false, reason: 'user_preference_review' };
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[AUTO-SEND]',
      message: 'User has auto-send enabled, attempting auto-send',
      draftId,
      meetingId,
    }));

    // 2. Get meeting with participants
    const [meeting] = await db
      .select({
        hostEmail: meetings.hostEmail,
        participants: meetings.participants,
        topic: meetings.topic,
        platform: meetings.platform,
        startTime: meetings.startTime,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return { autoSent: false, reason: 'meeting_not_found' };
    }

    // 3. Determine recipient
    const recipientEmail = determineAutoSendRecipient(
      meeting.participants as Participant[] | null,
      meeting.hostEmail
    );

    if (!recipientEmail) {
      console.log(JSON.stringify({
        level: 'info',
        tag: '[AUTO-SEND]',
        message: 'No single clear recipient, falling back to review',
        draftId,
        participantCount: (meeting.participants as Participant[] | null)?.length || 0,
      }));
      return { autoSent: false, reason: 'ambiguous_recipient' };
    }

    // 4. Fetch draft
    const [draft] = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        status: drafts.status,
        trackingId: drafts.trackingId,
      })
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft || draft.status === 'sent') {
      return { autoSent: false, reason: draft ? 'already_sent' : 'draft_not_found' };
    }

    // 5. Inject tracking
    let emailBody = draft.body;
    if (draft.trackingId) {
      emailBody = injectTracking(draft.body, draft.trackingId);
    }

    // 6. Send via connected account or Resend
    let result: { success: boolean; messageId?: string; error?: string } | null = null;

    try {
      const [emailConnection] = await db
        .select()
        .from(emailConnections)
        .where(and(
          eq(emailConnections.userId, userId),
          eq(emailConnections.isDefault, true),
        ))
        .limit(1);

      if (emailConnection) {
        const connectedResult = await sendViaConnectedAccount({
          connection: {
            provider: emailConnection.provider as 'gmail' | 'outlook',
            email: emailConnection.email,
            accessTokenEncrypted: emailConnection.accessTokenEncrypted,
            refreshTokenEncrypted: emailConnection.refreshTokenEncrypted,
            accessTokenExpiresAt: emailConnection.accessTokenExpiresAt,
            id: emailConnection.id,
          },
          to: recipientEmail,
          subject: draft.subject,
          htmlBody: emailBody,
          textBody: emailBody,
          replyTo: meeting.hostEmail,
        });

        if (connectedResult.success) {
          result = { success: true, messageId: connectedResult.messageId };
        }
      }
    } catch (connError) {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[AUTO-SEND]',
        message: 'Connected account send failed, falling back to Resend',
        error: connError instanceof Error ? connError.message : String(connError),
      }));
    }

    // Fall back to Resend
    if (!result) {
      result = await sendEmail({
        to: recipientEmail,
        subject: draft.subject,
        body: emailBody,
        replyTo: meeting.hostEmail,
        utmContent: draftId,
        includeSignature: true,
      });
    }

    if (!result.success) {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[AUTO-SEND]',
        message: 'Auto-send failed',
        draftId,
        recipientEmail,
        error: result.error,
      }));
      return { autoSent: false, reason: 'send_failed' };
    }

    // 7. Mark draft as sent
    await markDraftAsSent(draftId, recipientEmail);

    // 8. Log email event
    if (draft.trackingId) {
      try {
        await db.insert(emailEvents).values({
          draftId,
          trackingId: draft.trackingId,
          eventType: 'sent',
        });
      } catch { /* Non-blocking */ }
    }

    console.log(JSON.stringify({
      level: 'info',
      tag: '[AUTO-SEND]',
      message: 'Draft auto-sent successfully',
      draftId,
      recipientEmail,
      messageId: result.messageId,
    }));

    // 9. CRM sync (non-blocking)
    const crmPlatform = meeting.platform || 'zoom';
    syncSentEmailToCrm({
      recipientEmail,
      meetingTitle: meeting.topic || 'Meeting',
      meetingDate: meeting.startTime || new Date(),
      platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
      draftSubject: draft.subject,
      draftBody: draft.body,
      userId,
    }).catch((err) => {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[AUTO-SEND]',
        message: 'CRM sync failed (non-blocking)',
        error: err instanceof Error ? err.message : String(err),
      }));
    });

    // HubSpot sync (awaited to prevent Vercel from killing the function)
    await syncAutoSendToHubSpot(userId, draftId, recipientEmail, meeting, draft).catch((err) => {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[AUTO-SEND]',
        message: 'HubSpot sync failed (non-blocking)',
        draftId,
        error: err instanceof Error ? err.message : String(err),
      }));
    });

    return {
      autoSent: true,
      recipientEmail,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[AUTO-SEND]',
      message: 'Auto-send unexpected error',
      draftId,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { autoSent: false, reason: 'unexpected_error' };
  }
}

/**
 * Sync auto-sent email to HubSpot (non-blocking helper)
 */
async function syncAutoSendToHubSpot(
  userId: string,
  draftId: string,
  recipientEmail: string,
  meeting: { topic: string | null; platform: string; startTime: Date | null },
  draft: { subject: string; body: string }
): Promise<void> {
  const [connection] = await db
    .select()
    .from(hubspotConnections)
    .where(eq(hubspotConnections.userId, userId))
    .limit(1);

  if (!connection) return;

  let accessToken = decrypt(connection.accessTokenEncrypted);

  if (connection.accessTokenExpiresAt < new Date()) {
    try {
      const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);
      const refreshed = await refreshHubSpotToken(refreshTokenDecrypted);
      accessToken = refreshed.accessToken;
      await db
        .update(hubspotConnections)
        .set({
          accessTokenEncrypted: encrypt(refreshed.accessToken),
          refreshTokenEncrypted: encrypt(refreshed.refreshToken),
          accessTokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hubspotConnections.id, connection.id));
    } catch (refreshError) {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[AUTO-SEND]',
        message: 'HubSpot token refresh failed',
        userId,
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
      }));
      return; // Skip sync if token refresh fails
    }
  }

  const crmPlatform = meeting.platform || 'zoom';
  const hubspotResult = await syncSentEmailToHubSpot(accessToken, {
    recipientEmail,
    meetingTitle: meeting.topic || 'Meeting',
    meetingDate: meeting.startTime || new Date(),
    platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
    draftSubject: draft.subject,
    draftBody: draft.body,
    fieldMappings: connection.fieldMappings ?? undefined,
  });

  // Only update lastSyncAt on success
  if (hubspotResult.success) {
    await db
      .update(hubspotConnections)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(hubspotConnections.id, connection.id));
  }
}
