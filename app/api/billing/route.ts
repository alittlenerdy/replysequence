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
        billingDetails: null,
        invoices: [],
        tier: 'free',
        usage: { draftsUsed: 0, draftsLimit: 5, draftsRemaining: 5 },
      });
    }

    const tier = dbUser.subscriptionTier || 'free';
    let subscription = null;
    let paymentMethod = null;
    let billingDetails = null;
    let invoices: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
      invoiceUrl: string | null;
      pdfUrl: string | null;
      periodStart: string | null;
      periodEnd: string | null;
      planName: string | null;
    }> = [];

    // If user has a Stripe customer ID, fetch their billing info
    if (dbUser.stripeCustomerId) {
      try {
        // Fetch customer with expanded payment method (single call instead of two)
        const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId, {
          expand: ['invoice_settings.default_payment_method'],
        });

        if (customer && !customer.deleted) {
          // Extract billing details
          billingDetails = {
            name: customer.name || null,
            email: customer.email || null,
            address: customer.address
              ? {
                  line1: customer.address.line1 || null,
                  line2: customer.address.line2 || null,
                  city: customer.address.city || null,
                  state: customer.address.state || null,
                  postalCode: customer.address.postal_code || null,
                  country: customer.address.country || null,
                }
              : null,
          };

          // Extract default payment method
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

        // Get subscription details
        if (dbUser.stripeSubscriptionId) {
          const sub = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);
          const subData = sub as unknown as Record<string, unknown>;
          const periodEnd = (subData.current_period_end ?? subData.currentPeriodEnd) as number;
          const cancelAt = (subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd) as boolean;
          const items = subData.items as { data: Array<{ price?: { unit_amount?: number; recurring?: { interval?: string } } }> };
          const trialEnd = (subData.trial_end ?? subData.trialEnd) as number | null;

          const interval = items?.data?.[0]?.price?.recurring?.interval || 'month';

          subscription = {
            id: sub.id,
            status: sub.status,
            currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
            cancelAtPeriodEnd: cancelAt,
            trialEnd: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
            billingInterval: interval as 'month' | 'year',
            plan: {
              amount: items?.data?.[0]?.price?.unit_amount || 0,
              interval,
              productName: tier === 'pro' ? 'Pro' : tier === 'team' ? 'Team' : 'Free',
            },
          };
        }

        // Get recent invoices with enhanced data
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
          pdfUrl: inv.invoice_pdf ?? null,
          periodStart: inv.period_start
            ? new Date(inv.period_start * 1000).toISOString()
            : null,
          periodEnd: inv.period_end
            ? new Date(inv.period_end * 1000).toISOString()
            : null,
          planName: inv.lines?.data?.[0]?.description || null,
        }));
      } catch (error) {
        // Customer might not exist in Stripe (test/live mode mismatch)
        console.error('[BILLING] Error fetching Stripe data:', error);
      }
    }

    // Get usage data
    const usage = await checkDraftLimit(dbUser.id);

    return NextResponse.json({
      subscription,
      paymentMethod,
      billingDetails,
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
