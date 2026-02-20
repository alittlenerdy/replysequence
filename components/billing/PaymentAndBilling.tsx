'use client';

import { CreditCard, FileText, Sparkles, ExternalLink } from 'lucide-react';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';
import type { BillingData } from './billing-types';

function CardBrandIcon({ brand }: { brand: string }) {
  const brandColors: Record<string, string> = {
    visa: 'text-indigo-400',
    mastercard: 'text-orange-400',
    amex: 'text-indigo-500',
    discover: 'text-orange-500',
  };

  return (
    <div className={`font-bold uppercase text-sm ${brandColors[brand.toLowerCase()] || 'text-gray-400'}`}>
      {brand}
    </div>
  );
}

interface PaymentAndBillingProps {
  billing: BillingData;
  onScrollToPlans: () => void;
}

export function PaymentAndBilling({ billing, onScrollToPlans }: PaymentAndBillingProps) {
  const hasPayment = !!billing.paymentMethod;
  const hasBillingDetails = !!billing.billingDetails?.name || !!billing.billingDetails?.address;
  const isFree = billing.tier === 'free';

  // Free users with no payment info: show compact empty state
  if (isFree && !hasPayment && !hasBillingDetails) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-400 light:text-gray-500" />
          <h3 className="text-lg font-semibold text-white light:text-gray-900">Payment & Billing</h3>
        </div>
        <div className="p-6 bg-gray-800/30 light:bg-gray-50 rounded-xl border border-dashed border-gray-600 light:border-gray-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-700/50 light:bg-gray-200 rounded-xl flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-gray-500 light:text-gray-400" />
            </div>
            <p className="text-gray-300 light:text-gray-700 font-medium mb-1">No payment method</p>
            <p className="text-sm text-gray-500 mb-4">Add a payment method when you upgrade to a paid plan.</p>
            <button
              onClick={onScrollToPlans}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg hover:from-indigo-700 hover:to-indigo-900 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Method */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400 light:text-gray-500" />
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Payment Method</h3>
          </div>
        </div>

        {hasPayment ? (
          <div className="flex items-center justify-between p-4 bg-gray-800/50 light:bg-gray-50 rounded-xl border border-gray-700 light:border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gray-700 light:bg-gray-200 rounded flex items-center justify-center">
                <CardBrandIcon brand={billing.paymentMethod!.brand} />
              </div>
              <div>
                <p className="font-medium text-white light:text-gray-900">
                  **** **** **** {billing.paymentMethod!.last4}
                </p>
                <p className="text-sm text-gray-400 light:text-gray-500">
                  Expires {billing.paymentMethod!.expMonth}/{billing.paymentMethod!.expYear}
                </p>
              </div>
            </div>
            <ManageSubscriptionButton className="!px-3 !py-1.5 !text-sm" />
          </div>
        ) : (
          <div className="p-4 bg-gray-800/30 light:bg-gray-50 rounded-xl border border-dashed border-gray-600 light:border-gray-300 text-center">
            <p className="text-sm text-gray-500">No payment method on file</p>
            {!isFree && <ManageSubscriptionButton className="mt-3 !text-sm" />}
          </div>
        )}
      </div>

      {/* Billing Details */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400 light:text-gray-500" />
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Billing Details</h3>
          </div>
        </div>

        {hasBillingDetails ? (
          <div className="space-y-3">
            {billing.billingDetails?.name && (
              <div className="flex justify-between items-center p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
                <span className="text-gray-400 light:text-gray-500 text-sm">Name</span>
                <span className="font-medium text-white light:text-gray-900 text-sm">{billing.billingDetails.name}</span>
              </div>
            )}
            {billing.billingDetails?.email && (
              <div className="flex justify-between items-center p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
                <span className="text-gray-400 light:text-gray-500 text-sm">Email</span>
                <span className="font-medium text-white light:text-gray-900 text-sm">{billing.billingDetails.email}</span>
              </div>
            )}
            {billing.billingDetails?.address && (
              <div className="flex justify-between items-start p-3 bg-gray-800/50 light:bg-gray-50 rounded-lg">
                <span className="text-gray-400 light:text-gray-500 text-sm">Address</span>
                <span className="font-medium text-white light:text-gray-900 text-sm text-right">
                  {[
                    billing.billingDetails.address.line1,
                    billing.billingDetails.address.line2,
                    [billing.billingDetails.address.city, billing.billingDetails.address.state]
                      .filter(Boolean)
                      .join(', '),
                    billing.billingDetails.address.postalCode,
                    billing.billingDetails.address.country,
                  ]
                    .filter(Boolean)
                    .join('\n')
                    .split('\n')
                    .map((line, i) => (
                      <span key={i} className="block">{line}</span>
                    ))}
                </span>
              </div>
            )}
            <ManageSubscriptionButton className="!w-full !text-sm !bg-transparent !text-gray-400 hover:!text-white !justify-center !gap-1.5 !py-2" />
          </div>
        ) : (
          <div className="p-4 bg-gray-800/30 light:bg-gray-50 rounded-xl border border-dashed border-gray-600 light:border-gray-300 text-center">
            <p className="text-sm text-gray-500 mb-2">No billing details on file</p>
            {!isFree && <ManageSubscriptionButton className="!text-sm" />}
          </div>
        )}
      </div>
    </div>
  );
}
