import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe, STRIPE_PRICES, PriceTier } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { priceId, tier } = body as { priceId?: string; tier?: PriceTier };

    // Validate price ID
    const resolvedPriceId = priceId || (tier ? STRIPE_PRICES[tier] : null);
    if (!resolvedPriceId) {
      return NextResponse.json(
        { error: 'Price ID or tier is required' },
        { status: 400 }
      );
    }

    // Check if user exists in our database and get their Stripe customer ID
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    let stripeCustomerId = dbUser?.stripeCustomerId;

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        metadata: {
          clerkId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update user record with Stripe customer ID
      if (dbUser) {
        await db
          .update(users)
          .set({ stripeCustomerId: customer.id })
          .where(eq(users.clerkId, user.id));
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        tier: tier || 'unknown',
      },
      subscription_data: {
        metadata: {
          clerkId: user.id,
        },
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[STRIPE] Checkout session error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
