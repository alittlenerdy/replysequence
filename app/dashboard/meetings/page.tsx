import { Suspense } from 'react';
import { MeetingsListView } from '@/components/dashboard/MeetingsListView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meetings | ReplySequence',
  description: 'View all your captured meetings and their follow-up drafts',
};

function MeetingsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header - title + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-52 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
        <div className="w-full sm:w-72 h-10 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>
      {/* Filter dropdowns */}
      <div className="flex gap-3 mb-6">
        <div className="h-10 w-36 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        <div className="h-10 w-32 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>
      {/* Meeting rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl"
          >
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-56 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-700/50 light:bg-gray-100 rounded" />
                <div className="h-3 w-12 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-700/50 light:bg-gray-200 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsLoadingSkeleton />}>
      <MeetingsListView />
    </Suspense>
  );
}
