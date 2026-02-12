import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import { CheckoutButton } from '@/components/CheckoutButton';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICES } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing | Dashboard',
  description: 'Manage your ReplySequence subscription plan.',
};

interface PricingTier {
  name: string;
  tier: 'free' | 'pro' | 'team';
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  priceId?: string;
  highlighted?: boolean;
  icon: typeof Zap;
}

const tierRank: Record<string, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

function getButtonText(targetTier: string, currentTier: string): string {
  if (targetTier === currentTier) return 'Current Plan';
  if (tierRank[targetTier] < tierRank[currentTier]) return 'Downgrade';
  return 'Upgrade';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    description: 'Perfect for trying out ReplySequence',
    icon: Zap,
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
    tier: 'pro',
    price: '$19',
    priceNote: '/month',
    description: 'For individuals who want more power',
    icon: Sparkles,
    highlighted: true,
    priceId: STRIPE_PRICES.pro,
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
    tier: 'team',
    price: '$29',
    priceNote: '/month',
    description: 'For growing teams and agencies',
    icon: Building2,
    priceId: STRIPE_PRICES.team,
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

  // Redirect to public pricing if not logged in
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
      <section className="pb-8">
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

      {/* Pricing Cards */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrentPlan = currentTier === tier.tier;

              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                    tier.highlighted
                      ? 'bg-gradient-to-b from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-105 z-10'
                      : 'bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-gray-700 light:hover:border-gray-300'
                  }`}
                >
                  {tier.highlighted && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/30">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="mb-6 mt-2">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      tier.highlighted
                        ? 'bg-blue-500/20'
                        : 'bg-gray-800 light:bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        tier.highlighted
                          ? 'text-blue-400'
                          : 'text-gray-400 light:text-gray-600'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-gray-400 light:text-gray-600 text-sm">
                      {tier.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white light:text-gray-900">
                      {tier.price}
                    </span>
                    {tier.priceNote && (
                      <span className="text-gray-400 light:text-gray-600">
                        {tier.priceNote}
                      </span>
                    )}
                  </div>

                  <div className="mb-8">
                    <CheckoutButton
                      tier={tier.tier}
                      priceId={tier.priceId}
                      currentTier={currentTier}
                      className="w-full"
                    >
                      {getButtonText(tier.tier, currentTier)}
                    </CheckoutButton>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          tier.highlighted
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`} />
                        <span className="text-gray-300 light:text-gray-700 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
