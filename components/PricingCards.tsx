'use client';

import { useState } from 'react';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import { BillingToggle } from './BillingToggle';
import { CheckoutButton } from './CheckoutButton';
import type { SubscriptionTier } from '@/lib/db/schema';

interface PricingTier {
  name: string;
  tier: 'free' | 'pro' | 'team';
  monthlyPrice: number;
  annualPrice: number; // per month when billed annually
  description: string;
  features: string[];
  monthlyPriceId?: string;
  annualPriceId?: string;
  highlighted?: boolean;
  icon: 'zap' | 'sparkles' | 'building';
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

function getButtonText(targetTier: string, currentTier: string): string {
  if (targetTier === currentTier) return 'Current Plan';
  if (tierRank[targetTier] < tierRank[currentTier]) return 'Downgrade';
  return 'Upgrade';
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
                  className={`relative rounded-2xl transition-all duration-300 ${
                    isEmbedded ? 'p-4 lg:p-5' : 'p-6 lg:p-8'
                  } ${
                    tier.highlighted
                      ? `bg-gradient-to-b from-indigo-500/10 to-indigo-700/10 border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/10 ${isEmbedded ? '' : 'scale-105'} z-10`
                      : 'bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-gray-700 light:hover:border-gray-300'
                  }`}
                >
                  {/* Most Popular Badge */}
                  {tier.highlighted && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold shadow-lg">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-semibold border border-indigo-500/30">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6 mt-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      tier.highlighted
                        ? 'bg-indigo-500/20'
                        : 'bg-gray-800 light:bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        tier.highlighted
                          ? 'text-indigo-400'
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
                  <div className={isEmbedded ? 'mb-4' : 'mb-6'}>
                    <span className={`${isEmbedded ? 'text-3xl' : 'text-4xl'} font-bold text-white light:text-gray-900`}>
                      ${displayPrice}
                    </span>
                    {tier.tier !== 'free' && (
                      <span className="text-gray-400 light:text-gray-600">
                        /month
                      </span>
                    )}
                    {isAnnual && tier.tier !== 'free' && (
                      <div className="mt-1 text-sm text-gray-500 light:text-gray-400">
                        ${annualTotal}/year (save ${monthlySavings * 12}/yr)
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className={isEmbedded ? 'mb-5' : 'mb-8'}>
                    <CheckoutButton
                      tier={tier.tier}
                      priceId={priceId}
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
                            ? 'text-indigo-400'
                            : 'text-indigo-400'
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
    </>
  );
}
