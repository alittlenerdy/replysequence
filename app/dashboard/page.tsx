import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { DraftsView } from '@/components/dashboard/DraftsView';
import { OnboardingGate } from '@/components/dashboard/OnboardingGate';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getDraftsWithMeetings, getDraftStats } from '@/lib/dashboard-queries';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Drafts | ReplySequence',
  description: 'View and manage your AI-generated email drafts',
};

async function DashboardContent() {
  console.log('[DASHBOARD-1] Fetching initial drafts server-side');
  const user = await currentUser();
  const firstName = user?.firstName || 'there';

  // Fetch initial data server-side
  const [draftsResult, stats] = await Promise.all([
    getDraftsWithMeetings({ page: 1, limit: 10 }),
    getDraftStats(),
  ]);
  console.log('[DASHBOARD-2] Drafts loaded, count:', draftsResult.drafts.length);

  return (
    <DashboardShell firstName={firstName}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Email Drafts</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">View and manage your AI-generated follow-up emails</p>
      </div>
      <DraftsView
        initialDrafts={draftsResult.drafts}
        initialTotal={draftsResult.total}
        initialPage={draftsResult.page}
        initialTotalPages={draftsResult.totalPages}
        initialStats={stats}
      />
    </DashboardShell>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <header className="bg-gray-900 light:bg-white border-b border-gray-700 light:border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-700 light:bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded mt-2" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 light:bg-white rounded-lg shadow-sm border border-gray-700 light:border-gray-200 p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-lg" />
                <div>
                  <div className="h-6 w-12 bg-gray-700 light:bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-700 light:bg-gray-200 rounded mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="bg-gray-800 light:bg-white rounded-lg shadow-sm border border-gray-700 light:border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 light:bg-gray-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-700 light:bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <OnboardingGate>
      <Suspense fallback={<LoadingFallback />}>
        <DashboardContent />
      </Suspense>
    </OnboardingGate>
  );
}
