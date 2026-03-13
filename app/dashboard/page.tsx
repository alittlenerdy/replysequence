import { Suspense } from 'react';
import { DraftsView } from '@/components/dashboard/DraftsView';
import { NudgeBanner } from '@/components/dashboard/NudgeBanner';
import { DashboardStats } from '@/components/DashboardStats';
import { IntelligenceSidebar, IntelligenceMobileStrip } from '@/components/dashboard/IntelligenceSidebar';
import { getDraftsWithMeetings, getDraftStats, getUserHasConnectedPlatforms } from '@/lib/dashboard-queries';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export const metadata = {
  title: 'Dashboard | ReplySequence',
  description: 'Your action-first sales dashboard',
};

async function DashboardContent() {
  console.log('[DASHBOARD-1] Fetching initial drafts server-side');

  // Fetch initial data server-side
  const [draftsResult, stats, hasConnectedPlatforms] = await Promise.all([
    getDraftsWithMeetings({ page: 1, limit: 10 }),
    getDraftStats(),
    getUserHasConnectedPlatforms(),
  ]);
  console.log('[DASHBOARD-2] Drafts loaded, count:', draftsResult.drafts.length);

  return (
    <>
      <NudgeBanner variant="ai-settings" />

      {/* Stats bar — full width */}
      <DashboardStats stats={stats} />

      {/* Mobile intelligence strip — collapsible, above drafts */}
      <IntelligenceMobileStrip />

      {/* Two-column layout: action workspace + intelligence sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main workspace (2/3) */}
        <div className="lg:col-span-2 min-w-0">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white light:text-gray-900">
              <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">Follow-ups</span>
            </h2>
            <p className="text-gray-400 light:text-gray-500 mt-1">Review, edit, and send your meeting follow-ups</p>
          </div>
          <DraftsView
            initialDrafts={draftsResult.drafts}
            initialTotal={draftsResult.total}
            initialPage={draftsResult.page}
            initialTotalPages={draftsResult.totalPages}
            initialStats={stats}
            initialHasConnectedPlatforms={hasConnectedPlatforms}
            hideStats
          />
        </div>

        {/* Intelligence sidebar (1/3) — desktop only, mobile uses strip above */}
        <div className="lg:col-span-1 min-w-0">
          <IntelligenceSidebar />
        </div>
      </div>
    </>
  );
}

function DraftsLoading() {
  return (
    <div className="animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-5">
            <div className="h-8 w-40 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-72 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-6">
            <div className="h-10 bg-gray-700/50 light:bg-gray-200 rounded mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-700/50 light:bg-gray-200 rounded mb-3" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-4">
              <div className="h-5 w-32 bg-gray-700/50 light:bg-gray-200 rounded mb-3" />
              <div className="h-16 bg-gray-700/30 light:bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DraftsLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
