'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { TalkRatio } from '@/lib/db/schema';

interface CoachingInsight {
  id: string;
  meetingId: string;
  talkRatio: TalkRatio;
  questionCount: number;
  openQuestionCount: number;
  fillerWordCount: number;
  longestMonologue: number;
  nextStepSet: boolean;
  objectionHandled: boolean;
  overallScore: number;
  suggestions: string[];
  createdAt: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return '#4DFFA3';
  if (score >= 40) return '#FFD75F';
  return '#FF5D5D';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}

function CoachingRing({ score, size = 90 }: { score: number; size?: number }) {
  const radius = (size - 14) / 2;
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
          strokeWidth="5"
          className="light:stroke-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
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
          className="text-xl font-black tabular-nums text-white light:text-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[8px] uppercase tracking-wider text-gray-500 font-medium">
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function TalkRatioBar({ talkRatio }: { talkRatio: TalkRatio }) {
  const sellerPct = talkRatio.seller;
  const prospectPct = talkRatio.prospect;
  const isGoodRatio = sellerPct >= 35 && sellerPct <= 55;

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-gray-400">Talk Ratio</span>
        <span className={isGoodRatio ? 'text-emerald-400' : 'text-amber-400'}>
          {isGoodRatio ? 'Balanced' : sellerPct > 55 ? 'Seller-heavy' : 'Low engagement'}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-800 light:bg-gray-100">
        <motion.div
          className="bg-[#6366F1] rounded-l-full flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${sellerPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {sellerPct >= 20 && (
            <span className="text-[9px] font-bold text-white/90">{sellerPct}%</span>
          )}
        </motion.div>
        <motion.div
          className="bg-emerald-500/70 rounded-r-full flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${prospectPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          {prospectPct >= 20 && (
            <span className="text-[9px] font-bold text-white/90">{prospectPct}%</span>
          )}
        </motion.div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>You ({sellerPct}%)</span>
        <span>Prospect ({prospectPct}%)</span>
      </div>
    </div>
  );
}

function StatItem({ label, value, good }: { label: string; value: string | number; good?: boolean | null }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-400 light:text-gray-500">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${
        good === true ? 'text-emerald-400' :
        good === false ? 'text-red-400' :
        'text-white light:text-gray-900'
      }`}>
        {value}
      </span>
    </div>
  );
}

interface CallCoachingCardProps {
  meetingId: string;
  hasTranscript: boolean;
}

export function CallCoachingCard({ meetingId, hasTranscript }: CallCoachingCardProps) {
  const [insight, setInsight] = useState<CoachingInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/coaching`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.exists && data.insight) {
        setInsight(data.insight);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/coaching`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.insight) {
        setInsight(data.insight);
      } else {
        setError(data.error || 'Failed to generate coaching insights');
      }
    } catch {
      setError('Unable to connect. Check your internet and try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Don't render if no transcript to analyze
  if (!hasTranscript) return null;

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded" />
          <div className="h-20 bg-gray-800/50 light:bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // No insights yet — show generate button
  if (!insight) {
    return (
      <motion.div
        className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Call Coaching
        </h2>
        <p className="text-sm text-gray-400 light:text-gray-500 mb-4">
          Get AI-powered coaching feedback on your call performance — talk ratio, question quality, objection handling, and more.
        </p>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/15 text-xs text-red-400 mb-3">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#4F46E5]/25 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Analyzing call...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate Coaching Insights
            </>
          )}
        </button>
      </motion.div>
    );
  }

  // Show coaching insights
  const closedQuestions = insight.questionCount - insight.openQuestionCount;
  const monologueMinSec = `${Math.floor(insight.longestMonologue / 60)}:${String(insight.longestMonologue % 60).padStart(2, '0')}`;

  return (
    <motion.div
      className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Call Coaching
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Score ring + talk ratio */}
        <div className="flex flex-col items-center gap-4">
          <CoachingRing score={insight.overallScore} />
          <TalkRatioBar talkRatio={insight.talkRatio} />
        </div>

        {/* Middle: Quick stats */}
        <div className="space-y-0.5">
          <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
            Call Metrics
          </h3>
          <StatItem
            label="Questions asked"
            value={insight.questionCount}
          />
          <StatItem
            label="Open-ended questions"
            value={`${insight.openQuestionCount} of ${insight.questionCount}`}
            good={insight.openQuestionCount > closedQuestions ? true : insight.openQuestionCount === 0 ? false : null}
          />
          <StatItem
            label="Filler words"
            value={insight.fillerWordCount}
            good={insight.fillerWordCount < 10 ? true : insight.fillerWordCount > 20 ? false : null}
          />
          <StatItem
            label="Longest monologue"
            value={monologueMinSec}
            good={insight.longestMonologue < 90 ? true : false}
          />
          <StatItem
            label="Next step set"
            value={insight.nextStepSet ? 'Yes' : 'No'}
            good={insight.nextStepSet}
          />
          <StatItem
            label="Objection handled"
            value={insight.objectionHandled ? 'Yes' : 'N/A'}
            good={insight.objectionHandled ? true : null}
          />
        </div>

        {/* Right: Suggestions */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
            Coaching Tips
          </h3>
          <ul className="space-y-2">
            {insight.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300 light:text-gray-600">
                <span className="text-[#6366F1] mt-0.5 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
