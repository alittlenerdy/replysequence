'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Video,
  AlertTriangle,
  Layers,
  Mail,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Target,
} from 'lucide-react';
import type { PriorityItem, MomentumData } from '@/lib/dashboard-queries';

interface MissionControlProps {
  priorities: PriorityItem[];
  momentum: MomentumData;
}

const severityConfig = {
  critical: { color: '#FF5D5D', bg: 'rgba(255, 93, 93, 0.08)', border: 'rgba(255, 93, 93, 0.20)' },
  warning: { color: '#FFD75F', bg: 'rgba(255, 215, 95, 0.08)', border: 'rgba(255, 215, 95, 0.20)' },
  info: { color: '#38E8FF', bg: 'rgba(56, 232, 255, 0.08)', border: 'rgba(56, 232, 255, 0.20)' },
};

const typeIcons = {
  draft_review: FileText,
  missing_followup: Video,
  deal_at_risk: AlertTriangle,
  sequence_step_due: Layers,
  high_engagement: Mail,
};

function timeAgo(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#4DFFA3' : score >= 40 ? '#FFD75F' : '#FF5D5D';

  return (
    <div className="relative w-[140px] h-[140px] flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" className="light:stroke-gray-200" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-black tabular-nums text-white light:text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium">
          Momentum
        </span>
      </div>
    </div>
  );
}

function MomentumMetric({
  label,
  value,
  suffix,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white light:text-gray-900 tabular-nums">
          {value}{suffix}
        </div>
        <div className="text-[11px] text-gray-500 light:text-gray-400 truncate">{label}</div>
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function MissionControl({ priorities, momentum }: MissionControlProps) {
  const hasPriorities = priorities.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Priority Inbox — takes 2 columns */}
      <motion.div
        className="lg:col-span-2 rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5D5D]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#FF5D5D]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white light:text-gray-900">Priority Inbox</h2>
              <p className="text-[11px] text-gray-500 light:text-gray-400">Actions that need your attention</p>
            </div>
          </div>
          {hasPriorities && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FF5D5D]/10 text-[#FF5D5D]">
              {priorities.length} item{priorities.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {hasPriorities ? (
          <motion.div className="px-3 pb-3 space-y-1" variants={container} initial="hidden" animate="show">
            {priorities.map((p) => {
              const config = severityConfig[p.severity];
              const Icon = typeIcons[p.type];
              return (
                <motion.div key={`${p.type}-${p.id}`} variants={item}>
                  <Link
                    href={p.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] light:hover:bg-gray-50"
                    style={{ borderLeft: `2px solid ${config.color}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: config.bg }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white light:text-gray-900 truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-gray-500 light:text-gray-400 truncate">
                        {p.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.timestamp && (
                        <span className="text-[10px] text-gray-600 light:text-gray-400">
                          {timeAgo(p.timestamp)}
                        </span>
                      )}
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: config.bg, color: config.color }}
                      >
                        {p.actionLabel}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-gray-600 light:text-gray-400 group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#4DFFA3]/10 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-[#4DFFA3]" strokeWidth={1.5} />
              </div>
              <div className="text-sm font-medium text-white light:text-gray-900 mb-1">All clear</div>
              <div className="text-xs text-gray-500 light:text-gray-400">No urgent actions right now</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Momentum Panel — 1 column */}
      <motion.div
        className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#4DFFA3]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#4DFFA3]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white light:text-gray-900">Sales Momentum</h2>
            <p className="text-[11px] text-gray-500 light:text-gray-400">Your pipeline health score</p>
          </div>
        </div>

        <div className="flex justify-center mb-5">
          <ScoreRing score={momentum.score} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MomentumMetric
            label="Follow-up Coverage"
            value={momentum.followUpCoverage}
            suffix="%"
            icon={Shield}
            color="#5B6CFF"
          />
          <MomentumMetric
            label="Avg Response Time"
            value={momentum.avgFollowUpHours > 0 ? momentum.avgFollowUpHours.toFixed(1) : '—'}
            suffix={momentum.avgFollowUpHours > 0 ? 'h' : ''}
            icon={Clock}
            color="#38E8FF"
          />
          <MomentumMetric
            label="Sequences Active"
            value={momentum.sequencesActive}
            icon={Layers}
            color="#7A5CFF"
          />
          <MomentumMetric
            label="Deals at Risk"
            value={momentum.dealsAtRisk}
            icon={AlertTriangle}
            color={momentum.dealsAtRisk > 0 ? '#FF5D5D' : '#4DFFA3'}
          />
        </div>

        {momentum.totalDrafts > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-800/50 light:border-gray-100">
            <div className="flex items-center justify-between text-[11px] text-gray-500 light:text-gray-400 mb-1.5">
              <span>Drafts reviewed</span>
              <span className="tabular-nums">{momentum.draftsReviewed}/{momentum.totalDrafts}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 light:bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#5B6CFF' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((momentum.draftsReviewed / momentum.totalDrafts) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
