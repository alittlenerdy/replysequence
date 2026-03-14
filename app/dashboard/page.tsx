import { Suspense } from 'react';
import Link from 'next/link';
import { FileText, BarChart3, Video, Layers, ArrowRight, Upload, Calendar, Zap } from 'lucide-react';
import { DashboardStats } from '@/components/DashboardStats';
import { MissionControl } from '@/components/dashboard/MissionControl';
import { OpportunityHealth } from '@/components/dashboard/OpportunityHealth';
import { RecentAIActions } from '@/components/dashboard/RecentAIActions';
import { getDraftStats, getMissionControlData, getRecentAIActions } from '@/lib/dashboard-queries';

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

function EmptyStateSetup() {
  const steps = [
    {
      label: 'Connect your meeting platform',
      description: 'Zoom, Google Meet, or Microsoft Teams',
      href: '/dashboard/settings',
      icon: Video,
      color: '#38E8FF',
      step: 1,
    },
    {
      label: 'Import your calendar',
      description: 'Sync upcoming meetings for automatic processing',
      href: '/dashboard/settings',
      icon: Calendar,
      color: '#7A5CFF',
      step: 2,
    },
    {
      label: 'Upload a transcript',
      description: 'Or wait for your next meeting to be recorded',
      href: '/dashboard/meetings',
      icon: Upload,
      color: '#FFD75F',
      step: 3,
    },
  ];

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-[#5B6CFF]/20 light:bg-white light:border-[#4A5BEE]/15 p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#5B6CFF]/15 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#5B6CFF]" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white light:text-gray-900">Get started with ReplySequence</h2>
          <p className="text-xs text-gray-400 light:text-gray-500">Complete these steps to start generating AI follow-ups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.step}
              href={s.href}
              className="group flex items-start gap-3 p-4 rounded-xl bg-gray-800/40 light:bg-gray-50 border border-gray-700/30 light:border-gray-200 hover:border-[#5B6CFF]/30 light:hover:border-[#4A5BEE]/30 transition-all"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${s.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white light:text-gray-900 mb-0.5">{s.label}</div>
                <div className="text-xs text-gray-500 light:text-gray-400">{s.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function CommandCenterContent() {
  const [stats, missionControl, recentActions] = await Promise.all([
    getDraftStats(),
    getMissionControlData(),
    getRecentAIActions(),
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

      {/* Empty state setup card */}
      {!hasActivity && <EmptyStateSetup />}

      {/* Mission Control — Priority Inbox + Momentum */}
      {hasActivity && (
        <MissionControl
          priorities={missionControl.priorities}
          momentum={missionControl.momentum}
        />
      )}

      {/* Opportunity Health Dashboard */}
      {hasActivity && <OpportunityHealth />}

      {/* Stats */}
      <DashboardStats stats={stats} />

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

      {/* Recent AI Actions Feed */}
      {recentActions.length > 0 && <RecentAIActions actions={recentActions} />}
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
          <div className="w-[140px] h-[140px] rounded-full bg-gray-700/50 light:bg-gray-200 mx-auto mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-700/50 light:bg-gray-200 rounded-lg" />
                <div>
                  <div className="h-4 w-10 bg-gray-700/50 light:bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-700/50 light:bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
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
