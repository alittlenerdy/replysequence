import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { MeetingsListView } from '@/components/dashboard/MeetingsListView';
import { getDraftStats } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meetings | ReplySequence',
  description: 'View all your captured meetings and their follow-up drafts',
};

function MeetingsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-700 light:bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-64 bg-gray-700 light:bg-gray-200 rounded animate-pulse" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 animate-pulse light:shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-700 light:bg-gray-200" />
            <div className="flex-1">
              <div className="h-5 w-2/3 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-700 light:bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function MeetingsContent() {
  const [user, stats] = await Promise.all([
    currentUser(),
    getDraftStats(),
  ]);
  const firstName = user?.firstName || 'there';

  return (
    <DashboardShell firstName={firstName} pendingDrafts={stats.generated}>
      <MeetingsListView />
    </DashboardShell>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsLoading />}>
      <MeetingsContent />
    </Suspense>
  );
}
