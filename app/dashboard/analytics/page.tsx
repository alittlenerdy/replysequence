import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { OnboardingGate } from '@/components/dashboard/OnboardingGate';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { getDraftStats } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | ReplySequence',
  description: 'Track your meeting follow-up performance',
};

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 animate-pulse light:shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gray-700 light:bg-gray-200 mb-3" />
            <div className="h-8 w-16 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 h-[220px] animate-pulse light:shadow-sm">
            <div className="h-4 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
            <div className="h-[140px] bg-gray-800 light:bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function AnalyticsContent() {
  const [user, stats] = await Promise.all([
    currentUser(),
    getDraftStats(),
  ]);
  const firstName = user?.firstName || 'there';
  const pendingDrafts = stats.generated;

  return (
    <DashboardShell firstName={firstName} pendingDrafts={pendingDrafts}>
      <AnalyticsDashboard />
    </DashboardShell>
  );
}

export default function AnalyticsPage() {
  return (
    <OnboardingGate>
      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsContent />
      </Suspense>
    </OnboardingGate>
  );
}
