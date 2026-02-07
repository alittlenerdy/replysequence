import { NextRequest, NextResponse } from 'next/server';
import { getDraftById, markDraftAsSent } from '@/lib/dashboard-queries';
import { sendEmail } from '@/lib/email';
import { syncSentEmailToCrm } from '@/lib/airtable';
import { trackEvent } from '@/lib/analytics';
import { injectTracking } from '@/lib/email-tracking';
import { db, emailEvents } from '@/lib/db';
import type { MeetingPlatform } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
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

    // Fetch the draft
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

    // Send email via Resend with viral signature footer
    const result = await sendEmail({
      to: recipientEmail,
      subject: draft.subject,
      body: emailBody,
      replyTo: draft.meetingHostEmail,
      utmContent: draftId,
      includeSignature: true, // Future: check user settings for paid users
    });

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
    // Map google_meet to zoom for Airtable (only Zoom and Teams supported)
    const crmPlatform = draft.meetingPlatform === 'microsoft_teams' ? 'microsoft_teams' : 'zoom';
    syncSentEmailToCrm({
      recipientEmail,
      meetingTitle: draft.meetingTopic || 'Meeting',
      meetingDate: draft.meetingStartTime || new Date(),
      platform: crmPlatform,
      draftSubject: draft.subject,
      draftBody: draft.body,
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

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Failed to send draft:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
