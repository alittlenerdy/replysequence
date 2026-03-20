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

// Landing page URL for viral signature
const LANDING_PAGE_URL = 'https://www.replysequence.com';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  /** Pre-composed HTML body - bypasses plain-text-to-HTML conversion */
  html?: string;
  from?: string;
  replyTo?: string;
  /** Optional identifier for UTM tracking (e.g., meetingId or draftId) */
  utmContent?: string;
  /** Whether to include the ReplySequence signature footer (default: true) */
  includeSignature?: boolean;
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
  const {
    to,
    subject,
    body,
    html,
    from = DEFAULT_FROM_EMAIL,
    replyTo,
    utmContent,
    includeSignature = true,
  } = params;

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

  console.log(JSON.stringify({
    level: 'info',
    message: 'Sending email via Resend',
    to,
    subject: subject.substring(0, 50),
    from,
    includeSignature,
  }));

  // Add signature footer if enabled
  const bodyWithFooter = includeSignature ? appendPlainTextFooter(body, utmContent) : body;
  // Use pre-composed HTML if provided, otherwise convert plain text to HTML
  const htmlBody = html || formatBodyAsHtml(body, includeSignature, utmContent);

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff: 1s, 2s, 4s
  let lastError: string = 'Unknown error';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html: htmlBody,
        text: bodyWithFooter,
        replyTo: replyTo,
      });

      if (error) {
        lastError = error.message;
        // 4xx errors are client errors (bad request, invalid API key, etc.) — don't retry
        const is4xx = error.message.includes('422') ||
          error.message.includes('400') ||
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404');

        if (is4xx) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Resend API client error (not retrying)',
            error: error.message,
            to,
            attempt: attempt + 1,
          }));
          return { success: false, error: error.message };
        }

        // Retryable error (5xx, rate limit, etc.)
        if (attempt < MAX_RETRIES - 1) {
          console.warn(JSON.stringify({
            level: 'warn',
            message: `Resend API error — retrying in ${RETRY_DELAYS[attempt]}ms`,
            error: error.message,
            to,
            attempt: attempt + 1,
            maxRetries: MAX_RETRIES,
          }));
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }

        // Final attempt failed
        console.error(JSON.stringify({
          level: 'error',
          message: 'Resend API error — all retries exhausted',
          error: error.message,
          to,
          attempts: MAX_RETRIES,
        }));
        return { success: false, error: error.message };
      }

      console.log(JSON.stringify({
        level: 'info',
        message: 'Email sent successfully',
        messageId: data?.id,
        to,
        ...(attempt > 0 ? { retriesUsed: attempt } : {}),
      }));

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';

      if (attempt < MAX_RETRIES - 1) {
        console.warn(JSON.stringify({
          level: 'warn',
          message: `Resend send threw exception — retrying in ${RETRY_DELAYS[attempt]}ms`,
          error: lastError,
          to,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
        }));
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }

      console.error(JSON.stringify({
        level: 'error',
        message: 'Failed to send email — all retries exhausted',
        error: lastError,
        to,
        attempts: MAX_RETRIES,
      }));
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

/**
 * Build UTM-tracked URL for the email signature
 */
function buildSignatureUrl(utmContent?: string): string {
  const params = new URLSearchParams({
    utm_source: 'email_signature',
    utm_medium: 'referral',
    utm_campaign: 'organic_growth',
  });

  if (utmContent) {
    params.set('utm_content', utmContent);
  }

  return `${LANDING_PAGE_URL}?${params.toString()}`;
}

/**
 * Generate HTML email signature footer
 */
function generateHtmlFooter(utmContent?: string): string {
  const signatureUrl = buildSignatureUrl(utmContent);

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
  <tr>
    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; line-height: 1.5;">
      <p style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">
        Sent with <a href="${signatureUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600;">ReplySequence</a>
      </p>
      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px;">
        The follow-up layer for sales
      </p>
      <a href="${signatureUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">
        Try it free →
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Generate plain text email signature footer
 */
function generatePlainTextFooter(utmContent?: string): string {
  const signatureUrl = buildSignatureUrl(utmContent);

  return `
---
Sent with ReplySequence
The follow-up layer for sales
Try it free → ${signatureUrl}
`.trim();
}

/**
 * Append plain text footer to email body
 */
export function appendPlainTextFooter(body: string, utmContent?: string): string {
  const footer = generatePlainTextFooter(utmContent);
  return `${body}\n\n${footer}`;
}

// ── Welcome Email ────────────────────────────────────────────────────────────

interface WelcomeEmailParams {
  email: string;
  name: string | null;
  connectedPlatforms: string[];
  emailConnected: boolean;
  crmConnected: string | null; // 'hubspot' | 'salesforce' | 'sheets' | null
}

/**
 * Send a welcome email when a user completes onboarding.
 * Fire-and-forget — callers should not await this.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<SendEmailResult> {
  const { email, name, connectedPlatforms, emailConnected, crmConnected } = params;
  const greeting = name ? `Hi ${name}` : 'Hi there';
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.replysequence.com'}/dashboard`;

  // Build a summary of what they connected
  const connectionLines: string[] = [];
  if (connectedPlatforms.length > 0) {
    const platformNames = connectedPlatforms.map(p =>
      p === 'meet' ? 'Google Meet' : p === 'teams' ? 'Microsoft Teams' : p.charAt(0).toUpperCase() + p.slice(1)
    );
    connectionLines.push(`Meeting platform: ${platformNames.join(', ')}`);
  }
  if (emailConnected) {
    connectionLines.push('Email: Connected');
  }
  if (crmConnected) {
    const crmName = crmConnected === 'hubspot' ? 'HubSpot' : crmConnected === 'salesforce' ? 'Salesforce' : 'Google Sheets';
    connectionLines.push(`CRM: ${crmName}`);
  }

  const connectionSummary = connectionLines.length > 0
    ? `Here is what you have set up:\n${connectionLines.map(l => `  - ${l}`).join('\n')}`
    : 'You can connect your meeting platform, email, and CRM from the dashboard at any time.';

  const body = [
    `${greeting},`,
    '',
    'Welcome to ReplySequence! You are all set.',
    '',
    connectionSummary,
    '',
    'What happens next:',
    '  - After your next meeting, we will generate a follow-up draft within 5 minutes.',
    '  - You will get a notification to review and send it -- or it sends automatically if you chose that option.',
    '',
    `Head back to your dashboard whenever you are ready: ${dashboardUrl}`,
    '',
    'If you have any questions, just reply to this email.',
    '',
    'Thanks,',
    'The ReplySequence Team',
  ].join('\n');

  console.log(JSON.stringify({
    level: 'info',
    tag: '[WELCOME]',
    message: 'Sending welcome email',
    to: email,
  }));

  return sendEmail({
    to: email,
    subject: "You're all set -- ReplySequence is ready",
    body,
    replyTo: 'support@replysequence.com',
    includeSignature: false,
  });
}

/**
 * Convert plain text body to simple HTML
 * Preserves line breaks and basic formatting
 */
export function formatBodyAsHtml(body: string, includeSignature: boolean = true, utmContent?: string): string {
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

  // Generate signature footer HTML if enabled
  const signatureHtml = includeSignature ? generateHtmlFooter(utmContent) : '';

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
${signatureHtml}
</body>
</html>
`.trim();
}
