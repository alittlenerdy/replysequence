'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Clock, TrendingUp, Sparkles, Coffee, Calendar, DollarSign } from 'lucide-react';

interface TimeSavingsData {
  totalDrafts: number;
  sentDrafts: number;
  minutesPerDraft: number;
  hourlyRate: number;
}

interface TimeSavingsWidgetProps {
  /** Pass data directly (from parent) or leave undefined to fetch */
  initialData?: TimeSavingsData;
  /** Whether to fetch data automatically */
  autoFetch?: boolean;
  /** Custom hourly rate for calculation (default $100/hr) */
  hourlyRate?: number;
}

// Constants for time calculation
const DEFAULT_MINUTES_PER_DRAFT = 15; // Average time to write a follow-up email manually
const DEFAULT_HOURLY_RATE = 100;

// Fun comparisons based on hours saved
function getFunComparison(hours: number): { icon: React.ReactNode; text: string } {
  if (hours >= 40) {
    return {
      icon: <Calendar className="w-4 h-4" />,
      text: "That's a whole work week you got back!",
    };
  }
  if (hours >= 20) {
    return {
      icon: <Coffee className="w-4 h-4" />,
      text: "Like having 2.5 extra work days!",
    };
  }
  if (hours >= 8) {
    return {
      icon: <Calendar className="w-4 h-4" />,
      text: "That's a full work day saved!",
    };
  }
  if (hours >= 4) {
    return {
      icon: <Coffee className="w-4 h-4" />,
      text: "That's an entire afternoon back!",
    };
  }
  if (hours >= 2) {
    return {
      icon: <Coffee className="w-4 h-4" />,
      text: "Enough time for a long coffee break!",
    };
  }
  if (hours >= 1) {
    return {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "You're building momentum!",
    };
  }
  return {
    icon: <Sparkles className="w-4 h-4" />,
    text: "Every minute counts!",
  };
}

