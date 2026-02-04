'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Calendar, Mail, Send, Clock, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  totalMeetings: number;
  emailsGenerated: number;
  emailsSent: number;
  timeSavedMinutes: number;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({ value, duration = 1.5, suffix = '' }: AnimatedCounterProps) {
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
  delay: number;
}

function StatCard({ icon, label, value, suffix = '', gradient, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500`} />
      <div className="relative bg-gray-900/50 border border-gray-700 hover:border-gray-600 rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-gray-400">{label}</span>
        </div>
        <div className="text-4xl font-bold text-white">
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAnalytics();
    }
  }, []);

  // Format time saved for display
  const formatTimeSaved = (minutes: number): { value: number; suffix: string } => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return { value: hours, suffix: 'h' };
    }
    return { value: minutes, suffix: 'm' };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-700" />
              <div className="h-4 w-20 bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-16 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const timeSaved = formatTimeSaved(analytics.timeSavedMinutes);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold text-white">Your Analytics</h2>
        <button
          onClick={fetchAnalytics}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-white" />}
          label="Meetings"
          value={analytics.totalMeetings}
          gradient="from-blue-500/20 to-blue-600/20"
          delay={0}
        />
        <StatCard
          icon={<Mail className="w-5 h-5 text-white" />}
          label="Emails Generated"
          value={analytics.emailsGenerated}
          gradient="from-purple-500/20 to-purple-600/20"
          delay={0.1}
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-white" />}
          label="Emails Sent"
          value={analytics.emailsSent}
          gradient="from-emerald-500/20 to-emerald-600/20"
          delay={0.2}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Time Saved"
          value={timeSaved.value}
          suffix={timeSaved.suffix}
          gradient="from-amber-500/20 to-amber-600/20"
          delay={0.3}
        />
      </div>

      {analytics.totalMeetings === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-gray-400">
            No meetings yet. Connect a platform and host a meeting to see your analytics!
          </p>
        </motion.div>
      )}
    </div>
  );
}
