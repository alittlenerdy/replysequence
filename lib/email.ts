/**
 * Email sending via Resend
 *
 * Handles sending follow-up emails generated from meeting transcripts.
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ReplySequence <noreply@resend.dev>';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, body, from = DEFAULT_FROM_EMAIL, replyTo } = params;

  if (!process.env.RESEND_API_KEY) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'RESEND_API_KEY not configured',
    }));
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending email via Resend',
      to,
      subject: subject.substring(0, 50),
      from,
    }));

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: formatBodyAsHtml(body),
      text: body,
      replyTo: replyTo,
    });

    if (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Resend API error',
        error: error.message,
        to,
      }));
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Email sent successfully',
      messageId: data?.id,
      to,
    }));

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to send email',
      error: errorMessage,
      to,
    }));
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Convert plain text body to simple HTML
 * Preserves line breaks and basic formatting
 */
function formatBodyAsHtml(body: string): string {
  // Escape HTML entities
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert line breaks to <br> and wrap in paragraphs
  const paragraphs = escaped
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p {
      margin: 0 0 1em 0;
    }
  </style>
</head>
<body>
${paragraphs}
</body>
</html>
`.trim();
}
