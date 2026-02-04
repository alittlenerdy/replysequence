'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Send, Clock, RefreshCw, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/analytics/StatCard';
import { ActivityChart } from '@/components/analytics/ActivityChart';
import { PlatformChart } from '@/components/analytics/PlatformChart';
import { EmailFunnel } from '@/components/analytics/EmailFunnel';

interface DailyDataPoint {
  date: string;
  count: number;
}

interface PlatformStat {
  platform: string;
  count: number;
  color: string;
}

interface EmailFunnelData {
  total: number;
  ready: number;
  sent: number;
  conversionRate: number;
}

interface AnalyticsData {
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
  dailyMeetings: DailyDataPoint[];
  dailyEmails: DailyDataPoint[];
  platformBreakdown: PlatformStat[];
  emailFunnel: EmailFunnelData;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const fetchAnalytics = useCallback(async (showRefreshState = false) => {
    try {
      if (showRefreshState) setIsRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('[ANALYTICS] Fetch error:', err);
      setError('Unable to load analytics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Format time saved for display
  const formatTimeSaved = (minutes: number): { value: number; suffix: string; label: string } => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return { value: hours, suffix: 'h', label: `${minutes} minutes saved` };
    }
    return { value: minutes, suffix: 'm', label: 'Time saved writing emails' };
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-700 light:bg-gray-200 mb-3" />
              <div className="h-8 w-16 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          ))}
        </div>
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

  const timeSaved = formatTimeSaved(analytics.timeSavedMinutes);
  const hasData = analytics.totalMeetings > 0 || analytics.emailsGenerated > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-white light:text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-400 light:text-gray-500 mt-1">Track your meeting follow-up performance</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={isRefreshing}
          className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Meetings"
          value={analytics.totalMeetings}
          gradient="from-blue-500/20 to-blue-600/20"
          accentColor="#3B82F6"
          delay={0}
        />
        <StatCard
          icon={<Mail className="w-5 h-5" />}
          label="Emails Generated"
          value={analytics.emailsGenerated}
          gradient="from-purple-500/20 to-purple-600/20"
          accentColor="#A855F7"
          delay={0.05}
        />
        <StatCard
          icon={<Send className="w-5 h-5" />}
          label="Emails Sent"
          value={analytics.emailsSent}
          gradient="from-emerald-500/20 to-emerald-600/20"
          accentColor="#10B981"
          delay={0.1}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Time Saved"
          value={timeSaved.value}
          suffix={timeSaved.suffix}
          subtitle={timeSaved.label}
          gradient="from-amber-500/20 to-amber-600/20"
          accentColor="#F59E0B"
          delay={0.15}
        />
      </div>

      {hasData ? (
        <>
          {/* Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityChart
              data={analytics.dailyMeetings}
              title="Meetings"
              color="#3B82F6"
              gradientId="meetingsGradient"
            />
            <ActivityChart
              data={analytics.dailyEmails}
              title="Emails Generated"
              color="#A855F7"
              gradientId="emailsGradient"
            />
          </div>

          {/* Platform & Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformChart data={analytics.platformBreakdown} />
            <EmailFunnel
              total={analytics.emailFunnel.total}
              ready={analytics.emailFunnel.ready}
              sent={analytics.emailFunnel.sent}
              conversionRate={analytics.emailFunnel.conversionRate}
            />
          </div>
        </>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white light:text-gray-900 mb-2">
            No Activity Yet
          </h3>
          <p className="text-gray-400 light:text-gray-500 max-w-md mx-auto mb-6">
            Connect a meeting platform and host your first meeting to see your analytics dashboard come to life with charts and insights.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Zoom
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Teams
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Meet
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
