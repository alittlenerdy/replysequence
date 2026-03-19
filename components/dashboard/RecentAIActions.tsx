'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Send,
  Layers,
  Pause,
  Mail,
  Video,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
} from 'lucide-react';
import type { AIAction, AIActionType } from '@/lib/dashboard-queries';

interface RecentAIActionsProps {
  actions: AIAction[];
}

const actionConfig: Record<AIActionType, { icon: typeof FileText; color: string }> = {
  draft_generated: { icon: FileText, color: '#6366F1' },
  draft_sent: { icon: Send, color: '#4DFFA3' },
  sequence_created: { icon: Layers, color: '#7A5CFF' },
  sequence_paused: { icon: Pause, color: '#FFD75F' },
  sequence_step_sent: { icon: Mail, color: '#38E8FF' },
  meeting_processed: { icon: Video, color: '#38E8FF' },
  deal_flagged: { icon: AlertTriangle, color: '#FF5D5D' },
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function RecentAIActions({ actions }: RecentAIActionsProps) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#7A5CFF]/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#7A5CFF]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white light:text-gray-900">Recent AI Actions</h2>
            <p className="text-[11px] text-gray-500 light:text-gray-400">What the system did in the last 24 hours</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 light:text-gray-400">
          <Sparkles className="w-3 h-3" strokeWidth={1.5} />
          <span>{actions.length} action{actions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <motion.div className="px-3 pb-3" variants={container} initial="hidden" animate="show">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gray-800 light:bg-gray-200" />

          {actions.map((action, i) => {
            const config = actionConfig[action.type];
            const Icon = config.icon;
            return (
              <motion.div key={action.id} variants={item}>
                <Link
                  href={action.href}
                  className="group relative flex items-start gap-3 px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/[0.04] light:hover:bg-gray-50"
                >
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${config.color}20`, boxShadow: `0 0 8px ${config.color}15` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className="flex items-center gap-2">
                      <Icon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: config.color }}
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-white light:text-gray-900 truncate">
                        {action.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 light:text-gray-400 truncate mt-0.5 ml-[22px]">
                      {action.description}
                    </div>
                  </div>

                  {/* Right side: time + action */}
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="text-[10px] text-gray-600 light:text-gray-400 tabular-nums">
                      {formatTime(action.timestamp)}
                    </span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      {action.actionLabel}
                    </span>
                    <ArrowRight
                      className="w-3.5 h-3.5 text-gray-600 light:text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
