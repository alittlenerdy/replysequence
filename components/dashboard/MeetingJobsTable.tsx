'use client';

import { motion } from 'framer-motion';
import {
  Video,
  MonitorPlay,
  Users,
  Eye,
  Layers,
  RotateCcw,
  ListVideo,
} from 'lucide-react';

type MeetingJobStatus = 'processing' | 'completed' | 'failed' | 'pending';

interface MeetingJob {
  id: string;
  name: string;
  source: 'zoom' | 'meet' | 'teams';
  time: string;
  status: MeetingJobStatus;
  duration?: string;
}

interface MeetingJobsTableProps {
  meetings?: MeetingJob[];
  onViewTranscript?: (id: string) => void;
  onViewSequence?: (id: string) => void;
  onRetry?: (id: string) => void;
}

const defaultMeetings: MeetingJob[] = [
  { id: '1', name: 'Acme Corp - Sales Discovery', source: 'meet', time: '22 min ago', status: 'processing', duration: '47m' },
  { id: '2', name: 'Globex Inc - Quarterly Review', source: 'zoom', time: '2h ago', status: 'completed', duration: '58m' },
  { id: '3', name: 'Initech - Product Demo', source: 'teams', time: '4h ago', status: 'completed', duration: '32m' },
  { id: '4', name: 'Meridian Health - Technical Review', source: 'zoom', time: '6h ago', status: 'failed', duration: '25m' },
  { id: '5', name: 'Brightpath Consulting - Intro Call', source: 'meet', time: '1d ago', status: 'pending', duration: '41m' },
];

const sourceIcons: Record<string, typeof Video> = {
  zoom: Video,
  meet: MonitorPlay,
  teams: Users,
};

const sourceLabels: Record<string, string> = {
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Teams',
};

const statusConfig: Record<MeetingJobStatus, { label: string; color: string; bg: string }> = {
  processing: { label: 'Processing', color: '#FFD75F', bg: 'rgba(255, 215, 95, 0.10)' },
  completed: { label: 'Completed', color: '#4DFFA3', bg: 'rgba(77, 255, 163, 0.10)' },
  failed: { label: 'Failed', color: '#FF5D5D', bg: 'rgba(255, 93, 93, 0.10)' },
  pending: { label: 'Pending', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.10)' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
};

const row = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function MeetingJobsTable({
  meetings = defaultMeetings,
  onViewTranscript,
  onViewSequence,
  onRetry,
}: MeetingJobsTableProps) {
  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="p-5 pb-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#38E8FF]/10 flex items-center justify-center">
          <ListVideo className="w-4 h-4 text-[#38E8FF]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Recent Meetings</h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[1fr_120px_80px_100px_140px] gap-2 px-5 py-2 text-[10px] uppercase tracking-wider text-gray-500 light:text-gray-400 font-medium border-b border-gray-800/50 light:border-gray-100">
          <span>Meeting</span>
          <span>Source</span>
          <span>Time</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <motion.div variants={container} initial="hidden" animate="show">
          {meetings.map((meeting) => {
            const SourceIcon = sourceIcons[meeting.source];
            const config = statusConfig[meeting.status];
            return (
              <motion.div
                key={meeting.id}
                variants={row}
                className="grid grid-cols-[1fr_120px_80px_100px_140px] gap-2 items-center px-5 py-3 border-b border-gray-800/30 light:border-gray-50 last:border-b-0 hover:bg-white/[0.02] light:hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white light:text-gray-900 truncate">{meeting.name}</p>
                  {meeting.duration && (
                    <span className="text-[10px] text-gray-500 light:text-gray-400">{meeting.duration}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <SourceIcon className="w-3.5 h-3.5 text-gray-400 light:text-gray-500" strokeWidth={1.5} />
                  <span className="text-xs text-gray-400 light:text-gray-500">{sourceLabels[meeting.source]}</span>
                </div>
                <span className="text-xs text-gray-500 light:text-gray-400 tabular-nums">{meeting.time}</span>
                <span
                  className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {config.label}
                </span>
                <div className="flex items-center justify-end gap-1.5">
                  {meeting.status === 'completed' && (
                    <>
                      <button
                        onClick={() => onViewTranscript?.(meeting.id)}
                        className="text-[11px] text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
                      >
                        <Eye className="w-3 h-3" /> Transcript
                      </button>
                      <button
                        onClick={() => onViewSequence?.(meeting.id)}
                        className="text-[11px] text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
                      >
                        <Layers className="w-3 h-3" /> Sequence
                      </button>
                    </>
                  )}
                  {meeting.status === 'failed' && (
                    <button
                      onClick={() => onRetry?.(meeting.id)}
                      className="text-[11px] text-[#FF5D5D] hover:text-[#FF8585] transition-colors flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-[#FF5D5D]/10"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  )}
                  {meeting.status === 'processing' && (
                    <span className="text-[11px] text-[#FFD75F]/60">Processing...</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Mobile card layout */}
      <motion.div className="md:hidden px-3 pb-3 space-y-2" variants={container} initial="hidden" animate="show">
        {meetings.map((meeting) => {
          const SourceIcon = sourceIcons[meeting.source];
          const config = statusConfig[meeting.status];
          return (
            <motion.div
              key={meeting.id}
              variants={row}
              className="rounded-xl bg-gray-800/40 light:bg-gray-50 border border-gray-700/30 light:border-gray-200 p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-white light:text-gray-900 truncate flex-1 mr-2">{meeting.name}</p>
                <span
                  className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 light:text-gray-400">
                <span className="flex items-center gap-1">
                  <SourceIcon className="w-3 h-3" /> {sourceLabels[meeting.source]}
                </span>
                {meeting.duration && <span>{meeting.duration}</span>}
                <span>{meeting.time}</span>
              </div>
              {(meeting.status === 'completed' || meeting.status === 'failed') && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/30 light:border-gray-200">
                  {meeting.status === 'completed' && (
                    <>
                      <button
                        onClick={() => onViewTranscript?.(meeting.id)}
                        className="text-[11px] text-[#6366F1] flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Transcript
                      </button>
                      <button
                        onClick={() => onViewSequence?.(meeting.id)}
                        className="text-[11px] text-[#7A5CFF] flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3" /> Sequence
                      </button>
                    </>
                  )}
                  {meeting.status === 'failed' && (
                    <button
                      onClick={() => onRetry?.(meeting.id)}
                      className="text-[11px] text-[#FF5D5D] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
