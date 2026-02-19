import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { sendEmail } from '@/lib/email';
import { TONE_OPTIONS } from '@/lib/constants/ai-settings';

/**
 * POST /api/drafts/test-email — Send a static preview email to the current user.
 *
 * Purpose: Let users verify email delivery + see how their configured tone,
 * instructions, and signature appear in a real inbox.
 * No Claude API call — instant, free, no rate limits.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: 'No email address found on your account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tone = 'professional', customInstructions = '', signature = '' } = body;

    // Build preview email content
    const toneOption = TONE_OPTIONS.find(o => o.value === tone) || TONE_OPTIONS[0];
    const subject = `[Test] ${toneOption.subjectExample}`;

    // Static body that showcases the selected tone
    let emailBody = `Hi there,\n\nThis is a test email from ReplySequence to show you how your follow-up emails will look.\n\n--- Tone: ${toneOption.label} ---\n\n${toneOption.preview}`;

    if (customInstructions.trim()) {
      emailBody += `\n\n--- Your Custom Instructions ---\n${customInstructions.trim()}`;
    }

    if (signature.trim()) {
      emailBody += `\n\n${signature.trim()}`;
    } else {
      emailBody += '\n\nBest regards,\nYour Name';
    }

    const result = await sendEmail({
      to: email,
      subject,
      body: emailBody,
      includeSignature: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Test email endpoint failed',
      error: err instanceof Error ? err.message : String(err),
    }));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
