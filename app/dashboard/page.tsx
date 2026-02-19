import { Suspense } from 'react';
import { DraftsView } from '@/components/dashboard/DraftsView';
import { NudgeBanner } from '@/components/dashboard/NudgeBanner';
import { getDraftsWithMeetings, getDraftStats } from '@/lib/dashboard-queries';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export const metadata = {
  title: 'Drafts | ReplySequence',
  description: 'View and manage your AI-generated email drafts',
};

async function DashboardContent() {
  console.log('[DASHBOARD-1] Fetching initial drafts server-side');

  // Fetch initial data server-side
  const [draftsResult, stats] = await Promise.all([
    getDraftsWithMeetings({ page: 1, limit: 10 }),
    getDraftStats(),
  ]);
  console.log('[DASHBOARD-2] Drafts loaded, count:', draftsResult.drafts.length);

  return (
    <>
      <NudgeBanner variant="ai-settings" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Follow-ups</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Review, edit, and send your meeting follow-ups</p>
      </div>
      <DraftsView
        initialDrafts={draftsResult.drafts}
        initialTotal={draftsResult.total}
        initialPage={draftsResult.page}
        initialTotalPages={draftsResult.totalPages}
        initialStats={stats}
      />
    </>
  );
}

function DraftsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-700 light:bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 p-6">
        <div className="h-10 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-700 light:bg-gray-200 rounded mb-3" />
        ))}
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
