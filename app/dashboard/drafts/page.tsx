import { Suspense } from 'react';
import { DraftsView } from '@/components/dashboard/DraftsView';
import { NudgeBanner } from '@/components/dashboard/NudgeBanner';
import { DashboardStats } from '@/components/DashboardStats';
import { IntelligenceSidebar, IntelligenceMobileStrip } from '@/components/dashboard/IntelligenceSidebar';
import { getDraftsWithMeetings, getDraftStats, getUserHasConnectedPlatforms } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const metadata = {
  title: 'Drafts',
  description: 'Review, edit, and send your meeting follow-ups',
};

async function DraftsContent() {
  const [draftsResult, stats, hasConnectedPlatforms] = await Promise.all([
    getDraftsWithMeetings({ page: 1, limit: 10 }),
    getDraftStats(),
    getUserHasConnectedPlatforms(),
  ]);

  return (
    <>
      <NudgeBanner variant="ai-settings" />
      <DashboardStats stats={stats} />
      <IntelligenceMobileStrip />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white light:text-gray-900">
              <span className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">Follow-ups</span>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
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

export default function DraftsPage() {
  return (
    <Suspense fallback={<DraftsLoading />}>
      <DraftsContent />
    </Suspense>
  );
}
