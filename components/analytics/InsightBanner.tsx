'use client';

import { TrendingUp, AlertTriangle, Sparkles, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightBannerProps {
  totalMeetings: number;
  emailsSent: number;
  atRiskCount: number;
}

export function InsightBanner({ totalMeetings, emailsSent, atRiskCount }: InsightBannerProps) {
  // New account — no meetings yet
  if (totalMeetings === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 light:bg-indigo-50 light:border-indigo-200">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300 light:text-gray-700 leading-relaxed">
              Connect a meeting platform and your analytics will populate automatically after your first meeting.
            </p>
            <a
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300 light:hover:text-indigo-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Connect a platform
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  const coveragePercent = Math.round((emailsSent / totalMeetings) * 100);

  // Healthy — 90%+ coverage
  if (coveragePercent >= 90) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 light:bg-indigo-50 light:border-indigo-200">
          <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 light:text-gray-700 leading-relaxed">
            You followed up on{' '}
            <strong className="text-white light:text-gray-900">{emailsSent}</strong> of{' '}
            <strong className="text-white light:text-gray-900">{totalMeetings}</strong> meetings &mdash;{' '}
            <strong className="text-indigo-400 light:text-indigo-600">{coveragePercent}% coverage</strong>.
            Keep it up.
          </p>
        </div>
      </motion.div>
    );
  }

  // Slipping — below 90%
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-amber-500/20 bg-amber-500/5 light:bg-amber-50 light:border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-300 light:text-gray-700 leading-relaxed">
            <strong className="text-amber-400 light:text-amber-600">{atRiskCount} meeting{atRiskCount !== 1 ? 's' : ''}</strong>{' '}
            still need{atRiskCount === 1 ? 's' : ''} a follow-up.
            Your coverage is{' '}
            <strong className="text-white light:text-gray-900">{coveragePercent}%</strong> &mdash; aim for 90%+.
          </p>
          <a
            href="#at-risk-meetings"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-400 light:text-amber-600 hover:text-amber-300 light:hover:text-amber-700 transition-colors"
          >
            View at-risk meetings
          </a>
        </div>
      </div>
    </motion.div>
  );
}
