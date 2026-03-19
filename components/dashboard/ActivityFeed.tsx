'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface FeedEvent {
  id: string;
  description: string;
  time: string;
  color: string;
}

interface ActivityFeedProps {
  events?: FeedEvent[];
}

const defaultEvents: FeedEvent[] = [
  { id: '1', description: 'Analyzing conversation — Acme Corp discovery call', time: '2m ago', color: '#38E8FF' },
  { id: '2', description: 'Transcript completed (4,230 words)', time: '8m ago', color: '#6366F1' },
  { id: '3', description: 'Meeting uploaded from Google Meet — Acme Corp', time: '22m ago', color: '#38E8FF' },
  { id: '4', description: 'Sequence generated for Globex Inc review', time: '1h ago', color: '#7A5CFF' },
  { id: '5', description: 'Draft sent to mike@globex.io', time: '1h ago', color: '#4DFFA3' },
  { id: '6', description: 'Sequence paused — recipient replied', time: '2h ago', color: '#FFD75F' },
  { id: '7', description: 'Draft generated for Initech product demo', time: '4h ago', color: '#6366F1' },
  { id: '8', description: 'Meeting processed from Zoom — Initech', time: '4h ago', color: '#38E8FF' },
  { id: '9', description: 'Email opened by tom@meridianhealth.com (3x)', time: '5h ago', color: '#FFD75F' },
  { id: '10', description: 'Follow-up sent to lisa@brightpath.io', time: '1d ago', color: '#4DFFA3' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, x: 8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function ActivityFeed({ events = defaultEvents }: ActivityFeedProps) {
  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Activity</h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">Recent system events</p>
        </div>
      </div>

      <motion.div className="space-y-0.5" variants={container} initial="hidden" animate="show">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            variants={item}
            className="flex items-start gap-3 py-2 group"
          >
            <div className="relative mt-1.5 shrink-0">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              {i === 0 && (
                <div
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: event.color }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 light:text-gray-600 leading-relaxed truncate">
                {event.description}
              </p>
            </div>
            <span className="text-[10px] text-gray-600 light:text-gray-400 shrink-0 mt-0.5 tabular-nums">
              {event.time}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
