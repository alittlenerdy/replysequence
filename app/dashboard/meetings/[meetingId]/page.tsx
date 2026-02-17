import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { MeetingDetailView } from '@/components/dashboard/MeetingDetailView';
import { getMeetingDetail, getDraftStats } from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  const meeting = await getMeetingDetail(meetingId);
  return {
    title: meeting ? `${meeting.topic || 'Meeting'} | ReplySequence` : 'Meeting Not Found',
  };
}

function MeetingDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded" />

      {/* Header skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="h-8 w-2/3 bg-gray-700 light:bg-gray-200 rounded mb-3" />
        <div className="flex gap-3">
          <div className="h-6 w-20 bg-gray-700 light:bg-gray-200 rounded-full" />
          <div className="h-6 w-32 bg-gray-700 light:bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-700 light:bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-700 light:bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-700 light:bg-gray-200 rounded" />
          <div className="h-3 w-4/6 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
      </div>

      {/* Drafts skeleton */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-700 light:border-gray-200 rounded-lg p-4 mb-3">
            <div className="h-4 w-3/4 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function MeetingDetailContent({ meetingId }: { meetingId: string }) {
  const [user, meeting, stats] = await Promise.all([
    currentUser(),
    getMeetingDetail(meetingId),
    getDraftStats(),
  ]);

  if (!meeting) {
    notFound();
  }

  const firstName = user?.firstName || 'there';

  return (
    <DashboardShell firstName={firstName} pendingDrafts={stats.generated}>
      <MeetingDetailView meeting={meeting} />
    </DashboardShell>
  );
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;

  return (
    <Suspense fallback={<MeetingDetailLoading />}>
      <MeetingDetailContent meetingId={meetingId} />
    </Suspense>
  );
}
