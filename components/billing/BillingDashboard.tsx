'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PlanHeader } from './PlanHeader';
import { UsageSection } from './UsageSection';
import { PlanSelector } from './PlanSelector';
import { PaymentAndBilling } from './PaymentAndBilling';
import { InvoiceHistory } from './InvoiceHistory';
import type { BillingData } from './billing-types';

export function BillingDashboard() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const planSelectorRef = useRef<HTMLDivElement>(null);

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing');
      if (!response.ok) {
        throw new Error('Failed to fetch billing info');
      }
      const data = await response.json();
      setBilling(data);
      setError(null);
    } catch (err) {
      console.error('[BILLING] Fetch error:', err);
      setError('Unable to load billing information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBilling();
    }
  }, [fetchBilling]);

  const scrollToPlans = useCallback(() => {
    planSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Plan header skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-700 light:bg-gray-200 rounded-xl" />
            <div>
              <div className="h-4 w-20 bg-gray-700 light:bg-gray-200 rounded mb-1.5" />
              <div className="h-7 w-16 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-10 w-24 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-700/60 light:bg-gray-100 rounded" />
        </div>
        {/* Usage skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-4 w-full bg-gray-700/50 light:bg-gray-100 rounded mb-2" />
          <div className="h-2.5 w-full bg-gray-800 light:bg-gray-100 rounded-full" />
        </div>
        {/* Plan selector skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
        {/* Payment + billing grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
              <div className="h-5 w-36 bg-gray-700 light:bg-gray-200 rounded mb-4" />
              <div className="h-16 w-full bg-gray-700/30 light:bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
        {/* Invoice skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full bg-gray-700/30 light:bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-2">{error}</p>
        <button
          onClick={fetchBilling}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!billing) return null;

  return (
    <div className="space-y-6">
      <PlanHeader billing={billing} onScrollToPlans={scrollToPlans} />
      <UsageSection billing={billing} onScrollToPlans={scrollToPlans} />
      <PlanSelector ref={planSelectorRef} currentTier={billing.tier} />
      <PaymentAndBilling billing={billing} onScrollToPlans={scrollToPlans} />
      <InvoiceHistory billing={billing} onScrollToPlans={scrollToPlans} />
    </div>
  );
}
