import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PricingCards } from '@/components/PricingCards';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICES, STRIPE_ANNUAL_PRICES } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for ReplySequence. Start free with 5 AI drafts/month, upgrade to Pro for unlimited drafts, or go Team for CRM sync and collaboration.',
  openGraph: {
    title: 'Pricing | ReplySequence',
    description: 'Simple, transparent pricing for ReplySequence. Start free, upgrade when you need more power.',
    url: 'https://www.replysequence.com/pricing',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/pricing',
  },
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
    annualPrice: 15, // ~21% discount
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
    annualPrice: 24, // ~17% discount
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

async function PricingContent() {
  const user = await currentUser();
  let currentTier: SubscriptionTier = 'free';
  let hasStripeCustomer = false;

  if (user) {
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

  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className={isLoggedIn ? 'pt-36 pb-4 px-4' : 'pt-32 pb-4 px-4'}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className={`font-display font-bold mb-6 text-white light:text-gray-900 ${isLoggedIn ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'}`}>
            {isLoggedIn ? 'Manage Your Plan' : (
              <>
                Simple, Transparent{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
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
        isLoggedIn={isLoggedIn}
      />

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
                {
                  q: 'Do you offer annual billing?',
                  a: 'Yes! Switch to annual billing to save up to 20%. Toggle between monthly and annual at the top of the pricing cards.',
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
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              Get Started Free
            </a>
          </div>
        </section>
      )}

      {/* Footer - only for non-logged in users */}
      {!isLoggedIn && (
        <Footer />
      )}

      {/* JSON-LD Pricing Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ReplySequence",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": [
              {
                "@type": "Offer",
                "name": "Free",
                "price": "0",
                "priceCurrency": "USD",
                "description": "5 AI drafts per month, unlimited meetings",
              },
              {
                "@type": "Offer",
                "name": "Pro Monthly",
                "price": "19",
                "priceCurrency": "USD",
                "billingIncrement": "P1M",
                "description": "Unlimited AI drafts, custom templates, priority processing",
              },
              {
                "@type": "Offer",
                "name": "Pro Annual",
                "price": "180",
                "priceCurrency": "USD",
                "billingIncrement": "P1Y",
                "description": "Unlimited AI drafts, custom templates, priority processing - save 20%",
              },
              {
                "@type": "Offer",
                "name": "Team Monthly",
                "price": "29",
                "priceCurrency": "USD",
                "billingIncrement": "P1M",
                "description": "Everything in Pro plus CRM sync, team collaboration, API access",
              },
              {
                "@type": "Offer",
                "name": "Team Annual",
                "price": "288",
                "priceCurrency": "USD",
                "billingIncrement": "P1Y",
                "description": "Everything in Pro plus CRM sync, team collaboration, API access - save 17%",
              },
            ],
          }),
        }}
      />
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
