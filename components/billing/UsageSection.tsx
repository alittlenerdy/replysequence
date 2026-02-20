'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { BillingData } from './billing-types';

interface UsageSectionProps {
  billing: BillingData;
  onScrollToPlans: () => void;
}

export function UsageSection({ billing, onScrollToPlans }: UsageSectionProps) {
  const { usage, tier } = billing;
  const isUnlimited = usage.draftsLimit === -1;
  const pct = !isUnlimited && usage.draftsLimit > 0
    ? Math.min(100, Math.round((usage.draftsUsed / usage.draftsLimit) * 100))
    : 0;
  const isWarning = pct > 80;
  const isAtLimit = !isUnlimited && usage.draftsRemaining === 0;

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-4">Usage This Month</h3>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-400 light:text-gray-500">Drafts generated</span>
          <span className="text-sm font-medium text-white light:text-gray-900">
            {usage.draftsUsed}{isUnlimited ? '' : ` / ${usage.draftsLimit}`}
            {isUnlimited && (
              <span className="text-gray-500 ml-1">(unlimited)</span>
            )}
          </span>
        </div>

        {!isUnlimited && (
          <div className="h-2.5 bg-gray-800 light:bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {isAtLimit && (
          <p className="text-xs text-red-400 mt-1.5">
            Draft limit reached. New drafts will not be generated until next month.
          </p>
        )}

        {isWarning && !isAtLimit && !isUnlimited && (
          <p className="text-xs text-amber-400 mt-1">
            {usage.draftsRemaining} draft{usage.draftsRemaining !== 1 ? 's' : ''} remaining this month
          </p>
        )}
      </div>

      {/* Upgrade recommendation for free users near limit */}
      {tier === 'free' && isWarning && (
        <button
          onClick={onScrollToPlans}
          className="mt-4 w-full flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/10 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">Upgrade to Pro for unlimited drafts</span>
          </div>
          <span className="text-xs text-indigo-400/60 group-hover:text-indigo-400 transition-colors">
            $19/mo &rarr;
          </span>
        </button>
      )}
    </div>
  );
}
