'use client';

import { motion } from 'framer-motion';
import { FileText, Video, Layers, AlertTriangle, Clock } from 'lucide-react';
import { CountUp } from './ui/CountUp';

interface DashboardStatsProps {
  stats: {
    total: number;
    generated: number;
    sent: number;
    failed: number;
    avgCost: number;
    avgLatency: number;
    meetingsProcessed?: number;
    sequencesActive?: number;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const avgAiMinutes = stats.avgLatency / 60000;
  const timeSavedPerDraft = Math.max(0, 15 - avgAiMinutes);
  const totalTimeSavedMinutes = Math.round(timeSavedPerDraft * stats.total);

  const statCards = [
    {
      label: 'Awaiting Review',
      subtitle: 'Follow-ups ready to send',
      value: stats.generated,
      Icon: FileText,
      iconColor: '#6366F1',
      textGradient: 'from-[#818CF8] via-[#B3BFFF] to-[#6366F1]',
      lightColor: 'light:text-[#4F46E5]',
      hero: true,
      displayMode: 'number' as const,
    },
    {
      label: 'Meetings Processed',
      subtitle: 'Calls with transcripts',
      value: stats.meetingsProcessed ?? 0,
      Icon: Video,
      iconColor: '#38E8FF',
      textGradient: 'from-[#38E8FF] via-[#7AF0FF] to-[#38E8FF]',
      lightColor: 'light:text-[#0891B2]',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Sequences Active',
      subtitle: 'Multi-step nurture flows',
      value: stats.sequencesActive ?? 0,
      Icon: Layers,
      iconColor: '#7A5CFF',
      textGradient: 'from-[#9B7FFF] via-[#C4B5FF] to-[#7A5CFF]',
      lightColor: 'light:text-[#6D28D9]',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Deals at Risk',
      subtitle: 'Missed follow-ups or overdue',
      value: stats.failed,
      Icon: AlertTriangle,
      iconColor: stats.failed > 0 ? '#FF5D5D' : '#4DFFA3',
      textGradient: stats.failed > 0
        ? 'from-[#FF5D5D] via-[#FF8585] to-[#FF5D5D]'
        : 'from-[#4DFFA3] via-[#7AFFBF] to-[#4DFFA3]',
      lightColor: stats.failed > 0 ? 'light:text-[#DC2626]' : 'light:text-[#059669]',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Time Saved',
      subtitle: 'vs. manual follow-ups',
      value: totalTimeSavedMinutes,
      Icon: Clock,
      iconColor: '#FFD75F',
      textGradient: 'from-[#FFD75F] via-[#FFE799] to-[#FFD75F]',
      lightColor: 'light:text-[#B45309]',
      hero: false,
      displayMode: 'time' as const,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {statCards.map((stat) => {
        const IconComponent = stat.Icon;
        return (
          <motion.div
            key={stat.label}
            variants={item}
            className={`rounded-2xl bg-gray-900/60 border light:bg-white ${
              stat.hero
                ? 'border-[#6366F1]/30 light:border-[#4F46E5]/20 col-span-2 md:col-span-1'
                : 'border-gray-700/50 light:border-gray-200'
            }`}
          >
            <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.04]">
              <div
                className="relative mb-3 inline-flex rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${stat.iconColor}15`,
                  boxShadow: stat.hero ? `0 4px 16px ${stat.iconColor}30` : `0 4px 16px ${stat.iconColor}20`,
                }}
              >
                <IconComponent className="w-5 h-5" style={{ color: stat.iconColor }} strokeWidth={1.5} />
              </div>

              <div
                className={`text-3xl md:text-4xl font-black mb-0.5 tabular-nums bg-gradient-to-r ${stat.textGradient} bg-clip-text text-transparent light-solid-text ${stat.lightColor}`}
              >
                {stat.displayMode === 'time' ? (
                  <span>
                    {totalTimeSavedMinutes >= 60 ? (
                      <><CountUp end={Math.floor(totalTimeSavedMinutes / 60)} duration={1500} suffix="h" /> <CountUp end={totalTimeSavedMinutes % 60} duration={1500} suffix="m" /></>
                    ) : (
                      <CountUp end={totalTimeSavedMinutes} duration={1500} suffix="m" />
                    )}
                  </span>
                ) : (
                  <CountUp end={stat.value} duration={1500} />
                )}
              </div>

              <div className="text-sm font-medium text-white/80 light:text-gray-700">
                {stat.label}
              </div>

              <div className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                {stat.subtitle}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
