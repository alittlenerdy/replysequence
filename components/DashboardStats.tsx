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

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      label: 'Total Drafts',
      value: stats.total,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      delay: 0,
    },
    {
      label: 'Ready to Send',
      value: stats.generated,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-500',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      delay: 100,
    },
    {
      label: 'Sent',
      value: stats.sent,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500',
      glowColor: 'rgba(34, 197, 94, 0.4)',
      delay: 200,
    },
    {
      label: 'Avg Cost',
      value: stats.avgCost,
      isCost: true,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-violet-500',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      delay: 300,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="group relative bg-gray-900/60 light:bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-700/50 light:border-gray-200 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-[1.02] animate-card-fade-in"
          style={{
            animationDelay: `${stat.delay}ms`,
            animationFillMode: 'backwards',
          }}
        >
          {/* Glow effect on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            style={{
              boxShadow: `0 20px 50px ${stat.glowColor}`,
            }}
          />

          {/* Icon container with gradient background and pulse */}
          <div
            className={`mb-4 inline-flex rounded-xl p-3 bg-gradient-to-br ${stat.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
          >
            {/* Icon with pulse animation */}
            <div className="text-white animate-pulse-slow">
              {stat.icon}
            </div>
          </div>

          {/* Number with count-up */}
          <div className="text-3xl font-bold text-white light:text-gray-900 mb-1 tabular-nums">
            {stat.isCost ? (
              <CountUp
                end={stat.value}
                prefix="$"
                decimals={4}
                duration={2000}
              />
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

          {/* Border glow on hover */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
