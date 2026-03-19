'use client';

import { useState } from 'react';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import Link from 'next/link';
import { BillingToggle } from './BillingToggle';
import { CheckoutButton } from './CheckoutButton';
import type { SubscriptionTier } from '@/lib/db/schema';

interface PricingTier {
  name: string;
  tier: 'free' | 'pro' | 'team';
  monthlyPrice: number;
  annualPrice: number;
  tagline?: string;
  description: string;
  features: string[];
  monthlyPriceId?: string;
  annualPriceId?: string;
  highlighted?: boolean;
  icon: 'zap' | 'sparkles' | 'building';
  ctaText?: string;
  valueJustification?: string;
}

const icons = {
  zap: Zap,
  sparkles: Sparkles,
  building: Building2,
};

// Tier hierarchy for comparison
const tierRank: Record<string, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

function getButtonText(targetTier: string, currentTier: string, ctaText?: string): string {
  if (targetTier === currentTier) return 'Current Plan';
  if (tierRank[targetTier] < tierRank[currentTier]) return 'Downgrade';
  return ctaText || 'Upgrade';
}

function renderFeature(feature: string) {
  // Handle **bold** markdown in feature text
  const parts = feature.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="font-semibold text-white light:text-gray-900">{part.slice(2, -2)}</span>;
    }
    return part;
  });
}

interface PricingCardsProps {
  tiers: PricingTier[];
  currentTier: SubscriptionTier;
  isLoggedIn: boolean;
  variant?: 'page' | 'embedded';
}

export function PricingCards({ tiers, currentTier, isLoggedIn, variant = 'page' }: PricingCardsProps) {
  const isEmbedded = variant === 'embedded';
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <>
      {/* Billing Toggle - only show for non-free users viewing the page */}
      <BillingToggle
        onIntervalChange={setBillingInterval}
        defaultInterval="monthly"
      />

      {/* Pricing Cards */}
      <section className={isEmbedded ? 'pb-4 px-2 pt-4' : isLoggedIn ? 'pb-12 px-4 pt-8' : 'pb-20 px-4 pt-8'}>
        <div className={isEmbedded ? '' : 'max-w-6xl mx-auto'}>
          <div className={`grid grid-cols-1 md:grid-cols-3 ${isEmbedded ? 'gap-4' : 'gap-6 lg:gap-8'}`}>
            {tiers.map((tier) => {
              const Icon = icons[tier.icon];
              const isCurrentPlan = currentTier === tier.tier;
              const isAnnual = billingInterval === 'annual';
              const displayPrice = tier.tier === 'free' ? 0 : (isAnnual ? tier.annualPrice : tier.monthlyPrice);
              const priceId = tier.tier === 'free' ? undefined : (isAnnual ? tier.annualPriceId : tier.monthlyPriceId);
              const annualTotal = tier.annualPrice * 12;
              const monthlySavings = tier.monthlyPrice - tier.annualPrice;

              return (
                <div
                  key={tier.name}
                  className={`relative transition-[border-color,box-shadow,transform] duration-300 ${
                    isEmbedded ? 'p-4 lg:p-5' : tier.highlighted ? 'p-7 lg:p-9' : 'p-6 lg:p-8'
                  } ${
                    tier.highlighted
                      ? `rounded-2xl border-2 border-[#6366F1]/50 ring-1 ring-[#6366F1]/20 bg-[#0F172A] light:bg-white shadow-2xl shadow-[#6366F1]/15 ${isEmbedded ? '' : 'md:scale-[1.04]'} z-10`
                      : tier.tier === 'free'
                        ? 'glass-border rounded-2xl opacity-90'
                        : 'glass-border rounded-2xl'
                  }`}
                >
                  {/* Most Popular Badge */}
                  {tier.highlighted && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6366F1] text-white text-sm font-semibold shadow-lg shadow-[#6366F1]/30">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-sm font-semibold border border-[#6366F1]/30">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6 mt-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      tier.highlighted
                        ? 'bg-[#6366F1]/20'
                        : 'bg-gray-800 light:bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        tier.highlighted
                          ? 'text-[#6366F1]'
                          : 'text-gray-400 light:text-gray-600'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-1">
                      {tier.name}
                    </h3>
                    {tier.tagline && (
                      <p className="text-sm text-white/70 light:text-gray-500 mb-2">
                        {tier.tagline}
                      </p>
                    )}
                    <p className="text-gray-400 light:text-gray-600 text-sm">
                      {tier.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className={isEmbedded ? 'mb-4' : 'mb-6'}>
                    <span className={`${isEmbedded ? 'text-3xl' : 'text-4xl'} font-bold neon-text transition-opacity duration-300 tabular-nums`}>
                      ${displayPrice}
                    </span>
                    {tier.tier !== 'free' && (
                      <span className="text-gray-400 light:text-gray-600">
                        /mo
                      </span>
                    )}
                    {isAnnual && tier.tier !== 'free' && (
                      <div className="mt-1 text-sm text-gray-500 light:text-gray-400 tabular-nums">
                        billed annually at ${annualTotal}
                      </div>
                    )}
                    {tier.valueJustification && (
                      <p className="mt-2 text-xs text-[#06B6D4] light:text-teal-600 font-medium">
                        {tier.valueJustification}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className={isEmbedded ? 'mb-5' : 'mb-8'}>
                    <CheckoutButton
                      tier={tier.tier}
                      priceId={priceId}
                      currentTier={currentTier}
                      className="w-full"
                      variant={tier.tier === 'free' ? 'secondary' : 'primary'}
                    >
                      {getButtonText(tier.tier, currentTier, tier.ctaText)}
                    </CheckoutButton>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          tier.highlighted
                            ? 'text-[#6366F1]'
                            : 'text-[#6366F1]'
                        }`} />
                        <span className="text-gray-300 light:text-gray-700 text-sm">
                          {renderFeature(feature)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {!isLoggedIn && !isEmbedded && (
          <p className="text-center text-sm text-[#8892B0] light:text-gray-500 mt-8">
            Not sure yet?{' '}
            <Link href="/demo" className="text-[#6366F1] hover:underline font-medium">Watch the demo</Link>
            {' '}to see ReplySequence in action.
          </p>
        )}
      </section>
    </>
  );
}
