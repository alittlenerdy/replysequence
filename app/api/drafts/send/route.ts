import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDraftById, markDraftAsSent } from '@/lib/dashboard-queries';
import { sendEmail } from '@/lib/email';
import { sendViaConnectedAccount } from '@/lib/email-sender';
import { syncSentEmailToCrm } from '@/lib/airtable';
import { syncSentEmailToHubSpot, refreshHubSpotToken } from '@/lib/hubspot';
import { syncSentEmailToSheets } from '@/lib/google-sheets';
import { decrypt, encrypt } from '@/lib/encryption';
import { trackEvent } from '@/lib/analytics';
import { injectTracking } from '@/lib/email-tracking';
import { db, emailEvents, users } from '@/lib/db';
import { meetings, drafts, hubspotConnections, emailConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { MeetingPlatform } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, recipientEmail } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Verify draft ownership via meeting
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [ownedDraft] = await db
      .select({ id: drafts.id })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(eq(drafts.id, draftId), eq(meetings.userId, dbUser.id)))
      .limit(1);

    if (!ownedDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Fetch the draft with full details
    const draft = await getDraftById(draftId);
    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draft.status === 'sent') {
      return NextResponse.json(
        { error: 'Draft has already been sent' },
        { status: 400 }
      );
    }

    console.log('[SEND-1] Sending email, to:', recipientEmail);
    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending email via Resend',
      draftId,
      recipientEmail,
      subject: draft.subject,
      hasTracking: !!draft.trackingId,
    }));

    // Inject email tracking (pixel + link wrapping) if trackingId exists
    let emailBody = draft.body;
    if (draft.trackingId) {
      emailBody = injectTracking(draft.body, draft.trackingId);
      console.log('[SEND-1b] Tracking injected for:', draft.trackingId);
    }

    // Try sending via connected email account (Gmail/Outlook), fall back to Resend
    let result: { success: boolean; messageId?: string; error?: string } | null = null;

    if (draft.meetingId) {
      try {
        // Get userId from the meeting to look up email connection
        const [meetingForEmail] = await db
          .select({ userId: meetings.userId })
          .from(meetings)
          .where(eq(meetings.id, draft.meetingId))
          .limit(1);

        if (meetingForEmail?.userId) {
          // Look for a default email connection
          const [emailConnection] = await db
            .select()
            .from(emailConnections)
            .where(and(
              eq(emailConnections.userId, meetingForEmail.userId),
              eq(emailConnections.isDefault, true),
            ))
            .limit(1);

          if (emailConnection) {
            console.log('[SEND-1c] Found connected email account, sending via', emailConnection.provider, emailConnection.email);

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
              textBody: draft.body,
              replyTo: draft.meetingHostEmail,
            });

            if (connectedResult.success) {
              result = {
                success: true,
                messageId: connectedResult.messageId,
              };
            } else {
              console.log('[SEND-1d] Connected account send failed, falling back to Resend:', connectedResult.error);
            }
          }
        }
      } catch (connError) {
        console.error('[SEND-1d] Connected account lookup/send failed, falling back to Resend:', connError);
      }
    }

    // Fall back to Resend if no connected account or if connected account send failed
    if (!result) {
      result = await sendEmail({
        to: recipientEmail,
        subject: draft.subject,
        body: emailBody,
        replyTo: draft.meetingHostEmail,
        utmContent: draftId,
        includeSignature: true,
      });
    }

    if (!result.success) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Email send failed',
        draftId,
        recipientEmail,
        error: result.error,
      }));
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Mark draft as sent only after successful email delivery
    await markDraftAsSent(draftId, recipientEmail);

    // Log sent event to email_events table for granular tracking
    if (draft.trackingId) {
      try {
        await db.insert(emailEvents).values({
          draftId,
          trackingId: draft.trackingId,
          eventType: 'sent',
        });
      } catch (eventError) {
        // Log but don't fail - email was already sent
        console.error('[SEND-EVENT] Error logging sent event:', eventError);
      }
    }

    console.log('[SEND-2] Email sent successfully, messageId:', result.messageId);
    console.log(JSON.stringify({
      level: 'info',
      message: 'Email sent and draft marked as sent',
      draftId,
      recipientEmail,
      messageId: result.messageId,
    }));

    // Track analytics event (must await for serverless flush)
    try {
      await trackEvent(
        draft.meetingHostEmail || `draft-${draftId}`,
        'email_sent',
        {
          draft_id: draftId,
          recipient_count: 1,
          from_draft: true,
          crm_logged: false, // Will be updated async
        }
      );
    } catch { /* Analytics should never fail the operation */ }

    // Sync to Airtable CRM (non-blocking - don't await in critical path)
    // This runs after email is confirmed sent
    const crmPlatform = (draft.meetingPlatform === 'microsoft_teams' || draft.meetingPlatform === 'google_meet')
      ? draft.meetingPlatform
      : 'zoom';
    syncSentEmailToCrm({
      recipientEmail,
      meetingTitle: draft.meetingTopic || 'Meeting',
      meetingDate: draft.meetingStartTime || new Date(),
      platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
      draftSubject: draft.subject,
      draftBody: draft.body,
      userId: dbUser.id,
    }).then((crmResult) => {
      console.log(JSON.stringify({
        level: 'info',
        message: 'CRM sync completed',
        draftId,
        recipientEmail,
        crmSuccess: crmResult.success,
        contactFound: crmResult.contactFound,
        meetingRecordId: crmResult.meetingRecordId,
      }));
    }).catch((crmError) => {
      // Log but don't fail - email was already sent successfully
      console.error(JSON.stringify({
        level: 'error',
        message: 'CRM sync failed (non-blocking)',
        draftId,
        recipientEmail,
        error: crmError instanceof Error ? crmError.message : String(crmError),
      }));
    });

    // Sync to HubSpot CRM (awaited to prevent Vercel from killing the function)
    let hubspotDetails: {
      synced: boolean;
      contactFound: boolean;
      contactName?: string;
      error?: string;
    } | null = null;
    if (draft.meetingId) {
      try {
        // Get userId from the meeting
        const [meeting] = await db
          .select({ userId: meetings.userId })
          .from(meetings)
          .where(eq(meetings.id, draft.meetingId!))
          .limit(1);

        if (meeting?.userId) {
          // Look up HubSpot connection for this user
          const [connection] = await db
            .select()
            .from(hubspotConnections)
            .where(eq(hubspotConnections.userId, meeting.userId))
            .limit(1);

          if (connection) {
            // Decrypt access token
            let accessToken = decrypt(connection.accessTokenEncrypted);

            // Check if token is expired; refresh if needed
            if (connection.accessTokenExpiresAt < new Date()) {
              console.log(JSON.stringify({
                level: 'info',
                message: 'HubSpot token expired, refreshing',
                draftId,
              }));

              try {
                const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);
                const refreshed = await refreshHubSpotToken(refreshTokenDecrypted);

                // Update stored tokens
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
                  message: 'HubSpot token refresh failed',
                  draftId,
                  error: refreshError instanceof Error ? refreshError.message : String(refreshError),
                }));
                // Skip sync if token refresh fails — surface error to user
                accessToken = '';
                hubspotDetails = {
                  synced: false,
                  contactFound: false,
                  error: 'HubSpot token expired. Please reconnect in Settings.',
                };
              }
            }

            if (accessToken) {
              // Sync to HubSpot
              const hubspotResult = await syncSentEmailToHubSpot(accessToken, {
                recipientEmail,
                meetingTitle: draft.meetingTopic || 'Meeting',
                meetingDate: draft.meetingStartTime || new Date(),
                platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
                duration: draft.meetingDuration ? draft.meetingDuration * 60 * 1000 : undefined,
                draftSubject: draft.subject,
                draftBody: draft.body,
                fieldMappings: connection.fieldMappings ?? undefined,
              });

              hubspotDetails = {
                synced: hubspotResult.success,
                contactFound: hubspotResult.contactFound,
                contactName: hubspotResult.contactName,
                error: hubspotResult.error,
              };

              // Update lastSyncAt only on success
              if (hubspotResult.success) {
                await db
                  .update(hubspotConnections)
                  .set({ lastSyncAt: new Date(), updatedAt: new Date() })
                  .where(eq(hubspotConnections.id, connection.id));
              }

              console.log(JSON.stringify({
                level: hubspotResult.success ? 'info' : 'error',
                message: hubspotResult.success ? 'HubSpot CRM sync completed' : 'HubSpot CRM sync failed',
                draftId,
                recipientEmail,
                success: hubspotResult.success,
                contactFound: hubspotResult.contactFound,
                engagementId: hubspotResult.engagementId,
                error: hubspotResult.error,
              }));
            }
          }
        }
      } catch (hubspotError) {
        // Log but don't fail - email was already sent successfully
        console.error(JSON.stringify({
          level: 'error',
          message: 'HubSpot CRM sync failed (non-blocking)',
          draftId,
          recipientEmail,
          error: hubspotError instanceof Error ? hubspotError.message : String(hubspotError),
        }));
      }
    }

    // Sync to Google Sheets CRM (non-blocking)
    syncSentEmailToSheets(dbUser.id, {
      recipientEmail,
      meetingTitle: draft.meetingTopic || 'Meeting',
      meetingDate: draft.meetingStartTime || new Date(),
      platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
      draftSubject: draft.subject,
      draftBody: draft.body,
    }).catch((sheetsError) => {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Google Sheets sync failed (non-blocking)',
        draftId,
        error: sheetsError instanceof Error ? sheetsError.message : String(sheetsError),
      }));
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      hubspotDetails,
    });
  } catch (error) {
    console.error('Failed to send draft:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
