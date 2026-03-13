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
    meetingsProcessed: number;
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
      iconColor: '#5B6CFF',
      textGradient: 'from-[#7A8BFF] via-[#B3BFFF] to-[#5B6CFF]',
      lightColor: 'light:text-[#4A5BEE]',
      hero: true,
      displayMode: 'number' as const,
    },
    {
      label: 'Meetings Processed',
      subtitle: 'Calls with transcripts',
      value: stats.meetingsProcessed,
      Icon: Video,
      iconColor: '#22D3EE',
      textGradient: 'from-cyan-300 via-cyan-200 to-cyan-400',
      lightColor: 'light:text-cyan-600',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Sequences Active',
      subtitle: 'Multi-step nurture flows',
      value: 0,
      Icon: Layers,
      iconColor: '#7A5CFF',
      textGradient: 'from-violet-300 via-purple-200 to-violet-400',
      lightColor: 'light:text-violet-600',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Deals at Risk',
      subtitle: 'Missed follow-ups or overdue',
      value: stats.failed,
      Icon: AlertTriangle,
      iconColor: stats.failed > 0 ? '#FF5C7A' : '#37D67A',
      textGradient: stats.failed > 0
        ? 'from-red-300 via-rose-200 to-red-400'
        : 'from-emerald-300 via-teal-200 to-emerald-400',
      lightColor: stats.failed > 0 ? 'light:text-red-600' : 'light:text-emerald-600',
      hero: false,
      displayMode: 'number' as const,
    },
    {
      label: 'Time Saved',
      subtitle: 'vs. manual follow-ups',
      value: totalTimeSavedMinutes,
      Icon: Clock,
      iconColor: '#FF9D2D',
      textGradient: 'from-amber-300 via-amber-200 to-orange-300',
      lightColor: 'light:text-amber-600',
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
                ? 'border-[#5B6CFF]/30 light:border-[#4A5BEE]/20 col-span-2 md:col-span-1'
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
                    {totalTimeSavedMinutes >= 60
                      ? `${Math.floor(totalTimeSavedMinutes / 60)}h ${totalTimeSavedMinutes % 60}m`
                      : `${totalTimeSavedMinutes}m`
                    }
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
