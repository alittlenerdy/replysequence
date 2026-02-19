'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/db/schema';

// Tier hierarchy for comparison (higher number = higher tier)
const tierRank: Record<string, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

interface CheckoutButtonProps {
  priceId?: string;
  tier: 'free' | 'pro' | 'team';
  currentTier?: SubscriptionTier;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({
  priceId,
  tier,
  currentTier,
  className = '',
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentPlan = currentTier === tier;
  const isDowngrade = currentTier && tierRank[tier] < tierRank[currentTier];
  const isUpgrade = currentTier && tierRank[tier] > tierRank[currentTier];
  const isDisabled = loading || isCurrentPlan;

  const handleCheckout = async () => {
    if (isDisabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setLoading(false);
    }
  };

  // Current plan - disabled button
  if (isCurrentPlan) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed ${className}`}
      >
        {children || 'Current Plan'}
      </button>
    );
  }

  // Downgrade - link to subscription management portal
  if (isDowngrade) {
    const handleManageSubscription = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/stripe/create-portal', {
          method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to open subscription portal');
        }
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col">
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all bg-gray-700 text-white hover:bg-gray-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            children || 'Downgrade'
          )}
        </button>
        {error && (
          <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    );
  }

  // Free tier for non-logged-in users - link to signup
  if (tier === 'free' && !currentTier) {
    return (
      <a
        href="/sign-up"
        className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all bg-gray-700 text-white hover:bg-gray-600 ${className}`}
      >
        {children || 'Get Started'}
      </a>
    );
  }

  // Upgrade button - proceed to checkout
  return (
    <div className="flex flex-col">
      <button
        onClick={handleCheckout}
        disabled={loading || !priceId}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          tier === 'pro'
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
            : 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
        } ${loading || !priceId ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          children || 'Upgrade'
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
