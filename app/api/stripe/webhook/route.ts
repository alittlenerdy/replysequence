import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { computeGracePeriodEnd } from '@/lib/subscription';
import {
  sendPaymentFailedEmail,
  sendSubscriptionPastDueEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/dunning';

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
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`, {
    eventId: event.id,
    livemode: event.livemode,
  });

  // Warn if receiving test mode events in production
  if (!event.livemode && process.env.NODE_ENV === 'production') {
    console.warn('[STRIPE WEBHOOK] Received TEST MODE event in production - this may indicate misconfiguration');
  }

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
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log('[STRIPE WEBHOOK] checkout.session.completed received', {
    customerId,
    subscriptionId,
    sessionId: session.id,
    customerEmail: session.customer_email,
    clientReferenceId: session.client_reference_id,
  });

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
    return;
  }

  console.log(`[STRIPE WEBHOOK] checkout.session.completed: User ${result[0].email} upgraded to ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
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

  // If subscription returned to active, clear dunning state
  if (mappedStatus === 'active') {
    updateData.gracePeriodEndsAt = null;
    updateData.dunningEmailsSent = 0;
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email, name: users.name, dunningEmailsSent: users.dunningEmailsSent });

  if (result.length === 0) {
    return;
  }

  console.log(JSON.stringify({
    level: 'info',
    tag: '[STRIPE WEBHOOK]',
    message: 'Subscription updated',
    userId: result[0].id,
    email: result[0].email,
    status: mappedStatus,
  }));

  // Send past-due dunning email if Stripe moved the subscription to past_due or unpaid
  if (mappedStatus === 'past_due' || mappedStatus === 'unpaid') {
    try {
      await sendSubscriptionPastDueEmail({
        email: result[0].email,
        name: result[0].name,
      });
    } catch (emailError) {
      console.error(JSON.stringify({
        level: 'error',
        tag: '[DUNNING]',
        message: 'Failed to send past-due email from subscription update',
        userId: result[0].id,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      }));
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const endDate = new Date(periodEnd * 1000);

  // Check if this deletion was caused by non-payment (dunning) by reading current user state
  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      dunningEmailsSent: users.dunningEmailsSent,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  const wasDunning = existingUser && existingUser.dunningEmailsSent > 0;

  // Downgrade user to free tier, clear dunning state, mark as canceled
  // Data is kept intact -- only the tier and status change.
  const result = await db
    .update(users)
    .set({
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndDate: endDate,
      gracePeriodEndsAt: null,
      dunningEmailsSent: 0,
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email, name: users.name });

  if (result.length === 0) {
    return;
  }

  console.log(JSON.stringify({
    level: 'info',
    tag: '[STRIPE WEBHOOK]',
    message: 'Subscription deleted, user downgraded to free',
    userId: result[0].id,
    email: result[0].email,
    wasDunning,
    previousTier: existingUser?.subscriptionTier,
  }));

  // Send cancellation email (especially important for dunning-caused cancellations)
  try {
    await sendSubscriptionCancelledEmail({
      email: result[0].email,
      name: result[0].name,
    });
  } catch (emailError) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[DUNNING]',
      message: 'Failed to send cancellation email',
      userId: result[0].id,
      error: emailError instanceof Error ? emailError.message : String(emailError),
    }));
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

  // Clear dunning state on successful payment
  const result = await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate,
      gracePeriodEndsAt: null,
      dunningEmailsSent: 0,
    })
    .where(eq(users.stripeCustomerId, customerId))
    .returning({ id: users.id, email: users.email });

  if (result.length > 0) {
    console.log(JSON.stringify({
      level: 'info',
      tag: '[STRIPE WEBHOOK]',
      message: 'Payment succeeded, dunning state cleared',
      userId: result[0].id,
      email: result[0].email,
      renewedUntil: endDate.toISOString(),
    }));
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) {
    return;
  }

  // Fetch current user to check existing dunning state
  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      dunningEmailsSent: users.dunningEmailsSent,
      gracePeriodEndsAt: users.gracePeriodEndsAt,
    })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!existingUser) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[STRIPE WEBHOOK]',
      message: 'No user found for payment failure',
      stripeCustomerId: customerId,
    }));
    return;
  }

  const isFirstFailure = existingUser.dunningEmailsSent === 0;

  // Build the update: always mark as past_due, increment dunning counter
  const updateData: Record<string, unknown> = {
    subscriptionStatus: 'past_due' as const,
    dunningEmailsSent: existingUser.dunningEmailsSent + 1,
  };

  // On first failure, set the grace period (7 days from now)
  if (isFirstFailure) {
    updateData.gracePeriodEndsAt = computeGracePeriodEnd();
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.stripeCustomerId, customerId));

  console.log(JSON.stringify({
    level: 'warn',
    tag: '[STRIPE WEBHOOK]',
    message: 'Payment failed, dunning state updated',
    userId: existingUser.id,
    email: existingUser.email,
    dunningEmailsSent: existingUser.dunningEmailsSent + 1,
    isFirstFailure,
  }));

  // Send appropriate dunning email
  try {
    if (isFirstFailure) {
      await sendPaymentFailedEmail(
        { email: existingUser.email, name: existingUser.name },
        {
          amount_due: invoice.amount_due ?? undefined,
          currency: invoice.currency ?? undefined,
          hosted_invoice_url: invoice.hosted_invoice_url,
        },
      );
    } else {
      await sendSubscriptionPastDueEmail({
        email: existingUser.email,
        name: existingUser.name,
      });
    }
  } catch (emailError) {
    // Log but do not throw -- webhook processing should not fail due to email issues
    console.error(JSON.stringify({
      level: 'error',
      tag: '[DUNNING]',
      message: 'Failed to send dunning email',
      userId: existingUser.id,
      error: emailError instanceof Error ? emailError.message : String(emailError),
    }));
  }
}
