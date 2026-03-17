import { Suspense } from 'react';
import Link from 'next/link';
import { FileText, BarChart3, Video, Layers, ArrowRight } from 'lucide-react';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { ProcessingStatusCard } from '@/components/dashboard/ProcessingStatusCard';
import { MeetingJobsTable } from '@/components/dashboard/MeetingJobsTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { SequencePreviewCard } from '@/components/dashboard/SequencePreviewCard';
import { TranscriptViewer } from '@/components/dashboard/TranscriptViewer';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { MissionControl } from '@/components/dashboard/MissionControl';
import { OpportunityHealth } from '@/components/dashboard/OpportunityHealth';
import { RecentAIActions } from '@/components/dashboard/RecentAIActions';
import {
  getDraftStats,
  getMissionControlData,
  getRecentAIActions,
  getRecentMeetingsForDashboard,
  getProcessingStatus,
  getActivityFeedEvents,
  getLatestMeetingInsights,
  getLatestSequencePreview,
} from '@/lib/dashboard-queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const metadata = {
  title: 'Dashboard',
  description: 'Your command center for sales follow-ups',
};

const quickLinks = [
  {
    label: 'Drafts',
    description: 'Review & send follow-ups',
    href: '/dashboard/drafts',
    icon: FileText,
    color: '#5B6CFF',
  },
  {
    label: 'Meetings',
    description: 'Recent call recordings',
    href: '/dashboard/meetings',
    icon: Video,
    color: '#38E8FF',
  },
  {
    label: 'Sequences',
    description: 'Automated nurture flows',
    href: '/dashboard/sequences',
    icon: Layers,
    color: '#7A5CFF',
  },
  {
    label: 'Analytics',
    description: 'Pipeline & performance',
    href: '/dashboard/analytics',
    icon: BarChart3,
    color: '#4DFFA3',
  },
];

async function CommandCenterContent() {
  const [stats, missionControl, recentActions, recentMeetings, processingStatus, activityEvents, meetingInsights, sequencePreview] = await Promise.all([
    getDraftStats(),
    getMissionControlData(),
    getRecentAIActions(),
    getRecentMeetingsForDashboard(),
    getProcessingStatus(),
    getActivityFeedEvents(),
    getLatestMeetingInsights(),
    getLatestSequencePreview(),
  ]);
  const hasActivity = stats.total > 0 || (stats.meetingsProcessed ?? 0) > 0;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white light:text-gray-900">
          Command Center
        </h1>
        <p className="text-gray-400 light:text-gray-500 mt-1">
          Your sales follow-up pipeline at a glance
        </p>
      </div>

      {/* KPI Strip */}
      <KPIStrip
        data={{
          meetingsProcessed: stats.meetingsProcessed ?? 0,
          sequencesGenerated: stats.sequencesActive ?? 0,
          avgTimeSaved: stats.avgLatency > 0 ? Math.round(Math.max(0, 15 - stats.avgLatency / 60000)) : 0,
          draftsReady: stats.generated,
          followUpsSent: stats.sent,
        }}
      />

      {hasActivity ? (
        <>
          {/* Mission Control */}
          <MissionControl
            priorities={missionControl.priorities}
            momentum={missionControl.momentum}
          />

          {/* Opportunity Health */}
          <OpportunityHealth />

          {/* Main grid: Processing + Meetings | Activity + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              {processingStatus && (
                <ProcessingStatusCard
                  status={processingStatus.status}
                  meetingName={processingStatus.meetingName}
                  lastUpdated={processingStatus.lastUpdated}
                  error={processingStatus.error}
                />
              )}
              <MeetingJobsTable
                meetings={recentMeetings.length > 0 ? recentMeetings : undefined}
              />
            </div>
            <div className="space-y-6">
              <ActivityFeed
                events={activityEvents.length > 0 ? activityEvents : undefined}
              />
              <AIInsightsPanel
                insights={meetingInsights || undefined}
              />
            </div>
          </div>

          {/* Sequence + Transcript row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SequencePreviewCard
              meetingName={sequencePreview?.meetingName}
              emails={sequencePreview?.emails}
            />
            <TranscriptViewer />
          </div>

          {/* Recent AI Actions */}
          {recentActions.length > 0 && <RecentAIActions actions={recentActions} />}
        </>
      ) : (
        <DashboardEmptyState />
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5 hover:border-[#5B6CFF]/30 light:hover:border-[#4A5BEE]/30 transition-all duration-300 hover:bg-white/[0.04]"
            >
              <div
                className="inline-flex rounded-xl p-2.5 mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${link.color}15`, boxShadow: `0 4px 16px ${link.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: link.color }} strokeWidth={1.5} />
              </div>
              <div className="text-sm font-semibold text-white light:text-gray-900 mb-0.5">
                {link.label}
              </div>
              <div className="text-xs text-gray-500 light:text-gray-400">
                {link.description}
              </div>
              <ArrowRight className="absolute top-5 right-5 w-4 h-4 text-gray-600 light:text-gray-300 group-hover:text-[#5B6CFF] transition-colors" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function CommandCenterLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-9 w-56 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
        <div className="h-5 w-80 bg-gray-700/50 light:bg-gray-200 rounded" />
      </div>
      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-4">
            <div className="w-8 h-8 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-2" />
            <div className="h-7 w-12 bg-gray-700/50 light:bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Mission Control skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
          <div className="h-5 w-32 bg-gray-700/50 light:bg-gray-200 rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-gray-700/50 light:bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-700/50 light:bg-gray-200 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-700/50 light:bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
          <div className="h-5 w-32 bg-gray-700/50 light:bg-gray-200 rounded mb-4" />
          <div className="w-[140px] h-[140px] rounded-full bg-gray-700/50 light:bg-gray-200 mx-auto" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5 h-48" />
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5 h-64" />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5 h-64" />
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5 h-48" />
        </div>
      </div>
      {/* Quick links skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-5 w-24 bg-gray-700/50 light:bg-gray-200 rounded mb-1" />
            <div className="h-4 w-32 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
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
