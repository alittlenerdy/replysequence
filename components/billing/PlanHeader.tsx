'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Building2,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import type { BillingData } from './billing-types';

const tierConfig = {
  free: {
    name: 'Free',
    icon: Zap,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
  pro: {
    name: 'Pro',
    icon: Sparkles,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
  team: {
    name: 'Team',
    icon: Building2,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
};

const statusBadges: Record<string, { color: string; bgColor: string; label: string }> = {
  active: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', label: 'Active' },
  trialing: { color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/20', label: 'Trial' },
  past_due: { color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20', label: 'Past Due' },
  canceled: { color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', label: 'Canceled' },
  unpaid: { color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20', label: 'Unpaid' },
  incomplete: { color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', label: 'Incomplete' },
  paused: { color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/20', label: 'Paused' },
};

function TrialCountdown({ trialEnd }: { trialEnd: string }) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const days = Math.ceil(
      (new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    setDaysRemaining(days);
  }, [trialEnd]);

  if (daysRemaining === null) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-indigo-400">
      <Clock className="w-4 h-4" />
      <span>
        {daysRemaining > 0
          ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in trial`
          : 'Trial ends today'}
      </span>
    </div>
  );
}

interface PlanHeaderProps {
  billing: BillingData;
  onScrollToPlans: () => void;
}

export function PlanHeader({ billing, onScrollToPlans }: PlanHeaderProps) {
  const tierInfo = tierConfig[billing.tier] || tierConfig.free;
  const TierIcon = tierInfo.icon;
  const status = billing.subscription?.status;
  const statusInfo = status ? statusBadges[status] : null;

  return (
    <div className="space-y-0">
      <div
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
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-white light:text-gray-900">{tierInfo.name}</h3>
                  {statusInfo && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
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
                </div>
                {status === 'trialing' && billing.subscription.trialEnd && (
                  <TrialCountdown trialEnd={billing.subscription.trialEnd} />
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {status === 'trialing'
                      ? 'Billing starts'
                      : billing.subscription.cancelAtPeriodEnd
                        ? 'Cancels'
                        : 'Renews'}{' '}
                    on{' '}
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
                You are on the free plan with limited features
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {billing.tier === 'free' ? (
              <button
                onClick={onScrollToPlans}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                  bg-gradient-to-r from-indigo-500 to-indigo-700 text-white
                  hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade Plan
              </button>
            ) : (
              billing.subscription && <ManageSubscriptionButton />
            )}
          </div>
        </div>
      </div>

      {/* Past due warning banner */}
      {status === 'past_due' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Your payment is past due</p>
            <p className="text-xs text-red-400/70 mt-0.5">Update your payment method to avoid service interruption.</p>
          </div>
          <ManageSubscriptionButton className="!px-4 !py-2 !text-sm !bg-red-500/20 !text-red-400 hover:!bg-red-500/30" />
        </div>
      )}

      {/* Canceled notice */}
      {billing.subscription?.cancelAtPeriodEnd && status !== 'past_due' && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">Your subscription is set to cancel</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Access continues until{' '}
              {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}.
            </p>
          </div>
          <ManageSubscriptionButton className="!px-4 !py-2 !text-sm" />
        </div>
      )}
    </div>
  );
}
