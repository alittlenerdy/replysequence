import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { OpportunityHealth } from '@/components/dashboard/OpportunityHealth';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { MeetingJobsTable } from '@/components/dashboard/MeetingJobsTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { AIActionsFeed } from '@/components/dashboard/AIActionsFeed';
import { DealsAtRiskCard } from '@/components/dashboard/DealsAtRiskCard';
import { CRMPreviewCard } from '@/components/dashboard/CRMPreviewCard';
import { ProcessingStatusCard } from '@/components/dashboard/ProcessingStatusCard';
import { PostCallSystemPanel } from '@/components/dashboard/PostCallSystemPanel';
import { TimeSavingsWidget } from '@/components/dashboard/TimeSavingsWidget';
import { ReplyIntelligenceCard } from '@/components/dashboard/ReplyIntelligenceCard';
import {
  getDraftStats,
  getMissionControlData,
  getRecentMeetingsForDashboard,
  getProcessingStatus,
  getActivityFeedEvents,
  getLatestMeetingInsights,
  getLatestSequencePreview,
  getLatestReadyDraft,
  getUserHasConnectedPlatforms,
  getHasOnlyDemoMeetings,
} from '@/lib/dashboard-queries';
import { DemoDataBanner } from '@/components/dashboard/DemoDataBanner';
import { shouldSeedDemoMeeting, seedDemoMeeting } from '@/lib/seed-demo-meeting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const metadata = {
  title: 'Dashboard',
  description: 'Your command center for sales follow-ups',
};

async function CommandCenterContent() {
  // Seed demo meeting for new users who completed onboarding but have no meetings
  const { userId: clerkId } = await auth();
  if (clerkId) {
    try {
      const { shouldSeed, userId } = await shouldSeedDemoMeeting(clerkId);
      if (shouldSeed && userId) {
        await seedDemoMeeting(userId);
      }
    } catch {
      // Non-blocking — if seeding fails, user still sees the dashboard
    }
  }

  const [stats, missionControl, recentMeetings, processingStatus, activityEvents, meetingInsights, sequencePreview, latestDraft, hasConnectedPlatforms, hasOnlyDemoMeetings] = await Promise.all([
    getDraftStats(),
    getMissionControlData(),
    getRecentMeetingsForDashboard(),
    getProcessingStatus(),
    getActivityFeedEvents(),
    getLatestMeetingInsights(),
    getLatestSequencePreview(),
    getLatestReadyDraft(),
    getUserHasConnectedPlatforms(),
    getHasOnlyDemoMeetings(),
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

      {/* Demo data banner — shown when user has only demo meetings */}
      <DemoDataBanner hasOnlyDemo={hasOnlyDemoMeetings} />

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
        hasConnectedPlatforms={hasConnectedPlatforms}
      />

      {/* ═══════ 2. PIPELINE INTELLIGENCE ═══════ */}
      <div className="mb-4">
        <h2 className="text-[10px] font-medium text-[#8892B0]/70 light:text-gray-400 uppercase tracking-wider mb-3">
          Pipeline Intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <OpportunityHealth />
            {/* Compact pipeline stats to fill left column */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Meetings', value: stats.meetingsProcessed ?? 0, color: '#06B6D4' },
                { label: 'Sequences', value: stats.sequencesActive ?? 0, color: '#6366F1' },
                { label: 'Follow-Ups Sent', value: stats.sent, color: '#22C55E' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-gray-900/60 light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-3 text-center">
                  <p className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] text-[#8892B0] light:text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <AIActionsFeed />
          </div>
          <div className="space-y-4">
            <ReplyIntelligenceCard />
            <DealsAtRiskCard />
            <TimeSavingsWidget />
            <AIInsightsPanel insights={meetingInsights || undefined} />
          </div>
        </div>
      </div>

      {/* ═══════ 3. WORK QUEUE ═══════ */}
      <div>
        <h2 className="text-[10px] font-medium text-[#8892B0]/70 light:text-gray-400 uppercase tracking-wider mb-3">
          Work Queue
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Compact processing status — only when active */}
            {processingStatus && !isProcessing && processingStatus.status !== 'idle' && processingStatus.status !== 'draft_ready' && (
              <ProcessingStatusCard
                status={processingStatus.status}
                meetingName={processingStatus.meetingName}
                lastUpdated={processingStatus.lastUpdated}
                error={processingStatus.error}
              />
            )}
            <MeetingJobsTable meetings={recentMeetings.length > 0 ? recentMeetings : undefined} />
          </div>
          <div className="space-y-4">
            <ActivityFeed events={activityEvents.length > 0 ? activityEvents : undefined} />
            <CRMPreviewCard />
          </div>
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
      {/* Band 1: 3-card skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-52" />
        ))}
      </div>
      {/* Band 2: Pipeline skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-44" />
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-44" />
      </div>
      {/* Band 3: Work queue skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-56" />
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 p-5 h-56" />
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
