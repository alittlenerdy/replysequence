'use client';

import { useState, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { PricingCards } from '@/components/PricingCards';
import { PRICING_TIERS } from '@/lib/constants/pricing-tiers';
import type { SubscriptionTierType } from './billing-types';

interface PlanSelectorProps {
  currentTier: SubscriptionTierType;
}

export const PlanSelector = forwardRef<HTMLDivElement, PlanSelectorProps>(
  function PlanSelector({ currentTier }, ref) {
    const isFree = currentTier === 'free';
    const [expanded, setExpanded] = useState(isFree);

    return (
      <div ref={ref} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/30 light:hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white light:text-gray-900">
            {isFree ? 'Choose Your Plan' : 'Change Plan'}
          </h3>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expanded && (
          <div className="px-2 pb-4">
            <PricingCards
              tiers={PRICING_TIERS}
              currentTier={currentTier}
              isLoggedIn={true}
              variant="embedded"
            />
          </div>
        )}
      </div>
    );
  }
);
