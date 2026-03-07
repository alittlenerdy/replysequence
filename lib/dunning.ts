/**
 * Dunning email helpers.
 *
 * Sends transactional emails when a user's payment fails, their account
 * becomes past due, or their subscription is cancelled due to non-payment.
 *
 * All emails use the existing `sendEmail` function from `lib/email.ts` and
 * include a link to the Stripe customer billing portal so the user can
 * update their payment method.
 */

import { sendEmail, type SendEmailResult } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.replysequence.com';
const BILLING_URL = `${APP_URL}/dashboard/billing`;

// ── Types ───────────────────────────────────────────────────────────────────

interface DunningUser {
  email: string;
  name: string | null;
}

interface DunningInvoice {
  amount_due?: number;
  currency?: string;
  hosted_invoice_url?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function greeting(user: DunningUser): string {
  return user.name ? `Hi ${user.name}` : 'Hi there';
}

function formatAmount(amountCents: number | undefined, currency: string | undefined): string {
  if (!amountCents) return '';
  const dollars = (amountCents / 100).toFixed(2);
  const currencyLabel = (currency || 'usd').toUpperCase();
  return `$${dollars} ${currencyLabel}`;
}

// ── Email senders ───────────────────────────────────────────────────────────

/**
 * Sent when `invoice.payment_failed` fires for the first time.
 * Tone: friendly, non-alarming, action-oriented.
 */
export async function sendPaymentFailedEmail(
  user: DunningUser,
  invoice: DunningInvoice,
): Promise<SendEmailResult> {
  const amountStr = formatAmount(invoice.amount_due, invoice.currency);

  const subject = 'Action needed: Your payment could not be processed';

  const body = [
    `${greeting(user)},`,
    '',
    `We were unable to process your most recent payment${amountStr ? ` of ${amountStr}` : ''} for ReplySequence. This is usually caused by an expired or declined card.`,
    '',
    'No worries -- your account is still fully active. To keep it that way, please update your payment method within the next 7 days:',
    '',
    `Update payment method: ${BILLING_URL}`,
    '',
    ...(invoice.hosted_invoice_url
      ? [`You can also view and pay the invoice directly: ${invoice.hosted_invoice_url}`, '']
      : []),
    'If you have any questions, just reply to this email.',
    '',
    'Thanks,',
    'The ReplySequence Team',
  ].join('\n');

  console.log(JSON.stringify({
    level: 'info',
    tag: '[DUNNING]',
    message: 'Sending payment failed email',
    to: user.email,
    invoiceAmount: amountStr || 'unknown',
  }));

  return sendEmail({
    to: user.email,
    subject,
    body,
    replyTo: 'support@replysequence.com',
    includeSignature: false,
  });
}

/**
 * Sent when the subscription moves to `past_due` status (second+ failure,
 * or Stripe marks it explicitly).
 * Tone: slightly more urgent, still respectful.
 */
export async function sendSubscriptionPastDueEmail(
  user: DunningUser,
): Promise<SendEmailResult> {
  const subject = 'Your ReplySequence account is past due';

  const body = [
    `${greeting(user)},`,
    '',
    'We have been unable to collect payment for your ReplySequence subscription. Your account is currently past due, and some features may become limited if the balance is not resolved soon.',
    '',
    'Please update your payment method to avoid any interruption:',
    '',
    `Update payment method: ${BILLING_URL}`,
    '',
    'If you are experiencing any issues or need help, just reply to this email and we will sort it out.',
    '',
    'Thanks,',
    'The ReplySequence Team',
  ].join('\n');

  console.log(JSON.stringify({
    level: 'info',
    tag: '[DUNNING]',
    message: 'Sending subscription past due email',
    to: user.email,
  }));

  return sendEmail({
    to: user.email,
    subject,
    body,
    replyTo: 'support@replysequence.com',
    includeSignature: false,
  });
}

/**
 * Sent when the subscription is deleted (cancelled by Stripe due to
 * non-payment). User is being downgraded to the free tier.
 * Tone: clear, empathetic, offers a path back.
 */
export async function sendSubscriptionCancelledEmail(
  user: DunningUser,
): Promise<SendEmailResult> {
  const subject = 'Your ReplySequence subscription has been cancelled';

  const body = [
    `${greeting(user)},`,
    '',
    'Unfortunately, we were unable to collect payment for your ReplySequence subscription after multiple attempts. As a result, your subscription has been cancelled and your account has been moved to the free plan.',
    '',
    'Your data is safe -- we have not deleted anything. You can continue using ReplySequence on the free tier, and you are welcome to re-subscribe at any time:',
    '',
    `Reactivate your subscription: ${BILLING_URL}`,
    '',
    'If this was a mistake or if you need any assistance, please reply to this email.',
    '',
    'Thanks,',
    'The ReplySequence Team',
  ].join('\n');

  console.log(JSON.stringify({
    level: 'info',
    tag: '[DUNNING]',
    message: 'Sending subscription cancelled email',
    to: user.email,
  }));

  return sendEmail({
    to: user.email,
    subject,
    body,
    replyTo: 'support@replysequence.com',
    includeSignature: false,
  });
}
