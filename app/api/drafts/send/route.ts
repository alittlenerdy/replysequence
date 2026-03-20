import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { getDraftById, markDraftAsSent } from '@/lib/dashboard-queries';
import { sendEmail, formatBodyAsHtml, appendPlainTextFooter } from '@/lib/email';
import { sendViaConnectedAccount } from '@/lib/email-sender';
import { syncSentEmailToHubSpot, refreshHubSpotToken } from '@/lib/hubspot';
import { syncSentEmailToSheets } from '@/lib/google-sheets';
import { syncSentEmailToSalesforce, refreshSalesforceToken } from '@/lib/salesforce';
import { decrypt, encrypt } from '@/lib/encryption';
import { trackEvent } from '@/lib/analytics';
import { injectTracking } from '@/lib/email-tracking';
import { db, emailEvents, users } from '@/lib/db';
import { meetings, drafts, hubspotConnections, salesforceConnections, emailConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { MeetingPlatform } from '@/lib/db/schema';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';
import { scheduleFollowUpSequence } from '@/lib/sequence-scheduler';
import { incrementContactEmailsSent } from '@/lib/contacts';

const sendDraftSchema = z.object({
  draftId: z.string().uuid(),
  recipientEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, sendDraftSchema);
    if ('error' in parsed) return parsed.error;
    const { draftId, recipientEmail } = parsed.data;

    // Verify draft ownership via meeting
    const [dbUser] = await db
      .select({ id: users.id, emailSendingPaused: users.emailSendingPaused })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email sending is paused due to complaints
    if (dbUser.emailSendingPaused) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Email sending blocked - user paused due to complaints',
        userId: dbUser.id,
        draftId,
      }));
      return NextResponse.json(
        { error: 'Email sending is paused for your account due to multiple spam complaints. Please contact support to resolve this.' },
        { status: 403 }
      );
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

    // Cache meeting userId once — reused for email connection, HubSpot, and Salesforce lookups
    let meetingUserId: string | null = null;
    if (draft.meetingId) {
      const [meetingForUser] = await db
        .select({ userId: meetings.userId })
        .from(meetings)
        .where(eq(meetings.id, draft.meetingId))
        .limit(1);
      meetingUserId = meetingForUser?.userId ?? null;
    }

    // Flywheel: capture the user-edited body and calculate similarity
    const originalBody = draft.originalBody;
    const currentBody = draft.body;

    if (originalBody && currentBody !== originalBody) {
      const { calculateEditDiffScore } = await import('@/lib/flywheel/similarity');
      const editDiffScore = calculateEditDiffScore(originalBody, currentBody);

      await db
        .update(drafts)
        .set({
          userEditedBody: currentBody,
          editDiffScore,
        })
        .where(eq(drafts.id, draftId));

      // Flywheel: check if style profile needs refresh (non-blocking)
      import('@/lib/flywheel/style-profile').then(async ({ shouldRefreshStyleProfile, generateStyleProfile }) => {
        try {
          const needsRefresh = await shouldRefreshStyleProfile(dbUser.id);
          if (needsRefresh) {
            await generateStyleProfile(dbUser.id);
            console.log(JSON.stringify({
              level: 'info',
              message: 'Style profile refreshed',
              userId: dbUser.id,
            }));
          }
        } catch (err) {
          console.log(JSON.stringify({
            level: 'error',
            message: 'Style profile refresh failed',
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      });
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

    // Build properly formatted HTML email with footer and tracking
    let htmlBody = formatBodyAsHtml(draft.body, true, draftId);
    let textBody = appendPlainTextFooter(draft.body, draftId);

    // Inject email tracking (pixel + link wrapping) if trackingId exists
    if (draft.trackingId) {
      htmlBody = injectTracking(htmlBody, draft.trackingId);
      console.log('[SEND-1b] Tracking injected for:', draft.trackingId);
    }

    // Try sending via connected email account (Gmail/Outlook), fall back to Resend
    let result: { success: boolean; messageId?: string; error?: string } | null = null;

    if (draft.meetingId && meetingUserId) {
      try {
        // Look for a default email connection using cached meetingUserId
        const [emailConnection] = await db
          .select()
          .from(emailConnections)
          .where(and(
            eq(emailConnections.userId, meetingUserId),
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
            htmlBody,
            textBody,
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
      } catch (connError) {
        console.error('[SEND-1d] Connected account lookup/send failed, falling back to Resend:', connError);
      }
    }

    // Fall back to Resend if no connected account or if connected account send failed
    if (!result) {
      result = await sendEmail({
        to: recipientEmail,
        subject: draft.subject,
        body: draft.body,
        html: htmlBody,
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

    // Increment contact emailsSent counter (fire-and-forget)
    if (meetingUserId) {
      incrementContactEmailsSent(meetingUserId, recipientEmail).catch(() => {});
    }

    // Store Resend message ID for webhook event correlation (bounce/complaint tracking)
    if (result.messageId) {
      try {
        await db
          .update(drafts)
          .set({ resendMessageId: result.messageId, updatedAt: new Date() })
          .where(eq(drafts.id, draftId));
      } catch (msgIdError) {
        // Log but don't fail - email was already sent
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to store Resend message ID on draft',
          draftId,
          messageId: result.messageId,
          error: msgIdError instanceof Error ? msgIdError.message : String(msgIdError),
        }));
      }
    }

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

    const crmPlatform = (draft.meetingPlatform === 'microsoft_teams' || draft.meetingPlatform === 'google_meet')
      ? draft.meetingPlatform
      : 'zoom';

    // Fetch meeting sentiment for CRM sync (needed by HubSpot + Salesforce)
    let meetingSentiment: { score: number; label: string; tones: string } | null = null;
    if (draft.meetingId) {
      try {
        const [meetingRow] = await db
          .select({ sentimentAnalysis: meetings.sentimentAnalysis })
          .from(meetings)
          .where(eq(meetings.id, draft.meetingId))
          .limit(1);
        if (meetingRow?.sentimentAnalysis) {
          const sa = meetingRow.sentimentAnalysis as { overall: { score: number; label: string; tones: string[] } };
          meetingSentiment = {
            score: sa.overall.score,
            label: sa.overall.label,
            tones: sa.overall.tones.join(', '),
          };
        }
      } catch { /* Non-blocking */ }
    }

    // Run HubSpot, Salesforce, and Google Sheets CRM syncs in parallel
    // All are independent post-send operations — use Promise.allSettled so each
    // can succeed/fail independently without blocking the others.
    let hubspotDetails: {
      synced: boolean;
      contactFound: boolean;
      contactName?: string;
      error?: string;
    } | null = null;

    const crmSyncResults = await Promise.allSettled([
      // HubSpot sync
      (async () => {
        if (!draft.meetingId || !meetingUserId) return;
        try {
          // Look up HubSpot connection using cached meetingUserId
          const [connection] = await db
            .select()
            .from(hubspotConnections)
            .where(eq(hubspotConnections.userId, meetingUserId))
            .limit(1);

          if (!connection) return;

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
              sentimentScore: meetingSentiment?.score,
              sentimentLabel: meetingSentiment?.label,
              emotionalTones: meetingSentiment?.tones,
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
      })(),

      // Google Sheets sync
      (async () => {
        try {
          await syncSentEmailToSheets(dbUser.id, {
            recipientEmail,
            meetingTitle: draft.meetingTopic || 'Meeting',
            meetingDate: draft.meetingStartTime || new Date(),
            platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
            draftSubject: draft.subject,
            draftBody: draft.body,
          });
        } catch (sheetsError) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Google Sheets sync failed (non-blocking)',
            draftId,
            error: sheetsError instanceof Error ? sheetsError.message : String(sheetsError),
          }));
        }
      })(),

      // Salesforce sync
      (async () => {
        if (!draft.meetingId || !meetingUserId) return;
        try {
          // Look up Salesforce connection using cached meetingUserId
          const [sfConnection] = await db
            .select()
            .from(salesforceConnections)
            .where(eq(salesforceConnections.userId, meetingUserId))
            .limit(1);

          if (!sfConnection) return;

          let sfAccessToken = decrypt(sfConnection.accessTokenEncrypted);
          let sfInstanceUrl = sfConnection.instanceUrl;

          if (sfConnection.accessTokenExpiresAt < new Date()) {
            try {
              const refreshTokenDecrypted = decrypt(sfConnection.refreshTokenEncrypted);
              const refreshed = await refreshSalesforceToken(refreshTokenDecrypted);
              sfAccessToken = refreshed.accessToken;
              sfInstanceUrl = refreshed.instanceUrl;
              await db
                .update(salesforceConnections)
                .set({
                  accessTokenEncrypted: encrypt(refreshed.accessToken),
                  instanceUrl: refreshed.instanceUrl,
                  accessTokenExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
                  lastRefreshedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(salesforceConnections.id, sfConnection.id));
            } catch (refreshError) {
              console.error(JSON.stringify({
                level: 'error',
                message: 'Salesforce token refresh failed',
                draftId,
                error: refreshError instanceof Error ? refreshError.message : String(refreshError),
              }));
              sfAccessToken = '';
            }
          }

          if (sfAccessToken) {
            const sfResult = await syncSentEmailToSalesforce(sfInstanceUrl, sfAccessToken, {
              recipientEmail,
              meetingTitle: draft.meetingTopic || 'Meeting',
              meetingDate: draft.meetingStartTime || new Date(),
              platform: crmPlatform as 'zoom' | 'microsoft_teams' | 'google_meet',
              draftSubject: draft.subject,
              draftBody: draft.body,
              fieldMappings: sfConnection.fieldMappings ?? undefined,
              sentimentScore: meetingSentiment?.score,
              sentimentLabel: meetingSentiment?.label,
              emotionalTones: meetingSentiment?.tones,
            });

            if (sfResult.success) {
              await db
                .update(salesforceConnections)
                .set({ lastSyncAt: new Date(), updatedAt: new Date() })
                .where(eq(salesforceConnections.id, sfConnection.id));
            }

            console.log(JSON.stringify({
              level: sfResult.success ? 'info' : 'error',
              message: sfResult.success ? 'Salesforce CRM sync completed' : 'Salesforce CRM sync failed',
              draftId,
              recipientEmail,
              success: sfResult.success,
              contactId: sfResult.contactId,
              error: sfResult.error,
            }));
          }
        } catch (sfError) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Salesforce CRM sync failed (non-blocking)',
            draftId,
            error: sfError instanceof Error ? sfError.message : String(sfError),
          }));
        }
      })(),
    ]);

    // Log any unexpected rejections from Promise.allSettled
    crmSyncResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const labels = ['HubSpot', 'Google Sheets', 'Salesforce'];
        console.error(JSON.stringify({
          level: 'error',
          message: `${labels[index]} CRM sync promise rejected unexpectedly`,
          draftId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        }));
      }
    });

    // Schedule follow-up sequence (non-blocking, runs after response)
    if (draft.meetingId && meetingUserId) {
      scheduleFollowUpSequence({
        draftId,
        meetingId: draft.meetingId,
        userId: meetingUserId,
        recipientEmail,
        sentAt: new Date(),
      }).catch((err) => {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Follow-up sequence scheduling failed (non-blocking)',
          draftId,
          error: err instanceof Error ? err.message : String(err),
        }));
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      hubspotDetails,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'drafts-send' },
    });

    console.error('Failed to send draft:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
