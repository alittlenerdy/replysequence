import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { OnboardingGate } from '@/components/dashboard/OnboardingGate';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { IntegrationSettings } from '@/components/dashboard/IntegrationSettings';
import { getDraftStats } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | ReplySequence',
  description: 'Manage your platform integrations',
};

function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
            <div className="h-9 w-24 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SettingsContent() {
  const [user, stats] = await Promise.all([
    currentUser(),
    getDraftStats(),
  ]);
  const firstName = user?.firstName || 'there';
  const pendingDrafts = stats.generated;

  return (
    <DashboardShell firstName={firstName} pendingDrafts={pendingDrafts}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Settings</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Manage your platform integrations</p>
      </div>
      <IntegrationSettings />
    </DashboardShell>
  );
}

export default function SettingsPage() {
  return (
    <OnboardingGate>
      <Suspense fallback={<SettingsLoading />}>
        <SettingsContent />
      </Suspense>
    </OnboardingGate>
  );
}
