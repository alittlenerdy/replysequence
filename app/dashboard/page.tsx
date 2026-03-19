import { Suspense } from 'react';
import { OpportunityHealth } from '@/components/dashboard/OpportunityHealth';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { MeetingJobsTable } from '@/components/dashboard/MeetingJobsTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PostCallSystemPanel } from '@/components/dashboard/PostCallSystemPanel';
import {
  getDraftStats,
  getMissionControlData,
  getRecentMeetingsForDashboard,
  getProcessingStatus,
  getActivityFeedEvents,
  getLatestMeetingInsights,
  getLatestSequencePreview,
  getLatestReadyDraft,
} from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const metadata = {
  title: 'Dashboard',
  description: 'Your command center for sales follow-ups',
};

async function CommandCenterContent() {
  const [stats, missionControl, recentMeetings, processingStatus, activityEvents, meetingInsights, sequencePreview, latestDraft] = await Promise.all([
    getDraftStats(),
    getMissionControlData(),
    getRecentMeetingsForDashboard(),
    getProcessingStatus(),
    getActivityFeedEvents(),
    getLatestMeetingInsights(),
    getLatestSequencePreview(),
    getLatestReadyDraft(),
  ]);

  // Determine if we're in a processing state
  const isProcessing = processingStatus &&
    ['uploading', 'transcribing', 'analyzing', 'generating_sequence'].includes(processingStatus.status);

  // Extract next steps from mission control priorities
  const nextSteps = missionControl.priorities
    .filter((p: { type: string }) => p.type === 'next_step' || p.type === 'overdue_step')
    .slice(0, 3)
    .map((p: { title: string; source?: string; dueDate?: string; type: string }) => ({
      task: p.title,
      owner: p.source || 'You',
      due: p.dueDate || '',
      overdue: p.type === 'overdue_step',
    }));

  // Find a risk flag if any
  const riskFlag = missionControl.priorities
    .find((p: { type: string }) => p.type === 'risk')?.title || null;

  return (
    <>
      {/* Header — compact */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white light:text-gray-900">
          Command Center
        </h1>
        <p className="text-sm text-[#8892B0] light:text-gray-500 mt-0.5">
          After every call, everything is handled.
        </p>
      </div>

      {/* ═══════ 1. POST-CALL SYSTEM PANEL ═══════ */}
      <PostCallSystemPanel
        processing={isProcessing ? {
          status: processingStatus!.status as 'uploading' | 'transcribing' | 'analyzing' | 'generating_sequence',
          meetingName: processingStatus!.meetingName,
        } : null}
        draft={latestDraft}
        sequence={sequencePreview}
        nextSteps={nextSteps}
        riskFlag={riskFlag}
      />

      {/* ═══════ 2. PIPELINE INTELLIGENCE ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#8892B0] light:text-gray-500 uppercase tracking-wider mb-3">
          Pipeline Intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OpportunityHealth />
          </div>
          <div>
            <AIInsightsPanel insights={meetingInsights || undefined} />
          </div>
        </div>
      </div>

      {/* ═══════ 3. SECONDARY — compact history ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MeetingJobsTable meetings={recentMeetings.length > 0 ? recentMeetings : undefined} />
        </div>
        <div>
          <ActivityFeed events={activityEvents.length > 0 ? activityEvents : undefined} />
        </div>
      </div>
    </>
  );
}

function CommandCenterLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-8 w-48 bg-gray-700/50 light:bg-gray-300 rounded mb-1" />
        <div className="h-4 w-64 bg-gray-700/50 light:bg-gray-300 rounded" />
      </div>
      {/* 3-card skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-52" />
        ))}
      </div>
      {/* Pipeline skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-48" />
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-48" />
      </div>
      {/* History skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-64" />
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-48" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<CommandCenterLoading />}>
      <CommandCenterContent />
    </Suspense>
  );
}
