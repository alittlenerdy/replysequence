'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, FileText, Sparkles, Play, Video, Calendar, Zap } from 'lucide-react';

interface DashboardEmptyStateProps {
  className?: string;
}

const actionCards = [
  {
    label: 'Upload Meeting',
    description: 'Upload a recording from Zoom, Meet, or Teams',
    href: '/dashboard/meetings',
    icon: Upload,
    color: '#5B6CFF',
    primary: true,
  },
  {
    label: 'Import Transcript',
    description: 'Paste or upload an existing transcript file',
    href: '/dashboard/meetings',
    icon: FileText,
    color: '#38E8FF',
    primary: false,
  },
  {
    label: 'Try Sample Meeting',
    description: 'See the full pipeline in action with demo data',
    href: '/demo',
    icon: Sparkles,
    color: '#7A5CFF',
    primary: false,
  },
  {
    label: 'Watch Demo',
    description: 'See how ReplySequence transforms your workflow',
    href: '/demo',
    icon: Play,
    color: '#4DFFA3',
    primary: false,
  },
];

const onboardingSteps = [
  {
    step: 1,
    label: 'Connect your meeting platform',
    description: 'Zoom, Google Meet, or Microsoft Teams',
    icon: Video,
    color: '#38E8FF',
  },
  {
    step: 2,
    label: 'Import your calendar',
    description: 'Auto-process upcoming meetings',
    icon: Calendar,
    color: '#7A5CFF',
  },
  {
    step: 3,
    label: 'Upload a transcript',
    description: 'Or wait for your next recorded meeting',
    icon: FileText,
    color: '#FFD75F',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function DashboardEmptyState({ className }: DashboardEmptyStateProps) {
  return (
    <div className="mb-8">
      {/* Hero */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex rounded-2xl p-3 bg-[#5B6CFF]/10 mb-4">
          <Zap className="w-8 h-8 text-[#5B6CFF]" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
          Welcome to ReplySequence
        </h2>
        <p className="text-sm text-gray-400 light:text-gray-500 max-w-md mx-auto">
          Turn every meeting into a perfectly crafted follow-up sequence. Upload a recording or try a sample to see it in action.
        </p>
      </motion.div>

      {/* Action Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {actionCards.map((card) => {
          const Icon = card.icon;

          return (
            <motion.div key={card.label} variants={item}>
              <Link
                href={card.href}
                className={`group relative block w-full text-left rounded-2xl p-5 border transition-all duration-300 hover:bg-white/[0.04] ${
                  card.primary
                    ? 'bg-[#5B6CFF]/10 border-[#5B6CFF]/25 hover:border-[#5B6CFF]/40 light:bg-[#5B6CFF]/5 light:border-[#4A5BEE]/20 light:hover:border-[#4A5BEE]/40'
                    : 'bg-gray-900/60 border-gray-700/50 hover:border-gray-600/50 light:bg-white light:border-gray-200 light:hover:border-gray-300'
                }`}
              >
                <div
                  className="inline-flex rounded-xl p-2.5 mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}15`, boxShadow: `0 4px 16px ${card.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} strokeWidth={1.5} />
                </div>
                <div className="text-sm font-semibold text-white light:text-gray-900 mb-0.5">
                  {card.label}
                </div>
                <div className="text-xs text-gray-500 light:text-gray-400">
                  {card.description}
                </div>
                {card.primary && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#5B6CFF]/15 text-[#5B6CFF]">
                      Recommended
                    </span>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Onboarding Steps */}
      <motion.div
        className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-4">
          Quick setup checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {onboardingSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 light:bg-gray-50 border border-gray-700/30 light:border-gray-200"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-gray-500 light:text-gray-400 tabular-nums">
                      {s.step}
                    </span>
                    <span className="text-sm font-medium text-white light:text-gray-900">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 light:text-gray-400">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
