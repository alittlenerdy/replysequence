import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No request body');
  }

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[STRIPE WEBHOOK] Signature verification failed:', message);
    Sentry.captureException(err, {
      tags: { component: 'stripe-webhook' },
      extra: { reason: 'signature_verification_failed' },
    });
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[STRIPE WEBHOOK] Error handling ${event.type}:`, message);
    Sentry.captureException(err, {
      tags: { component: 'stripe-webhook', eventType: event.type },
    });
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('[STRIPE WEBHOOK] Missing customer or subscription ID in checkout session');
    return;
  }

  // Get subscription details to determine tier
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as Stripe.Subscription;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('[STRIPE WEBHOOK] No price ID found in subscription');
    return;
  }

  // Map price ID to tier
  let tier: 'pro' | 'team';
  if (priceId === STRIPE_PRICES.pro) {
    tier = 'pro';
  } else if (priceId === STRIPE_PRICES.team) {
    tier = 'team';
  } else {
    console.error(`[STRIPE WEBHOOK] Unknown price ID: ${priceId}`);
    Sentry.captureMessage(`Unknown Stripe price ID: ${priceId}`, {
      level: 'warning',
      extra: { customerId, subscriptionId },
    });
    return;
  }

  // Calculate subscription end date (current_period_end is Unix timestamp)
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const endDate = new Date(periodEnd * 1000);

  // Update user in database
  const result = await db
    .update(users)
    .set({
      subscriptionTier: tier,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate,
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length === 0) {
    console.error(`[STRIPE WEBHOOK] No user found with stripeCustomerId: ${customerId}`);
    Sentry.captureMessage('Checkout completed but no user found', {
      level: 'error',
      extra: { customerId, subscriptionId, tier },
    });
    return;
  }

  console.log(`[STRIPE WEBHOOK] checkout.session.completed: User ${result[0].email} upgraded to ${tier}`);
  Sentry.captureMessage(`Stripe webhook: checkout.session.completed`, {
    level: 'info',
    extra: { customerId, subscriptionId, tier, email: result[0].email },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const endDate = new Date(periodEnd * 1000);

  // Map Stripe status to our status type
  const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };

  const mappedStatus = statusMap[status] || 'active';

  // Get the new tier if price changed
  const priceId = subscription.items.data[0]?.price.id;
  let tier: 'pro' | 'team' | undefined;
  if (priceId === STRIPE_PRICES.pro) {
    tier = 'pro';
  } else if (priceId === STRIPE_PRICES.team) {
    tier = 'team';
  }

  const updateData: Record<string, unknown> = {
    subscriptionStatus: mappedStatus,
    subscriptionEndDate: endDate,
  };

  if (tier) {
    updateData.subscriptionTier = tier;
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length > 0) {
    console.log(`[STRIPE WEBHOOK] customer.subscription.updated: User ${result[0].email} status=${mappedStatus}`);
    Sentry.captureMessage(`Stripe webhook: customer.subscription.updated`, {
      level: 'info',
      extra: { customerId, subscriptionId, status: mappedStatus, tier },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const endDate = new Date(periodEnd * 1000);

  // Keep the tier but mark as canceled - user keeps access until end date
  const result = await db
    .update(users)
    .set({
      subscriptionStatus: 'canceled',
      subscriptionEndDate: endDate,
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length > 0) {
    console.log(`[STRIPE WEBHOOK] customer.subscription.deleted: User ${result[0].email} canceled (access until ${endDate.toISOString()})`);
    Sentry.captureMessage(`Stripe webhook: customer.subscription.deleted`, {
      level: 'info',
      extra: { customerId, subscriptionId, endDate: endDate.toISOString() },
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    // One-time payment, not a subscription
    return;
  }

  // Get updated subscription details
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as Stripe.Subscription;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const endDate = new Date(periodEnd * 1000);

  const result = await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate,
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length > 0) {
    console.log(`[STRIPE WEBHOOK] invoice.payment_succeeded: User ${result[0].email} renewed until ${endDate.toISOString()}`);
    Sentry.captureMessage(`Stripe webhook: invoice.payment_succeeded`, {
      level: 'info',
      extra: { customerId, subscriptionId, endDate: endDate.toISOString() },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    return;
  }

  const result = await db
    .update(users)
    .set({
      subscriptionStatus: 'past_due',
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length > 0) {
    console.log(`[STRIPE WEBHOOK] invoice.payment_failed: User ${result[0].email} payment failed`);
    Sentry.captureMessage(`Stripe webhook: invoice.payment_failed`, {
      level: 'warning',
      extra: { customerId, subscriptionId, email: result[0].email },
    });
  }
}
