'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Zap,
  Video,
  Mail,
  Send,
  ListChecks,
  Database,
  Sparkles,
} from 'lucide-react';

// Types matching the API response
interface ActionBreakdown {
  meetingsProcessed: number;
  draftsGenerated: number;
  emailsSent: number;
  sequencesCreated: number;
  crmUpdates: number;
}

interface PeriodMetrics {
  hoursSaved: number;
  dollarValue: number;
  totalActions: number;
  breakdown: ActionBreakdown;
}

interface TimeSavingsResponse {
  weekly: PeriodMetrics;
  monthly: PeriodMetrics;
  allTime: PeriodMetrics;
  hourlyRate: number;
}

type Period = 'weekly' | 'monthly';

// Animated number with spring physics
function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const spring = useSpring(0, { mass: 1, stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) =>
    decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString(),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

function AnimatedDollar({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 1, stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) =>
    '$' + Math.floor(current).toLocaleString(),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

// Action breakdown row
function BreakdownRow({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-white light:text-gray-900 tabular-nums">
        {count}
      </span>
    </div>
  );
}

export function TimeSavingsWidget() {
  const [data, setData] = useState<TimeSavingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('weekly');
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/time-savings');
      if (response.ok) {
        const result: TimeSavingsResponse = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('[TIME-SAVINGS] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl bg-gray-900/60 light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-700/50 light:bg-gray-200" />
          <div>
            <div className="h-4 w-28 bg-gray-700/50 light:bg-gray-200 rounded mb-1.5" />
            <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-14 w-32 bg-gray-700/50 light:bg-gray-200 rounded mx-auto mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-700/50 light:bg-gray-200 rounded-lg" />
          <div className="h-16 bg-gray-700/50 light:bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const metrics: PeriodMetrics = data
    ? data[period]
    : { hoursSaved: 0, dollarValue: 0, totalActions: 0, breakdown: { meetingsProcessed: 0, draftsGenerated: 0, emailsSent: 0, sequencesCreated: 0, crmUpdates: 0 } };

  const hasData = metrics.totalActions > 0;
  const hourlyRate = data?.hourlyRate ?? 150;

  return (
    <div className="rounded-2xl bg-gray-900/60 light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5">
      {/* Header with period toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900">
              Time Saved
            </h3>
            <p className="text-[10px] text-[#8892B0] light:text-gray-500">
              Your productivity gains
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex bg-gray-800/60 light:bg-gray-100 rounded-lg p-0.5">
          {(['weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-[#6366F1] text-white'
                  : 'text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-700'
              }`}
            >
              {p === 'weekly' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="space-y-4">
          {/* Primary metric: Hours saved */}
          <div className="text-center py-1">
            <div className="text-4xl font-black text-[#6366F1] light:text-[#4F46E5] mb-0.5">
              <AnimatedNumber value={metrics.hoursSaved} decimals={1} />
              <span className="text-lg text-gray-400 light:text-gray-500 ml-1.5 font-semibold">
                hours
              </span>
            </div>
            <p className="text-[10px] text-[#8892B0] light:text-gray-500">
              saved {period === 'weekly' ? 'this week' : 'this month'}
            </p>
          </div>

          {/* Dollar value + total actions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-800/40 light:bg-gray-50 border border-[#1E2A4A]/50 light:border-gray-200 p-3 text-center">
              <div className="text-lg font-bold text-amber-400">
                <AnimatedDollar value={metrics.dollarValue} />
              </div>
              <p className="text-[10px] text-[#8892B0] light:text-gray-500">
                value at ${hourlyRate}/hr
              </p>
            </div>
            <div className="rounded-xl bg-gray-800/40 light:bg-gray-50 border border-[#1E2A4A]/50 light:border-gray-200 p-3 text-center">
              <div className="text-lg font-bold text-[#22C55E]">
                <AnimatedNumber value={metrics.totalActions} decimals={0} />
              </div>
              <p className="text-[10px] text-[#8892B0] light:text-gray-500">
                actions taken
              </p>
            </div>
          </div>

          {/* Action breakdown */}
          <div className="pt-3 border-t border-[#1E2A4A]/50 light:border-gray-200">
            <p className="text-[10px] font-medium text-[#8892B0]/70 light:text-gray-400 uppercase tracking-wider mb-2">
              Breakdown
            </p>
            <div className="space-y-0.5">
              <BreakdownRow
                icon={<Video className="w-3.5 h-3.5" />}
                label="Meetings processed"
                count={metrics.breakdown.meetingsProcessed}
                color="#06B6D4"
              />
              <BreakdownRow
                icon={<Mail className="w-3.5 h-3.5" />}
                label="Drafts generated"
                count={metrics.breakdown.draftsGenerated}
                color="#818CF8"
              />
              <BreakdownRow
                icon={<Send className="w-3.5 h-3.5" />}
                label="Emails sent"
                count={metrics.breakdown.emailsSent}
                color="#22C55E"
              />
              <BreakdownRow
                icon={<ListChecks className="w-3.5 h-3.5" />}
                label="Sequences created"
                count={metrics.breakdown.sequencesCreated}
                color="#F59E0B"
              />
              <BreakdownRow
                icon={<Database className="w-3.5 h-3.5" />}
                label="CRM updates"
                count={metrics.breakdown.crmUpdates}
                color="#EC4899"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-[#6366F1]" />
          </div>
          <h4 className="text-sm font-semibold text-white light:text-gray-900 mb-1">
            Start Saving Time
          </h4>
          <p className="text-[10px] text-[#8892B0] light:text-gray-500 max-w-[200px] mx-auto mb-3">
            Process your first meeting and watch the savings add up
          </p>
          <div className="bg-gray-800/50 light:bg-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-medium text-gray-300 light:text-gray-600">
                Potential savings per meeting
              </span>
            </div>
            <div className="text-lg font-bold text-amber-400">
              ${Math.round((25 / 60) * hourlyRate)}
            </div>
            <p className="text-[10px] text-[#8892B0] light:text-gray-500">
              25 min saved at ${hourlyRate}/hr
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
