import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { PricingCards } from '@/components/PricingCards';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICES, STRIPE_ANNUAL_PRICES } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing | Dashboard',
  description: 'Manage your ReplySequence subscription plan.',
};

const pricingTiers = [
  {
    name: 'Free',
    tier: 'free' as const,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out ReplySequence',
    icon: 'zap' as const,
    features: [
      'Unlimited meetings',
      'Basic email templates',
      'ReplySequence branding on emails',
      '5 AI drafts per month',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    monthlyPrice: 19,
    annualPrice: 15,
    description: 'For individuals who want more power',
    icon: 'sparkles' as const,
    highlighted: true,
    monthlyPriceId: STRIPE_PRICES.pro,
    annualPriceId: STRIPE_ANNUAL_PRICES.pro,
    features: [
      'Everything in Free',
      'Unlimited AI drafts',
      'Custom email templates',
      'No ReplySequence branding',
      'Priority AI processing',
      'Advanced editing tools',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    tier: 'team' as const,
    monthlyPrice: 29,
    annualPrice: 24,
    description: 'For growing teams and agencies',
    icon: 'building' as const,
    monthlyPriceId: STRIPE_PRICES.team,
    annualPriceId: STRIPE_ANNUAL_PRICES.team,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'CRM sync (Airtable, HubSpot)',
      'Team sharing & collaboration',
      'Analytics dashboard',
      'API access',
      'White-label exports',
      'Dedicated account manager',
    ],
  },
];

export default async function DashboardPricingPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/pricing');
  }

  const firstName = user.firstName || 'there';
  let currentTier: SubscriptionTier = 'free';
  let hasStripeCustomer = false;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  if (dbUser?.subscriptionTier) {
    currentTier = dbUser.subscriptionTier;
  }
  if (dbUser?.stripeCustomerId) {
    hasStripeCustomer = true;
  }

  const isPaidUser = currentTier !== 'free' && hasStripeCustomer;

  return (
    <DashboardShell firstName={firstName} pendingDrafts={0}>
      {/* Hero Section */}
      <section className="pb-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white light:text-gray-900">
            Manage Your Plan
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            Upgrade, downgrade, or manage your subscription anytime.
          </p>

          {isPaidUser && (
            <div className="mt-6">
              <ManageSubscriptionButton />
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards with Billing Toggle */}
      <PricingCards
        tiers={pricingTiers}
        currentTier={currentTier}
        isLoggedIn={true}
      />
    </DashboardShell>
  );
}
