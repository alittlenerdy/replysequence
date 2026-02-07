import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import { Header } from '@/components/layout/Header';
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
  title: 'Pricing | ReplySequence',
  description: 'Choose the plan that fits your team. From free to enterprise.',
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

// Tier hierarchy for comparison (higher number = higher tier)
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

async function PricingContent() {
  // Get current user and their subscription
  const user = await currentUser();
  let currentTier: SubscriptionTier = 'free';
  let hasStripeCustomer = false;
  let firstName = 'there';

  if (user) {
    firstName = user.firstName || 'there';
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
  }

  const isPaidUser = currentTier !== 'free' && hasStripeCustomer;
  const isLoggedIn = !!user;

  const pricingContent = (
    <>
      {/* Hero Section */}
      <section className={isLoggedIn ? 'pb-8' : 'pt-32 pb-16 px-4'}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className={`font-display font-bold mb-6 text-white light:text-gray-900 ${isLoggedIn ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>
            {isLoggedIn ? 'Manage Your Plan' : (
              <>
                Simple, Transparent{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Pricing
                </span>
              </>
            )}
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            {isLoggedIn
              ? 'Upgrade, downgrade, or manage your subscription anytime.'
              : 'Choose the plan that works for you. All plans include our core features. Upgrade or downgrade anytime.'}
          </p>

          {/* Manage Subscription Button for paid users */}
          {isPaidUser && (
            <div className="mt-6">
              <ManageSubscriptionButton />
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className={isLoggedIn ? 'pb-12' : 'pb-20 px-4'}>
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
                  {/* Most Popular Badge */}
                  {tier.highlighted && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/30">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Header */}
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

                  {/* Price */}
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

                  {/* CTA Button */}
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

                  {/* Features */}
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

      {/* FAQ Section - only for non-logged in users */}
      {!isLoggedIn && (
        <section className="py-16 px-4 bg-gray-900 light:bg-white border-t border-gray-800 light:border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white light:text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I change plans later?',
                  a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately and billing is prorated.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe integration.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Our Free plan lets you try ReplySequence with limited features. Upgrade when you\'re ready for unlimited AI drafts.',
                },
                {
                  q: 'What happens if I cancel?',
                  a: 'You\'ll keep access until the end of your billing period. Your data is retained for 30 days in case you want to reactivate.',
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 light:bg-gray-50 rounded-xl p-6 border border-gray-700 light:border-gray-200"
                >
                  <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-400 light:text-gray-600">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA - only for non-logged in users */}
      {!isLoggedIn && (
        <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950 light:from-white light:to-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-4">
              Ready to automate your follow-ups?
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-8">
              Start free, upgrade when you need more power.
            </p>
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              Get Started Free
            </a>
          </div>
        </section>
      )}

      {/* Footer - only for non-logged in users */}
      {!isLoggedIn && (
        <footer className="py-8 px-4 border-t border-gray-800 light:border-gray-200 bg-gray-950 light:bg-gray-50">
          <div className="max-w-7xl mx-auto text-center text-gray-500 light:text-gray-600 text-sm">
            <p>&copy; 2026 ReplySequence. Built by Playground Giants.</p>
          </div>
        </footer>
      )}
    </>
  );

  // Wrap in appropriate shell based on auth state
  if (isLoggedIn) {
    return (
      <DashboardShell firstName={firstName} pendingDrafts={0}>
        {pricingContent}
      </DashboardShell>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />
      {pricingContent}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <div className="animate-pulse pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <div className="h-12 w-96 bg-gray-800 light:bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-6 w-64 bg-gray-800 light:bg-gray-200 rounded mx-auto" />
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 light:bg-white rounded-2xl p-8 border border-gray-800 light:border-gray-200">
              <div className="h-12 w-12 bg-gray-800 light:bg-gray-200 rounded-xl mb-4" />
              <div className="h-6 w-24 bg-gray-800 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-40 bg-gray-800 light:bg-gray-200 rounded mb-6" />
              <div className="h-10 w-32 bg-gray-800 light:bg-gray-200 rounded mb-6" />
              <div className="h-12 w-full bg-gray-800 light:bg-gray-200 rounded mb-8" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 w-full bg-gray-800 light:bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PricingContent />
    </Suspense>
  );
}
