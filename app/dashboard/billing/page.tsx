import { Suspense } from 'react';
import { BillingDashboard } from '@/components/billing/BillingDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Plan & Billing | ReplySequence',
  description: 'Manage your plan, usage, and billing',
};

function BillingLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Page header */}
      <div className="mb-6">
        <div className="h-8 w-56 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-80 bg-gray-700/60 light:bg-gray-200 rounded" />
      </div>
      {/* Subscription plan card */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 mb-6">
        <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-700 light:bg-gray-200 rounded-xl" />
          <div>
            <div className="h-7 w-20 bg-gray-700 light:bg-gray-200 rounded mb-1" />
            <div className="h-4 w-28 bg-gray-700/50 light:bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-4 w-48 bg-gray-700/50 light:bg-gray-100 rounded" />
      </div>
      {/* Payment method + Invoice history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-36 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gray-700 light:bg-gray-200 rounded" />
            <div>
              <div className="h-4 w-32 bg-gray-700 light:bg-gray-200 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/30 light:border-gray-100 last:border-0">
              <div>
                <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-700/50 light:bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoadingSkeleton />}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Plan & Billing</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Manage your plan, track usage, and handle payments</p>
      </div>
      <BillingDashboard />
    </Suspense>
  );
}
