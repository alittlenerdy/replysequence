import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkDraftLimit } from '@/lib/usage-limits';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({
        subscription: null,
        paymentMethod: null,
        invoices: [],
        tier: 'free',
      });
    }

    const tier = dbUser.subscriptionTier || 'free';
    let subscription = null;
    let paymentMethod = null;
    let invoices: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
      invoiceUrl: string | null;
    }> = [];

    // If user has a Stripe customer ID, fetch their billing info
    if (dbUser.stripeCustomerId) {
      try {
        // Verify customer exists
        await stripe.customers.retrieve(dbUser.stripeCustomerId);

        // Get subscription details
        if (dbUser.stripeSubscriptionId) {
          const sub = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);
          // Access properties using bracket notation for compatibility with different Stripe API versions
          const subData = sub as unknown as Record<string, unknown>;
          const periodEnd = (subData.current_period_end ?? subData.currentPeriodEnd) as number;
          const cancelAt = (subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd) as boolean;
          const items = subData.items as { data: Array<{ price?: { unit_amount?: number; recurring?: { interval?: string } } }> };

          const trialEnd = (subData.trial_end ?? subData.trialEnd) as number | null;

          subscription = {
            id: sub.id,
            status: sub.status,
            currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
            cancelAtPeriodEnd: cancelAt,
            trialEnd: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
            plan: {
              amount: items?.data?.[0]?.price?.unit_amount || 0,
              interval: items?.data?.[0]?.price?.recurring?.interval || 'month',
              productName: tier === 'pro' ? 'Pro' : tier === 'team' ? 'Team' : 'Free',
            },
          };
        }

        // Get default payment method
        const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId, {
          expand: ['invoice_settings.default_payment_method'],
        });

        if (customer && !customer.deleted) {
          const defaultPM = customer.invoice_settings?.default_payment_method;
          if (defaultPM && typeof defaultPM !== 'string' && defaultPM.type === 'card') {
            paymentMethod = {
              brand: defaultPM.card?.brand || 'unknown',
              last4: defaultPM.card?.last4 || '****',
              expMonth: defaultPM.card?.exp_month || 0,
              expYear: defaultPM.card?.exp_year || 0,
            };
          }
        }

        // Get recent invoices
        const invoiceList = await stripe.invoices.list({
          customer: dbUser.stripeCustomerId,
          limit: 10,
        });

        invoices = invoiceList.data.map((inv) => ({
          id: inv.id,
          date: new Date(inv.created * 1000).toISOString(),
          amount: inv.amount_paid / 100,
          status: inv.status || 'unknown',
          invoiceUrl: inv.hosted_invoice_url ?? null,
        }));
      } catch (error) {
        // Customer might not exist in Stripe (test/live mode mismatch)
        console.error('[BILLING] Error fetching Stripe data:', error);
      }
    }

    // Get usage data for free tier display
    const usage = await checkDraftLimit(dbUser.id);

    return NextResponse.json({
      subscription,
      paymentMethod,
      invoices,
      tier,
      usage: {
        draftsUsed: usage.used,
        draftsLimit: usage.limit,
        draftsRemaining: usage.remaining,
      },
    });
  } catch (error) {
    console.error('[BILLING] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing info' },
      { status: 500 }
    );
  }
}
