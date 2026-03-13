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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#5B6CFF]/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#5B6CFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        </div>
        <h3 className="text-lg font-semibold text-white light:text-gray-900">Usage This Month</h3>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-400 light:text-gray-500">Drafts generated</span>
          <span className="text-sm font-medium text-white light:text-gray-900 tabular-nums">
            {usage.draftsUsed}{isUnlimited ? '' : ` / ${usage.draftsLimit}`}
            {isUnlimited && (
              <span className="text-gray-500 ml-1">(unlimited)</span>
            )}
          </span>
        </div>

        {!isUnlimited && (
          <div className="h-2.5 bg-gray-800 light:bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ${
                isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#5B6CFF]'
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
          className="mt-4 w-full flex items-center justify-between p-3 bg-[#5B6CFF]/5 border border-[#5B6CFF]/20 rounded-xl hover:bg-[#4A5BEE]/10 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5B6CFF]" />
            <span className="text-sm text-[#5B6CFF] font-medium">Upgrade to Pro for unlimited drafts</span>
          </div>
          <span className="text-xs text-[#5B6CFF]/60 group-hover:text-[#5B6CFF] transition-colors">
            $19/mo &rarr;
          </span>
        </button>
      )}
    </div>
  );
}
