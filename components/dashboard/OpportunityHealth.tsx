'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface DealHealth {
  id: string;
  companyName: string;
  companyDomain: string | null;
  dealStage: string | null;
  healthScore: number | null;
  meetingCount: number;
  signalCount: number;
  lastMeetingAt: string | null;
  riskCount: number;
  nextStepCount: number;
  stakeholderCount: number;
  commitmentCount: number;
}

interface HealthData {
  deals: DealHealth[];
  totalDeals: number;
  dealsWithScores: number;
  avgScore: number | null;
  byLabel: {
    critical: number;
    at_risk: number;
    neutral: number;
    healthy: number;
    strong: number;
  };
}

function scoreColor(score: number | null): string {
  if (score === null) return '#6B7280';
  if (score >= 70) return '#4DFFA3';
  if (score >= 40) return '#FFD75F';
  return '#FF5D5D';
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'No data';
  if (score <= 20) return 'Critical';
  if (score <= 40) return 'At Risk';
  if (score <= 60) return 'Neutral';
  if (score <= 80) return 'Healthy';
  return 'Strong';
}

function ScoreBadge({ score }: { score: number | null }) {
  const color = scoreColor(score);
  if (score === null) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
        --
      </span>
    );
  }
  return (
    <span
      className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border"
      style={{ color, backgroundColor: `${color}15`, borderColor: `${color}30` }}
    >
      {score}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex-1 h-1.5 rounded-full bg-gray-800 light:bg-gray-100 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function TrendIcon({ score }: { score: number | null }) {
  if (score === null) return <Minus className="w-3 h-3 text-gray-500" />;
  if (score >= 70) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (score >= 40) return <Minus className="w-3 h-3 text-amber-400" />;
  return <TrendingDown className="w-3 h-3 text-red-400" />;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SummaryRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          className="light:stroke-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black tabular-nums text-white light:text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">
          Avg Health
        </span>
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function OpportunityHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/deals/health');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Don't render if no deals
  if (!loading && (!data || data.totalDeals === 0)) {
    return null;
  }

  const deals = data?.deals || [];
  const avgScore = data?.avgScore ?? null;
  const byLabel = data?.byLabel ?? { critical: 0, at_risk: 0, neutral: 0, healthy: 0, strong: 0 };

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden mb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left p-5 pb-3"
      >
        <div className="w-8 h-8 rounded-xl bg-[#7A5CFF]/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-[#7A5CFF]" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white light:text-gray-900">Opportunity Health</h2>
          <p className="text-[11px] text-gray-500 light:text-gray-400">
            Deal health scores across your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {byLabel.critical + byLabel.at_risk > 0 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
              {byLabel.critical + byLabel.at_risk} at risk
            </span>
          )}
          {byLabel.healthy + byLabel.strong > 0 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
              {byLabel.healthy + byLabel.strong} healthy
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-800/50 light:bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Summary panel */}
              <div className="flex flex-col items-center justify-center py-2">
                {avgScore !== null ? (
                  <SummaryRing score={avgScore} />
                ) : (
                  <div className="w-[100px] h-[100px] rounded-full border-4 border-gray-700/50 light:border-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">No data</span>
                  </div>
                )}
                <div className="flex gap-3 mt-3 text-[10px]">
                  {[
                    { label: 'Strong', count: byLabel.strong, color: '#4DFFA3' },
                    { label: 'Healthy', count: byLabel.healthy, color: '#7AE8A0' },
                    { label: 'Neutral', count: byLabel.neutral, color: '#FFD75F' },
                    { label: 'At Risk', count: byLabel.at_risk + byLabel.critical, color: '#FF5D5D' },
                  ].filter((b) => b.count > 0).map((b) => (
                    <span key={b.label} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-gray-400">{b.count} {b.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Deal list */}
              <motion.div
                className="lg:col-span-3 space-y-1.5"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {deals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    variants={item}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] light:hover:bg-gray-50 transition-colors"
                  >
                    {/* Score badge */}
                    <div className="w-12 flex justify-center shrink-0">
                      <ScoreBadge score={deal.healthScore} />
                    </div>

                    {/* Company + details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-sm font-medium text-white light:text-gray-900 truncate">
                          {deal.companyName}
                        </span>
                        <TrendIcon score={deal.healthScore} />
                        {deal.dealStage && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 light:bg-gray-100 text-gray-400 light:text-gray-500 capitalize">
                            {deal.dealStage.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {deal.meetingCount} meeting{deal.meetingCount !== 1 ? 's' : ''}
                        </span>
                        {deal.stakeholderCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {deal.stakeholderCount}
                          </span>
                        )}
                        {deal.riskCount > 0 && (
                          <span className="flex items-center gap-1 text-red-400/70">
                            <AlertTriangle className="w-3 h-3" />
                            {deal.riskCount} risk{deal.riskCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {deal.nextStepCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400/70">
                            <CheckCircle2 className="w-3 h-3" />
                            {deal.nextStepCount} next step{deal.nextStepCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-gray-600">
                          {relativeTime(deal.lastMeetingAt)}
                        </span>
                      </div>
                    </div>

                    {/* Health bar */}
                    <div className="w-20 shrink-0 hidden sm:flex items-center gap-2">
                      {deal.healthScore !== null ? (
                        <ScoreBar score={deal.healthScore} />
                      ) : (
                        <div className="flex-1 h-1.5 rounded-full bg-gray-800/50 light:bg-gray-100" />
                      )}
                    </div>
                  </motion.div>
                ))}

                {deals.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No deals tracked yet</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Health scores appear after your first meeting is processed
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
