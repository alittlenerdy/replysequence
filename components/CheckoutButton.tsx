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
  variant?: 'primary' | 'secondary';
}

export function CheckoutButton({
  priceId,
  tier,
  currentTier,
  className = '',
  children,
  variant = 'primary',
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
        className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${className}`}
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
          className={`btn-secondary-cta inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing{'\u2026'}
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

  // Free tier for non-logged-in users - link to waitlist
  if (tier === 'free' && !currentTier) {
    return (
      <a
        href="/#waitlist"
        className={`btn-secondary-cta inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold ${className}`}
      >
        {children || 'Join Waitlist'}
      </a>
    );
  }

  // Upgrade button - proceed to checkout
  const btnClass = variant === 'secondary' ? 'btn-secondary-cta' : 'btn-cta';

  return (
    <div className="flex flex-col">
      <button
        onClick={handleCheckout}
        disabled={loading || !priceId}
        className={`${btnClass} inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold ${loading || !priceId ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing{'\u2026'}
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
