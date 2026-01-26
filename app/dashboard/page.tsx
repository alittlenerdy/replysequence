import { Suspense } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { getDraftsWithMeetings, getDraftStats } from '@/lib/dashboard-queries';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | ReplySequence',
  description: 'View and manage your AI-generated email drafts',
};

async function DashboardContent() {
  // Fetch initial data server-side
  const [draftsResult, stats] = await Promise.all([
    getDraftsWithMeetings({ page: 1, limit: 10 }),
    getDraftStats(),
  ]);

  return (
    <Dashboard
      initialDrafts={draftsResult.drafts}
      initialTotal={draftsResult.total}
      initialPage={draftsResult.page}
      initialTotalPages={draftsResult.totalPages}
      initialStats={stats}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded mt-2" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
