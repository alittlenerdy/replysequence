'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  gradient: string;
  accentColor: string;
  delay?: number;
  comparison?: PeriodComparison;
  sparklineData?: number[];
  hero?: boolean;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    return Math.floor(current).toLocaleString() + suffix;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

// Mini sparkline component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  subtitle,
  gradient,
  accentColor,
  delay = 0,
  comparison,
  sparklineData,
  hero = false,
}: StatCardProps) {
  const card = (
    <div className="relative group">
      {/* Card */}
      <div className={`relative bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 hover:border-gray-600 light:hover:border-gray-300 rounded-2xl p-5 transition-colors duration-300 overflow-hidden light:shadow-sm ${hero ? 'h-full' : ''}`}>

        {/* Content */}
        <div className="relative">
          {/* Header row with icon and sparkline */}
          <div className="flex items-start justify-between mb-3">
            {/* Icon */}
            <div
              className={`${hero ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center`}
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <div style={{ color: accentColor }}>{icon}</div>
            </div>

            {/* Sparkline */}
            {sparklineData && sparklineData.length > 1 && (
              <MiniSparkline data={sparklineData} color={accentColor} />
            )}
          </div>

          {/* Value - BIGGER and with gradient */}
          <div
            className={`${hero ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'} font-black mb-1 tabular-nums`}
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            <AnimatedCounter value={value} suffix={suffix} />
          </div>

          {/* Label */}
          <div className={`${hero ? 'text-base' : 'text-sm'} text-gray-400 light:text-gray-500 font-medium`}>{label}</div>

          {/* Trend indicator */}
          {comparison && comparison.change > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  comparison.trend === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : comparison.trend === 'down'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {comparison.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {comparison.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {comparison.trend === 'neutral' && <Minus className="w-3 h-3" />}
                {comparison.change}%
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}

          {/* Subtitle */}
          {subtitle && !comparison && (
            <div className="text-xs text-gray-500 light:text-gray-400 mt-2">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );

  if (hero) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/40 to-indigo-700/40 p-[1px] rounded-2xl">
        {card}
      </div>
    );
  }

  return card;
}
