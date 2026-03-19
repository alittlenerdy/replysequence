import { Suspense } from 'react';
import { DraftsView } from '@/components/dashboard/DraftsView';
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

  const readyCount = stats.generated;

  return (
    <>
      {/* Header — execution-focused */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white light:text-gray-900">
          {readyCount > 0 ? (
            <>{readyCount} draft{readyCount !== 1 ? 's' : ''} ready to send</>
          ) : (
            <>Drafts</>
          )}
        </h2>
        <p className="text-sm text-[#8892B0] light:text-gray-500 mt-0.5">
          Review and send your follow-ups
        </p>
      </div>

      {/* Full-width drafts — no sidebar */}
      <DraftsView
        initialDrafts={draftsResult.drafts}
        initialTotal={draftsResult.total}
        initialPage={draftsResult.page}
        initialTotalPages={draftsResult.totalPages}
        initialStats={stats}
        initialHasConnectedPlatforms={hasConnectedPlatforms}
        hideStats
      />
    </>
  );
}

function DraftsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-8 w-56 bg-gray-700/50 light:bg-gray-300 rounded mb-1" />
        <div className="h-4 w-48 bg-gray-700/50 light:bg-gray-300 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-24" />
        ))}
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
