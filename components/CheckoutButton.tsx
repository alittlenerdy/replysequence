'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/db/schema';

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
  const isFreeDowngrade = tier === 'free' && currentTier && currentTier !== 'free';
  const isDisabled = loading || isCurrentPlan || !priceId;

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

  // Free tier button - link to signup
  if (tier === 'free') {
    return (
      <a
        href={isCurrentPlan ? '#' : '/sign-up'}
        className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all ${
          isCurrentPlan
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        } ${className}`}
      >
        {isCurrentPlan ? 'Current Plan' : children || 'Get Started'}
      </a>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleCheckout}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          isCurrentPlan
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : tier === 'pro'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
            : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
        } ${isDisabled && !isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          'Current Plan'
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