// Animated number component with spring physics
function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 50,
    damping: 20,
  });

  const display = useTransform(spring, (current) => {
    return decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedDollar({ value }: { value: number }) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 50,
    damping: 20,
  });

  const display = useTransform(spring, (current) => {
    return '$' + Math.floor(current).toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

// Sparkline visualization of savings over time
function SavingsSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const height = 40;
  const width = 120;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * height * 0.8 - 4;
    return `${x},${y}`;
  }).join(' ');

  // Create area under the line
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#sparklineGradient)"
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function TimeSavingsWidget({
  initialData,
  autoFetch = true,
  hourlyRate = DEFAULT_HOURLY_RATE,
}: TimeSavingsWidgetProps) {
  const [data, setData] = useState<TimeSavingsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData && autoFetch);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const analytics = await response.json();
        setData({
          totalDrafts: analytics.emailsGenerated || 0,
          sentDrafts: analytics.emailsSent || 0,
          minutesPerDraft: DEFAULT_MINUTES_PER_DRAFT,
          hourlyRate: analytics.roi?.hourlyRate || hourlyRate,
        });
      }
    } catch (error) {
      console.error('[TIME-SAVINGS] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [hourlyRate]);

  useEffect(() => {
    if (autoFetch && !initialData && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [autoFetch, initialData, fetchData]);

  // Calculate metrics
  const totalDrafts = data?.totalDrafts || 0;
  const minutesPerDraft = data?.minutesPerDraft || DEFAULT_MINUTES_PER_DRAFT;
  const effectiveHourlyRate = data?.hourlyRate || hourlyRate;

  const totalMinutesSaved = totalDrafts * minutesPerDraft;
  const hoursSaved = totalMinutesSaved / 60;
  const dollarValue = hoursSaved * effectiveHourlyRate;

  const hasData = totalDrafts > 0;
  const comparison = getFunComparison(hoursSaved);

  // Generate deterministic sparkline data (no Math.random to avoid hydration mismatch)
  const sparklineData = hasData
    ? Array.from({ length: 7 }, (_, i) => Math.min(totalDrafts, Math.floor((i + 1) * (totalDrafts / 7))))
    : [];

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
          <div>
            <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-16 w-40 bg-gray-700 light:bg-gray-200 rounded mx-auto mb-4" />
        <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded mx-auto" />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-2xl" />

      {/* Inner content with slight inset for border effect */}
      <div className="relative m-[1px] bg-gray-900/95 light:bg-white/95 backdrop-blur-xl rounded-2xl p-6">
        {/* Background glow effects */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-gray-900">Time Saved</h3>
              <p className="text-sm text-gray-400 light:text-gray-500">Your productivity gains</p>
            </div>
          </div>
          {hasData && sparklineData.length > 1 && (
            <SavingsSparkline data={sparklineData} />
          )}
        </div>

        {hasData ? (
          <div className="relative space-y-6">
            {/* Main hours saved - BIG and prominent */}
            <div className="text-center py-2">
              <div className="text-5xl md:text-6xl font-black mb-2">
                <span
                  className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                  style={{
                    textShadow: '0 0 60px rgba(34, 211, 238, 0.3)',
                  }}
                >
                  <AnimatedNumber value={hoursSaved} decimals={1} />
                </span>
                <span className="text-2xl md:text-3xl text-gray-400 light:text-gray-500 ml-2">hours</span>
              </div>
              <p className="text-sm text-gray-400 light:text-gray-500">saved writing follow-up emails</p>
            </div>

            {/* Fun comparison */}
            <div
              className="flex items-center justify-center gap-2 text-cyan-400 light:text-cyan-600 bg-cyan-500/10 rounded-lg py-2 px-4 mx-auto w-fit"
            >
              {comparison.icon}
              <span className="text-sm font-medium">{comparison.text}</span>
            </div>

            {/* Breakdown stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50 light:border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white light:text-gray-900">
                  <AnimatedNumber value={totalDrafts} decimals={0} />
                </div>
                <p className="text-xs text-gray-500">emails drafted</p>
              </div>

              <div className="text-center border-x border-gray-700/50 light:border-gray-200">
                <div className="text-2xl font-bold text-white light:text-gray-900">
                  {minutesPerDraft}<span className="text-sm text-gray-400 ml-1">min</span>
                </div>
                <p className="text-xs text-gray-500">saved per draft</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  <AnimatedDollar value={dollarValue} />
                </div>
                <p className="text-xs text-gray-500">value at ${effectiveHourlyRate}/hr</p>
              </div>
            </div>

            {/* Calculation explanation */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {totalDrafts} drafts x {minutesPerDraft} min = {totalMinutesSaved} minutes ({hoursSaved.toFixed(1)} hours)
            </div>
          </div>
        ) : (
          /* Empty state - show potential savings */
          <div className="relative text-center py-6">
            <div
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white light:text-gray-900 mb-1">
                  Start Saving Time
                </h4>
                <p className="text-gray-400 light:text-gray-500 text-sm max-w-xs mx-auto">
                  Each AI-generated email saves you ~{minutesPerDraft} minutes of writing time
                </p>
              </div>

              {/* Potential savings preview */}
              <div className="bg-gray-800/50 light:bg-gray-100 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-300 light:text-gray-600">Potential Monthly Savings</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-bold text-white light:text-gray-900">10 emails</div>
                    <div className="text-emerald-400">${Math.round((10 * minutesPerDraft / 60) * effectiveHourlyRate)}</div>
                  </div>
                  <div className="border-x border-gray-700 light:border-gray-300">
                    <div className="font-bold text-white light:text-gray-900">25 emails</div>
                    <div className="text-emerald-400">${Math.round((25 * minutesPerDraft / 60) * effectiveHourlyRate)}</div>
                  </div>
                  <div>
                    <div className="font-bold text-white light:text-gray-900">50 emails</div>
                    <div className="text-emerald-400">${Math.round((50 * minutesPerDraft / 60) * effectiveHourlyRate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
