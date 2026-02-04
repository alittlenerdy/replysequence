'use client';

import { useState } from 'react';
import { Loader2, Settings2 } from 'lucide-react';

interface ManageSubscriptionButtonProps {
  className?: string;
}

export function ManageSubscriptionButton({ className = '' }: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open subscription portal');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
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
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
          bg-gray-700 light:bg-gray-200 text-white light:text-gray-900
          hover:bg-gray-600 light:hover:bg-gray-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening Portal...
          </>
        ) : (
          <>
            <Settings2 className="w-4 h-4" />
            Manage Subscription
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
