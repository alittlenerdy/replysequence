import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { PricingCards } from '@/components/PricingCards';
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

function PricingLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero section */}
      <section className="pb-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="h-10 w-64 bg-gray-700 light:bg-gray-200 rounded mx-auto mb-6" />
          <div className="h-5 w-96 max-w-full bg-gray-700/60 light:bg-gray-200 rounded mx-auto" />
        </div>
      </section>
      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="h-10 w-48 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>
      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`bg-gray-900/50 light:bg-white border rounded-2xl p-6 ${
              i === 2
                ? 'border-blue-500/50 light:border-blue-400'
                : 'border-gray-700 light:border-gray-200'
            }`}
          >
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl mb-4" />
            <div className="h-6 w-16 bg-gray-700 light:bg-gray-200 rounded mb-1" />
            <div className="h-10 w-20 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-full bg-gray-700/50 light:bg-gray-100 rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded-full shrink-0" />
                  <div className="h-3 bg-gray-700/50 light:bg-gray-100 rounded" style={{ width: `${60 + j * 8}%` }} />
                </div>
              ))}
            </div>
            <div className="h-11 w-full bg-gray-700 light:bg-gray-200 rounded-xl mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function PricingContent() {
  const user = await currentUser();

  if (!user) {
    redirect('/pricing');
  }

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
    <>
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
    </>
  );
}

export default function DashboardPricingPage() {
  return (
    <Suspense fallback={<PricingLoadingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}
