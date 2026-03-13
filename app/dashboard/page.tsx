import { Suspense } from 'react';
import Link from 'next/link';
import { FileText, BarChart3, Video, Layers, ArrowRight, Clock } from 'lucide-react';
import { DashboardStats } from '@/components/DashboardStats';
import { getDraftStats } from '@/lib/dashboard-queries';

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
    color: '#22D3EE',
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
    color: '#37D67A',
  },
];

async function CommandCenterContent() {
  const stats = await getDraftStats();

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

      {/* Action prompt */}
      {stats.generated > 0 && (
        <Link
          href="/dashboard/drafts"
          className="block rounded-2xl bg-[#5B6CFF]/5 border border-[#5B6CFF]/20 p-5 hover:bg-[#5B6CFF]/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#5B6CFF]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#5B6CFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white light:text-gray-900">
                {stats.generated} draft{stats.generated !== 1 ? 's' : ''} awaiting review
              </div>
              <div className="text-xs text-gray-400 light:text-gray-500">
                Review and send your AI-generated follow-ups
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#5B6CFF] flex-shrink-0" />
          </div>
        </Link>
      )}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
            <div className="w-10 h-10 bg-gray-700/50 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700/50 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>
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
