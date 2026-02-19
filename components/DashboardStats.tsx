'use client';

import { CountUp } from './ui/CountUp';

interface DashboardStatsProps {
  stats: {
    total: number;
    generated: number;
    sent: number;
    failed: number;
    avgCost: number;
    avgLatency: number;
  };
}

function formatTimeSaved(latencyMs: number): string {
  if (latencyMs <= 0) return '0s';
  // Estimate: manual follow-up takes ~15 min, AI takes avgLatency ms
  // Time saved per draft ≈ 15 min - latency
  const savedMinutes = Math.max(0, 15 - (latencyMs / 60000));
  if (savedMinutes >= 60) {
    const h = Math.floor(savedMinutes / 60);
    const m = Math.round(savedMinutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(savedMinutes)}m`;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  // Estimate total time saved: (15 min manual - avg AI time) * total drafts
  const avgAiMinutes = stats.avgLatency / 60000;
  const timeSavedPerDraft = Math.max(0, 15 - avgAiMinutes);
  const totalTimeSavedMinutes = Math.round(timeSavedPerDraft * stats.total);

  const statCards = [
    {
      label: 'Follow-ups This Period',
      value: stats.total,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"/>
        </svg>
      ),
      gradient: 'from-indigo-500 via-indigo-400 to-indigo-300',
      textGradient: 'from-indigo-400 via-indigo-300 to-indigo-400',
      lightColor: 'light:text-indigo-600',
      borderHover: 'group-hover:border-indigo-400/50',
      delay: 0,
      displayMode: 'number' as const,
    },
    {
      label: 'Awaiting Your Review',
      value: stats.generated,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V13"/>
          <path d="M17.586 3.58601C17.7705 3.39499 17.9912 3.24262 18.2352 3.13781C18.4792 3.03299 18.7416 2.97782 19.0072 2.97551C19.2728 2.9732 19.5361 3.0238 19.7819 3.12437C20.0277 3.22493 20.251 3.37343 20.4388 3.56122C20.6266 3.74901 20.7751 3.97231 20.8756 4.2181C20.9762 4.46389 21.0268 4.72725 21.0245 4.99281C21.0222 5.25837 20.967 5.52081 20.8622 5.76482C20.7574 6.00883 20.605 6.22952 20.414 6.41401L11.828 15H9V12.172L17.586 3.58601Z"/>
        </svg>
      ),
      gradient: 'from-amber-400 via-yellow-400 to-orange-400',
      textGradient: 'from-amber-300 via-yellow-200 to-orange-300',
      lightColor: 'light:text-amber-600',
      borderHover: 'group-hover:border-amber-400/50',
      delay: 100,
      displayMode: 'number' as const,
    },
    {
      label: 'Delivered',
      value: stats.sent,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86"/>
          <path d="M22 4L12 14.01L9 11.01"/>
        </svg>
      ),
      gradient: 'from-amber-400 via-amber-500 to-orange-400',
      textGradient: 'from-amber-300 via-amber-200 to-orange-300',
      lightColor: 'light:text-amber-600',
      borderHover: 'group-hover:border-amber-400/50',
      delay: 200,
      displayMode: 'number' as const,
    },
    {
      label: 'Avg. Time Saved',
      value: totalTimeSavedMinutes,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      ),
      gradient: 'from-indigo-400 via-indigo-300 to-indigo-400',
      textGradient: 'from-indigo-300 via-indigo-200 to-indigo-300',
      lightColor: 'light:text-indigo-600',
      borderHover: 'group-hover:border-indigo-400/50',
      delay: 300,
      displayMode: 'time' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`
            group relative overflow-hidden
            bg-gray-900/50 light:bg-white/70
            backdrop-blur-xl
            rounded-2xl p-5
            border border-white/10 light:border-gray-200
            cursor-pointer
            transition-colors
            ${stat.borderHover}
          `}
        >

          {/* Icon container */}
          <div className={`
            relative mb-4 inline-flex rounded-xl p-3
            bg-gradient-to-br ${stat.gradient}
            shadow-sm
            transition-all duration-300
            group-hover:scale-105
          `}>
            <div className="relative text-white animate-pulse-slow">
              {stat.icon}
            </div>
          </div>

          {/* Number with count-up */}
          <div
            className={`text-4xl md:text-5xl font-black mb-1 tabular-nums bg-gradient-to-r ${stat.textGradient} bg-clip-text text-transparent light-solid-text ${stat.lightColor}`}
          >
            {stat.displayMode === 'time' ? (
              <span className="text-3xl md:text-4xl">
                {totalTimeSavedMinutes >= 60
                  ? `${Math.floor(totalTimeSavedMinutes / 60)}h ${totalTimeSavedMinutes % 60}m`
                  : `${totalTimeSavedMinutes}m`
                }
              </span>
            ) : (
              <CountUp
                end={stat.value}
                duration={1500}
              />
            )}
          </div>

          {/* Label */}
          <div className="text-sm text-gray-400 light:text-gray-500 group-hover:text-gray-300 light:group-hover:text-gray-600 transition-colors duration-300">
            {stat.label}
          </div>

          {/* Corner accent */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-bl-full`} />
        </div>
      ))}
    </div>
  );
}
