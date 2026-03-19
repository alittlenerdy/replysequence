'use client';

import { motion } from 'framer-motion';
import { Video, Layers, Clock, FileText, Send, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIData {
  meetingsProcessed?: number;
  sequencesGenerated?: number;
  avgTimeSaved?: number;
  draftsReady?: number;
  followUpsSent?: number;
  trends?: {
    meetings?: 'up' | 'down' | 'flat';
    sequences?: 'up' | 'down' | 'flat';
    timeSaved?: 'up' | 'down' | 'flat';
    drafts?: 'up' | 'down' | 'flat';
    followUps?: 'up' | 'down' | 'flat';
  };
}

interface KPIStripProps {
  data?: KPIData;
}

const defaultData: KPIData = {
  meetingsProcessed: 24,
  sequencesGenerated: 18,
  avgTimeSaved: 12,
  draftsReady: 7,
  followUpsSent: 31,
  trends: {
    meetings: 'up',
    sequences: 'up',
    timeSaved: 'up',
    drafts: 'flat',
    followUps: 'up',
  },
};

function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'flat' }) {
  if (!trend || trend === 'flat') {
    return <Minus className="w-3 h-3 text-gray-500" />;
  }
  if (trend === 'up') {
    return <TrendingUp className="w-3 h-3 text-[#4DFFA3]" />;
  }
  return <TrendingDown className="w-3 h-3 text-[#FF5D5D]" />;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function KPIStrip({ data = defaultData }: KPIStripProps) {
  const cards: Array<{
    label: string;
    value: number;
    suffix: string;
    icon: typeof Video;
    color: string;
    trend?: 'up' | 'down' | 'flat';
    highlighted?: boolean;
  }> = [
    {
      label: 'Meetings Processed',
      value: data.meetingsProcessed ?? 0,
      suffix: '',
      icon: Video,
      color: '#38E8FF',
      trend: data.trends?.meetings,
    },
    {
      label: 'Sequences Generated',
      value: data.sequencesGenerated ?? 0,
      suffix: '',
      icon: Layers,
      color: '#7A5CFF',
      trend: data.trends?.sequences,
    },
    {
      label: 'Avg Time Saved',
      value: data.avgTimeSaved ?? 0,
      suffix: ' min/mtg',
      icon: Clock,
      color: '#4DFFA3',
      trend: data.trends?.timeSaved,
    },
    {
      label: 'Drafts Ready',
      value: data.draftsReady ?? 0,
      suffix: '',
      icon: FileText,
      color: '#6366F1',
      trend: data.trends?.drafts,
      highlighted: true,
    },
    {
      label: 'Follow-Ups Sent',
      value: data.followUpsSent ?? 0,
      suffix: '',
      icon: Send,
      color: '#4DFFA3',
      trend: data.trends?.followUps,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={item}
            className={`rounded-2xl p-4 group hover:-translate-y-0.5 hover:bg-white/[0.04] transition-all duration-200 shadow-md light:shadow-md ${
              card.highlighted
                ? 'bg-[#6366F1]/[0.12] border border-[#6366F1]/25 light:bg-indigo-50 light:border-indigo-200'
                : 'bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${card.color}12` }}
              >
                <Icon className="w-4 h-4" style={{ color: card.color }} strokeWidth={1.5} />
              </div>
              <TrendIndicator trend={card.trend} />
            </div>
            <div className="text-2xl font-bold text-white light:text-gray-900 tabular-nums">
              {card.value}
              {card.suffix && (
                <span className="text-xs font-normal text-gray-500 light:text-gray-400 ml-0.5">
                  {card.suffix}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 light:text-gray-400 mt-0.5">
              {card.label}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
