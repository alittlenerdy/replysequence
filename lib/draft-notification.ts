/**
 * Send notification email when a new draft is generated.
 * This is non-blocking — failures are logged but don't affect the draft generation.
 */

import { sendEmail } from './email';
import { db, users } from './db';
import { eq } from 'drizzle-orm';

interface DraftNotificationParams {
  userId: string;
  meetingTopic: string | null;
  draftSubject: string;
  draftId: string;
  meetingPlatform: string;
  qualityScore?: number;
}

export async function sendDraftReadyNotification(params: DraftNotificationParams): Promise<void> {
  const { userId, meetingTopic, draftSubject, draftId, meetingPlatform, qualityScore } = params;

  try {
    // Look up user email from Clerk data stored in users table
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.email) {
      console.log('[DRAFT-NOTIFY] No email found for user:', userId);
      return;
    }

    const platformLabel = {
      zoom: 'Zoom',
      google_meet: 'Google Meet',
      microsoft_teams: 'Microsoft Teams',
    }[meetingPlatform] || meetingPlatform;

    const qualityLabel = qualityScore
      ? qualityScore >= 80
        ? 'Excellent'
        : qualityScore >= 60
        ? 'Good'
        : 'Needs Review'
      : null;

    const dashboardUrl = 'https://replysequence.vercel.app/dashboard';

    const body = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; color: white;">
          <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700;">
            New draft ready for review
          </h2>
          <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px;">
            Your ${platformLabel} meeting just generated a follow-up email.
          </p>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Meeting</p>
            <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">${meetingTopic || 'Untitled Meeting'}</p>

            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Draft Subject</p>
            <p style="margin: 0; font-size: 14px;">${draftSubject}</p>

            ${qualityLabel ? `
              <div style="margin-top: 16px; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${qualityScore && qualityScore >= 80 ? 'rgba(16, 185, 129, 0.15); color: #34d399;' : qualityScore && qualityScore >= 60 ? 'rgba(59, 130, 246, 0.15); color: #60a5fa;' : 'rgba(245, 158, 11, 0.15); color: #fbbf24;'}">
                Quality: ${qualityLabel} (${qualityScore}/100)
              </div>
            ` : ''}
          </div>

          <a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Review Draft
          </a>
        </div>

        <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; text-align: center;">
          Sent by ReplySequence. You can manage notifications in
          <a href="${dashboardUrl.replace('/dashboard', '/dashboard/settings')}" style="color: #3b82f6; text-decoration: none;">Settings</a>.
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `Draft ready: ${draftSubject.slice(0, 60)}`,
      body,
      includeSignature: false,
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Draft ready notification sent',
      userId,
      draftId,
    }));
  } catch (error) {
    // Non-blocking — log and move on
    console.error(JSON.stringify({
      level: 'error',
      message: 'Draft notification failed (non-blocking)',
      userId,
      draftId,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}
