import { NextRequest, NextResponse } from 'next/server';
import { getDraftById, markDraftAsSent } from '@/lib/dashboard-queries';
import { sendEmail } from '@/lib/email';

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

    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending email via Resend',
      draftId,
      recipientEmail,
      subject: draft.subject,
    }));

    // Send email via Resend
    const result = await sendEmail({
      to: recipientEmail,
      subject: draft.subject,
      body: draft.body,
      replyTo: draft.meetingHostEmail,
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

    console.log(JSON.stringify({
      level: 'info',
      message: 'Email sent and draft marked as sent',
      draftId,
      recipientEmail,
      messageId: result.messageId,
    }));

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
