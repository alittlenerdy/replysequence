import { NextRequest, NextResponse } from 'next/server';
import { getDraftById, markDraftAsSent } from '@/lib/dashboard-queries';

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

    // TODO: Integrate actual email sending (Resend, SendGrid, etc.)
    // For now, we'll simulate sending by marking the draft as sent
    // In production, you would:
    // 1. Call your email provider API
    // 2. Handle errors and retries
    // 3. Only mark as sent if the API call succeeds

    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending email (simulated)',
      draftId,
      recipientEmail,
      subject: draft.subject,
    }));

    // Simulate a small delay like a real API call would have
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mark draft as sent
    await markDraftAsSent(draftId, recipientEmail);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Draft marked as sent',
      draftId,
      recipientEmail,
    }));

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      // Note: In production, remove this warning
      warning: 'Email sending is simulated. Integrate Resend or SendGrid for actual delivery.',
    });
  } catch (error) {
    console.error('Failed to send draft:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
