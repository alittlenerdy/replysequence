'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UsageData {
  draftsUsed: number;
  draftsLimit: number;
  draftsRemaining: number;
}

export function UsageLimitBanner() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/billing');
        if (response.ok) {
          const data = await response.json();
          setTier(data.tier || 'free');
          if (data.usage) {
            setUsage(data.usage);
          }
        }
      } catch {
        // Billing API may not be available
      }
    }
    fetchUsage();
  }, []);

  // Don't show for paid users or when data hasn't loaded
  if (!usage || tier !== 'free' || usage.draftsLimit <= 0) return null;

  const percentage = Math.min(100, (usage.draftsUsed / usage.draftsLimit) * 100);
  const isNearLimit = usage.draftsRemaining <= 2 && usage.draftsRemaining > 0;
  const isAtLimit = usage.draftsRemaining === 0;

  return (
    <div className={`rounded-xl border p-4 ${
      isAtLimit
        ? 'bg-red-500/10 border-red-500/30'
        : isNearLimit
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-gray-800/50 border-gray-700'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-sm font-medium ${
              isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-gray-300'
            }`}>
              {isAtLimit
                ? 'Draft limit reached'
                : `${usage.draftsUsed} of ${usage.draftsLimit} free drafts used this month`
              }
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">Free plan</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isAtLimit && (
            <p className="text-xs text-red-400/70 mt-1.5">
              New drafts will not be generated until next month or until you upgrade.
            </p>
          )}
        </div>
        <Link
          href="/dashboard/pricing"
          className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isAtLimit
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
          }`}
        >
          {isAtLimit ? 'Upgrade to Pro' : 'Upgrade'}
        </Link>
      </div>
    </div>
  );
}
