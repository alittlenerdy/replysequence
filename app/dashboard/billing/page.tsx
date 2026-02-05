import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { getDraftStats } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Billing | ReplySequence',
  description: 'Manage your subscription and billing',
};

function BillingLoading() {
  return (
    <div className="space-y-6">
      {/* Current Plan skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="h-10 w-24 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded" />
      </div>
      {/* Payment Method skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="h-12 w-full bg-gray-700 light:bg-gray-200 rounded" />
      </div>
      {/* Invoices skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-24 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-700 light:bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function BillingContent() {
  const [user, stats] = await Promise.all([
    currentUser(),
    getDraftStats(),
  ]);
  const firstName = user?.firstName || 'there';
  const pendingDrafts = stats.generated;

  return (
    <DashboardShell firstName={firstName} pendingDrafts={pendingDrafts}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Billing & Subscription</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Manage your subscription and payment details</p>
      </div>
      <BillingDashboard />
    </DashboardShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingContent />
    </Suspense>
  );
}
