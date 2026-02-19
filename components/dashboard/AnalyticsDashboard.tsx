'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Calendar, Mail, Clock, RefreshCw, BarChart3, DollarSign, Zap, Timer, ChevronDown, ChevronUp, Target, Shield } from 'lucide-react';
import { StatCard } from '@/components/analytics/StatCard';
import { EmailFunnel } from '@/components/analytics/EmailFunnel';
import { ROICalculator } from '@/components/analytics/ROICalculator';
import { EmailEngagement } from '@/components/analytics/EmailEngagement';
import { InsightBanner } from '@/components/analytics/InsightBanner';
import { AtRiskMeetings } from '@/components/analytics/AtRiskMeetings';
import type { AnalyticsData } from '@/lib/types/analytics';

// Chart loading placeholder
const ChartSkeleton = () => (
  <div className="h-48 bg-gray-800/50 light:bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
    <BarChart3 className="w-8 h-8 text-gray-600 light:text-gray-400" />
  </div>
);

// Dynamic imports for heavy chart components (uses recharts)
const ActivityChart = dynamic(
  () => import('@/components/analytics/ActivityChart').then(mod => mod.ActivityChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const CoverageChart = dynamic(
  () => import('@/components/analytics/CoverageChart').then(mod => mod.CoverageChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DualSeriesChart = dynamic(
  () => import('@/components/analytics/DualSeriesChart').then(mod => mod.DualSeriesChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PlatformChart = dynamic(
  () => import('@/components/analytics/PlatformChart').then(mod => mod.PlatformChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const MeetingTypeChart = dynamic(
  () => import('@/components/analytics/MeetingTypeChart').then(mod => mod.MeetingTypeChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DATE_RANGES = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
] as const;

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rs-analytics-date-range');
      return saved ? parseInt(saved, 10) : 14;
    }
    return 14;
  });
  const [showMoreInsights, setShowMoreInsights] = useState(false);
  const hasFetched = useRef(false);

  const fetchAnalytics = useCallback(async (showRefreshState = false) => {
    try {
      if (showRefreshState) setIsRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/analytics?days=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[ANALYTICS] Fetch error:', err);
      setError('Unable to load analytics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  // Re-fetch when date range changes (after initial load)
  useEffect(() => {
    if (hasFetched.current) {
      fetchAnalytics(true);
    }
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist date range to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rs-analytics-date-range', String(dateRange));
    }
  }, [dateRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Loading skeleton — matches new layout
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700 light:bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-700 light:bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Banner skeleton */}
        <div className="h-16 bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl animate-pulse" />
        {/* KPI row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-700 light:bg-gray-200 mb-3" />
              <div className="h-10 w-20 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* At-risk skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 h-[160px] animate-pulse" />
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 h-[220px] animate-pulse">
              <div className="h-4 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
              <div className="h-[140px] bg-gray-800 light:bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-2">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const hasData = analytics.totalMeetings > 0 || analytics.emailsGenerated > 0;
  const coveragePercent = analytics.totalMeetings > 0 ? Math.round((analytics.emailsSent / analytics.totalMeetings) * 100) : 0;
  const timeSavedHours = Math.round((analytics.timeSavedMinutes / 60) * 10) / 10;
  const dollarsSaved = analytics.roi.dollarValue;

  // Compute daily follow-up data from dailyEmails (emails with sentAt on that date)
  // For dual series chart, we need sent emails per day — approximate from dailyEmails for now
  const dailySentApprox = analytics.dailyCoverage.map(d => ({
    date: d.date,
    count: d.followedUpCount,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-gray-900">Analytics</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Date range pills */}
          <div className="flex items-center bg-gray-800/80 light:bg-gray-100 rounded-lg border border-gray-700 light:border-gray-200 p-0.5">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Insight Banner */}
      <InsightBanner
        totalMeetings={analytics.totalMeetings}
        emailsSent={analytics.emailsSent}
        atRiskCount={analytics.atRiskMeetings.length}
      />

      {/* 3. KPI Row — 4 new StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
        >
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="Follow-up Coverage"
            value={coveragePercent}
            suffix="%"
            subtitle={`${analytics.emailsSent} of ${analytics.totalMeetings} meetings`}
            gradient="from-indigo-500/20 to-indigo-600/20"
            accentColor="#6366F1"
            comparison={analytics.sentComparison}
            hero
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Median Follow-up Time"
            value={analytics.medianFollowUpTimeHours !== null ? analytics.medianFollowUpTimeHours : 0}
            suffix={analytics.medianFollowUpTimeHours !== null ? 'h' : ''}
            subtitle={analytics.medianFollowUpTimeHours === null ? 'No sent emails yet' : 'After meeting ends'}
            gradient="from-amber-500/20 to-amber-600/20"
            accentColor="#F59E0B"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Draft to Send Rate"
            value={analytics.emailsGenerated > 0 ? Math.round((analytics.emailsSent / analytics.emailsGenerated) * 100) : 0}
            suffix="%"
            subtitle={`${analytics.emailsSent} of ${analytics.emailsGenerated} sent`}
            gradient="from-indigo-500/20 to-indigo-600/20"
            accentColor="#3B82F6"
            comparison={analytics.emailsComparison}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Time & Value Saved"
            value={timeSavedHours}
            suffix="h"
            subtitle={`~$${Math.round(dollarsSaved).toLocaleString()} saved at $${analytics.hourlyRate}/hr`}
            gradient="from-amber-500/20 to-amber-600/20"
            accentColor="#F59E0B"
          />
        </motion.div>
      </div>

      {/* 4. At-Risk Meetings */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <AtRiskMeetings meetings={analytics.atRiskMeetings} />
        </motion.div>
      )}

      {/* 5. Trend Charts — Coverage + Dual series */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CoverageChart data={analytics.dailyCoverage} />
            <DualSeriesChart
              meetings={analytics.dailyMeetings}
              followUps={dailySentApprox}
            />
          </div>
        </motion.div>
      )}

      {/* 6. Collapsible "More Insights" */}
      {hasData && (
        <div>
          <button
            onClick={() => setShowMoreInsights(!showMoreInsights)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 light:text-gray-500 hover:text-gray-300 light:hover:text-gray-600 transition-colors border border-gray-700/50 light:border-gray-200 rounded-2xl"
          >
            <span>More Insights</span>
            {showMoreInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMoreInsights && (
            <div className="mt-4 space-y-4">
              {/* ROI + Email Engagement */}
              {analytics.emailsGenerated > 0 && (
                <div className={`grid grid-cols-1 ${analytics.emailsSent > 0 ? 'lg:grid-cols-2' : ''} gap-4`}>
                  <ROICalculator roi={analytics.roi} emailsGenerated={analytics.emailsGenerated} />
                  {analytics.emailsSent > 0 && (
                    <EmailEngagement engagement={analytics.engagement} />
                  )}
                </div>
              )}

              {/* Platform + Meeting Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlatformChart data={analytics.platformBreakdown} />
                {analytics.meetingTypeBreakdown.length > 0 ? (
                  <MeetingTypeChart data={analytics.meetingTypeBreakdown} />
                ) : (
                  <EmailFunnel
                    total={analytics.emailFunnel.total}
                    ready={analytics.emailFunnel.ready}
                    sent={analytics.emailFunnel.sent}
                    conversionRate={analytics.emailFunnel.conversionRate}
                  />
                )}
              </div>

              {/* Email Funnel (when meeting type chart takes its spot) */}
              {analytics.meetingTypeBreakdown.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <EmailFunnel
                    total={analytics.emailFunnel.total}
                    ready={analytics.emailFunnel.ready}
                    sent={analytics.emailFunnel.sent}
                    conversionRate={analytics.emailFunnel.conversionRate}
                  />
                </div>
              )}

              {/* AI Usage Stats */}
              {analytics.aiUsage && (analytics.aiUsage.totalCost > 0 || analytics.aiUsage.totalMeetingMinutes > 0) && (
                <div className="bg-gray-900/30 light:bg-gray-50 rounded-2xl p-5 border border-gray-700/50 light:border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-400 light:text-gray-500">Under the Hood</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Total AI Cost</span>
                      <p className="text-lg font-bold text-white light:text-gray-900">
                        ${analytics.aiUsage.totalCost.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Avg Generation Time</span>
                      <p className="text-lg font-bold text-white light:text-gray-900">
                        {analytics.aiUsage.avgLatency > 0
                          ? `${(analytics.aiUsage.avgLatency / 1000).toFixed(1)}s`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Meeting Hours</span>
                      <p className="text-lg font-bold text-white light:text-gray-900">
                        {analytics.aiUsage.totalMeetingMinutes > 0
                          ? `${(analytics.aiUsage.totalMeetingMinutes / 60).toFixed(1)}h`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ActivityChart
                  data={analytics.dailyMeetings}
                  title={`Meetings (Last ${dateRange} Days)`}
                  color="#3B82F6"
                  gradientId="meetingsGradient"
                />
                <ActivityChart
                  data={analytics.dailyEmails}
                  title={`Draft Volume (Last ${dateRange} Days)`}
                  color="#6366F1"
                  gradientId="emailsGradient"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="relative">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-lg"
              >
                <div className="flex items-end gap-1.5">
                  <motion.div
                    initial={{ height: 8 }}
                    animate={{ height: [8, 24, 16] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                    className="w-3 bg-white/90 rounded-sm"
                  />
                  <motion.div
                    initial={{ height: 16 }}
                    animate={{ height: [16, 32, 24] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.2 }}
                    className="w-3 bg-white/90 rounded-sm"
                  />
                  <motion.div
                    initial={{ height: 12 }}
                    animate={{ height: [12, 28, 20] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.4 }}
                    className="w-3 bg-white/90 rounded-sm"
                  />
                  <motion.div
                    initial={{ height: 20 }}
                    animate={{ height: [20, 36, 28] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.6 }}
                    className="w-3 bg-white/90 rounded-sm"
                  />
                </div>
              </motion.div>
            </div>

            <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">
              Your Analytics Dashboard Awaits
            </h3>
            <p className="text-gray-400 light:text-gray-500 max-w-lg mx-auto mb-8">
              Once you connect a meeting platform and host your first meeting, you will see powerful insights here:
              coverage tracking, ROI calculations, engagement metrics, and activity trends.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <a
                href="/dashboard/settings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl hover:from-indigo-700 hover:to-indigo-900 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Connect a Platform
              </a>
            </div>

            <div className="pt-8 border-t border-gray-700 light:border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">What you will unlock</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, label: 'Coverage Tracking', color: 'text-indigo-400' },
                  { icon: <Mail className="w-5 h-5" />, label: 'Email Metrics', color: 'text-indigo-400' },
                  { icon: <Clock className="w-5 h-5" />, label: 'Response Times', color: 'text-amber-400' },
                  { icon: <DollarSign className="w-5 h-5" />, label: 'ROI Tracking', color: 'text-amber-400' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 bg-gray-800/50 light:bg-gray-50 rounded-xl border border-gray-700/50 light:border-gray-200"
                  >
                    <div className={`${item.color} mb-2`}>{item.icon}</div>
                    <p className="text-xs text-gray-400 light:text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
