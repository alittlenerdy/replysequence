'use client';

import { motion } from 'framer-motion';
import { Mic, Users, MessageSquare, Timer } from 'lucide-react';
import type { SpeakerAnalytics } from '@/lib/types/analytics';

// Indigo-based speaker colors for the bar chart
const SPEAKER_COLORS = [
  '#6366F1', // indigo-500
  '#818CF8', // indigo-400
  '#A5B4FC', // indigo-300
  '#F59E0B', // amber-500
  '#FBBF24', // amber-400
  '#3B82F6', // blue-500
  '#60A5FA', // blue-400
  '#93C5FD', // blue-300
  '#A855F7', // purple-500
  '#C084FC', // purple-400
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

interface SpeakerInsightsProps {
  data: SpeakerAnalytics;
}

export function SpeakerInsights({ data }: SpeakerInsightsProps) {
  if (data.meetingsAnalyzed === 0 || data.speakers.length === 0) {
    return null;
  }

  const topSpeakers = data.speakers.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Mic className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Speaker Insights</h3>
          <p className="text-xs text-gray-500">
            Across {data.meetingsAnalyzed} meeting{data.meetingsAnalyzed !== 1 ? 's' : ''} with transcripts
          </p>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-4 light:shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-gray-500">Speakers</span>
          </div>
          <p className="text-2xl font-bold text-white light:text-gray-900">{data.totalSpeakers}</p>
          <p className="text-xs text-gray-500 mt-0.5">unique voices</p>
        </div>

        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-4 light:shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-gray-500">Monologues</span>
          </div>
          <p className="text-2xl font-bold text-white light:text-gray-900">{data.totalMonologues}</p>
          <p className="text-xs text-gray-500 mt-0.5">segments &gt; 60s</p>
        </div>

        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-4 light:shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-gray-500">Talk Ratio</span>
          </div>
          <p className="text-2xl font-bold text-white light:text-gray-900">
            {data.avgTalkToListenRatio !== null ? `${data.avgTalkToListenRatio}%` : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">your talk time</p>
        </div>
      </div>

      {/* Speaker breakdown — bar chart + table */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 light:shadow-sm">
        <h4 className="text-sm font-medium text-gray-400 light:text-gray-500 mb-4">Talk Time Distribution</h4>

        {/* Stacked horizontal bar */}
        <div className="h-6 rounded-full overflow-hidden flex bg-gray-800 light:bg-gray-200 mb-5">
          {topSpeakers.map((speaker, i) => (
            <motion.div
              key={speaker.speaker}
              initial={{ width: 0 }}
              animate={{ width: `${speaker.talkTimePercent}%` }}
              transition={{ duration: 0.8, delay: 0.1 * i }}
              className="h-full relative group"
              style={{ backgroundColor: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }}
              title={`${speaker.speaker}: ${speaker.talkTimePercent}%`}
            />
          ))}
        </div>

        {/* Speaker table */}
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_70px_60px_80px] gap-2 text-xs text-gray-500 px-2 pb-1 border-b border-gray-700/50 light:border-gray-200">
            <span>Speaker</span>
            <span className="text-right">Talk Time</span>
            <span className="text-right">Share</span>
            <span className="text-right">Qs</span>
            <span className="text-right">Longest</span>
          </div>

          {topSpeakers.map((speaker, i) => (
            <motion.div
              key={speaker.speaker}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="grid grid-cols-[1fr_80px_70px_60px_80px] gap-2 items-center px-2 py-1.5 rounded-lg hover:bg-gray-800/50 light:hover:bg-gray-50 transition-colors"
            >
              {/* Speaker name with color indicator */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }}
                />
                <span className="text-sm text-white light:text-gray-900 truncate">{speaker.speaker}</span>
              </div>

              {/* Talk time */}
              <span className="text-sm text-gray-400 light:text-gray-500 text-right tabular-nums">
                {formatDuration(speaker.talkTimeMs)}
              </span>

              {/* Share */}
              <span className="text-sm font-medium text-white light:text-gray-900 text-right tabular-nums">
                {speaker.talkTimePercent}%
              </span>

              {/* Questions */}
              <span className="text-sm text-gray-400 light:text-gray-500 text-right tabular-nums">
                {speaker.questionCount}
              </span>

              {/* Longest monologue */}
              <span className="text-sm text-gray-400 light:text-gray-500 text-right tabular-nums">
                {formatDuration(speaker.longestMonologueMs)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Total row */}
        <div className="mt-2 pt-2 border-t border-gray-700/50 light:border-gray-200">
          <div className="grid grid-cols-[1fr_80px_70px_60px_80px] gap-2 items-center px-2 text-xs text-gray-500">
            <span className="font-medium">Total</span>
            <span className="text-right tabular-nums">{formatDuration(data.totalTalkTimeMs)}</span>
            <span className="text-right">100%</span>
            <span className="text-right tabular-nums">
              {data.speakers.reduce((sum, s) => sum + s.questionCount, 0)}
            </span>
            <span className="text-right">-</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
