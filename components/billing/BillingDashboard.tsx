'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CreditCard,
  Calendar,
  Receipt,
  ExternalLink,
  Sparkles,
  Building2,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
} from 'lucide-react';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  plan: {
    amount: number;
    interval: string;
    productName: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoiceUrl: string | null;
}

interface BillingData {
  subscription: Subscription | null;
  paymentMethod: PaymentMethod | null;
  invoices: Invoice[];
  tier: 'free' | 'pro' | 'team';
}

const tierConfig = {
  free: {
    name: 'Free',
    icon: Zap,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    price: '$0',
  },
  pro: {
    name: 'Pro',
    icon: Sparkles,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    price: '$19',
  },
  team: {
    name: 'Team',
    icon: Building2,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    price: '$29',
  },
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  active: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Active' },
  trialing: { icon: Clock, color: 'text-blue-400', label: 'Trial' },
  past_due: { icon: AlertCircle, color: 'text-amber-400', label: 'Past Due' },
  canceled: { icon: AlertCircle, color: 'text-red-400', label: 'Canceled' },
  unpaid: { icon: AlertCircle, color: 'text-red-400', label: 'Unpaid' },
  paid: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Paid' },
  open: { icon: Clock, color: 'text-amber-400', label: 'Open' },
  draft: { icon: Clock, color: 'text-gray-400', label: 'Draft' },
  void: { icon: AlertCircle, color: 'text-gray-400', label: 'Void' },
  incomplete: { icon: Clock, color: 'text-amber-400', label: 'Incomplete' },
  incomplete_expired: { icon: AlertCircle, color: 'text-red-400', label: 'Expired' },
  paused: { icon: Clock, color: 'text-gray-400', label: 'Paused' },
};

// Default status for unknown values
const defaultStatus = { icon: Clock, color: 'text-gray-400', label: 'Unknown' };

function CardBrandIcon({ brand }: { brand: string }) {
  // Simple card brand indicator
  const brandColors: Record<string, string> = {
    visa: 'text-blue-400',
    mastercard: 'text-orange-400',
    amex: 'text-blue-500',
    discover: 'text-orange-500',
    default: 'text-gray-400',
  };

  return (
    <div className={`font-bold uppercase text-sm ${brandColors[brand.toLowerCase()] || brandColors.default}`}>
      {brand}
    </div>
  );
}

export function BillingDashboard() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Shimmer loading skeletons */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="h-6 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-10 w-24 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
              <div className="h-12 w-full bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-2">{error}</p>
        <button
          onClick={fetchBilling}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  if (!billing) return null;

  const tierInfo = tierConfig[billing.tier] || tierConfig.free;
  const TierIcon = tierInfo.icon;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative bg-gray-900/50 light:bg-white border ${tierInfo.borderColor} rounded-2xl p-6 overflow-hidden`}
      >
        {/* Background decoration */}
        <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full ${tierInfo.bgColor} blur-3xl opacity-50`} />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${tierInfo.bgColor} flex items-center justify-center`}>
                <TierIcon className={`w-6 h-6 ${tierInfo.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400 light:text-gray-500">Current Plan</p>
                <h3 className="text-2xl font-bold text-white light:text-gray-900">{tierInfo.name}</h3>
              </div>
            </div>

            {billing.subscription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-white light:text-gray-900">
                    ${(billing.subscription.plan.amount / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-400 light:text-gray-500">
                    /{billing.subscription.plan.interval}
                  </span>
                  {billing.subscription.status && (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      statusConfig[billing.subscription.status]?.color || 'text-gray-400'
                    } bg-gray-800 light:bg-gray-100`}>
                      {statusConfig[billing.subscription.status]?.label || billing.subscription.status}
                    </span>
                  )}
                </div>
                {billing.subscription.status === 'trialing' && billing.subscription.trialEnd && (
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      {(() => {
                        const daysRemaining = Math.ceil(
                          (new Date(billing.subscription.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        return daysRemaining > 0
                          ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in trial`
                          : 'Trial ends today';
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {billing.subscription.status === 'trialing'
                      ? 'Billing starts'
                      : billing.subscription.cancelAtPeriodEnd
                        ? 'Cancels'
                        : 'Renews'} on{' '}
                    {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 light:text-gray-500">
                {billing.tier === 'free'
                  ? 'You are on the free plan with limited features'
                  : 'No active subscription found'}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {billing.tier !== 'free' && billing.subscription && (
              <ManageSubscriptionButton />
            )}
            {billing.tier === 'free' && (
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                  bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                  hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade Plan
              </Link>
            )}
            {billing.tier !== 'team' && billing.tier !== 'free' && (
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                  bg-gray-700 light:bg-gray-200 text-white light:text-gray-900
                  hover:bg-gray-600 light:hover:bg-gray-300"
              >
                View Plans
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-400 light:text-gray-500" />
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Payment Method</h3>
          </div>

          {billing.paymentMethod ? (
            <div className="flex items-center justify-between p-4 bg-gray-800/50 light:bg-gray-50 rounded-xl border border-gray-700 light:border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-700 light:bg-gray-200 rounded flex items-center justify-center">
                  <CardBrandIcon brand={billing.paymentMethod.brand} />
                </div>
                <div>
                  <p className="font-medium text-white light:text-gray-900">
                    •••• •••• •••• {billing.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-400 light:text-gray-500">
                    Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-800/50 light:bg-gray-50 rounded-xl border border-gray-700 light:border-gray-200 text-center">
              <p className="text-gray-400 light:text-gray-500">No payment method on file</p>
              {billing.tier === 'free' && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                >
                  Add payment method
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Billing Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-gray-400 light:text-gray-500" />
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Billing Summary</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
              <span className="text-gray-400 light:text-gray-500">Current Plan</span>
              <span className="font-semibold text-white light:text-gray-900">{tierInfo.name}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
              <span className="text-gray-400 light:text-gray-500">Monthly Cost</span>
              <span className="font-semibold text-white light:text-gray-900">{tierInfo.price}/mo</span>
            </div>
            {billing.subscription && (
              <div className="flex justify-between items-center p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
                <span className="text-gray-400 light:text-gray-500">Status</span>
                <span className={`font-semibold ${statusConfig[billing.subscription.status]?.color || 'text-white'}`}>
                  {statusConfig[billing.subscription.status]?.label || billing.subscription.status}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-400 light:text-gray-500" />
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Invoice History</h3>
          </div>
        </div>

        {billing.invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 light:border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 light:text-gray-500">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billing.invoices.map((invoice, index) => {
                  const status = statusConfig[invoice.status] || defaultStatus;
                  const StatusIcon = status?.icon || Clock;

                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 light:border-gray-100 last:border-0 hover:bg-gray-800/30 light:hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="text-white light:text-gray-900">
                          {new Date(invoice.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-white light:text-gray-900">
                          ${invoice.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-sm ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {invoice.invoiceUrl && (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 light:text-gray-500">No invoices yet</p>
            {billing.tier === 'free' && (
              <p className="text-sm text-gray-500 mt-1">
                Invoices will appear here after you upgrade
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
