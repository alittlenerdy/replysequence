'use client';

import { motion } from 'framer-motion';
import { Mail, Eye, MousePointerClick, MessageSquare, Clock, TrendingUp, ArrowRight } from 'lucide-react';

interface EmailEngagement {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  avgTimeToOpen: number | null;
}

interface EmailEngagementProps {
  engagement: EmailEngagement;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  rate: number;
  rateLabel: string;
  color: string;
  bgColor: string;
  delay: number;
}

function MetricCard({ icon, label, value, rate, rateLabel, color, bgColor, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative p-4 rounded-xl border ${bgColor} overflow-hidden`}
    >
      {/* Background glow */}
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-sm text-gray-400 light:text-gray-500">{label}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-black" style={{ color }}>{value}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white light:text-gray-900">{rate}%</div>
            <div className="text-xs text-gray-500">{rateLabel}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function EmailEngagement({ engagement }: EmailEngagementProps) {
  const hasData = engagement.sent > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white light:text-gray-900">Email Engagement</h3>
          <p className="text-sm text-gray-400 light:text-gray-500">Track opens, clicks, and replies</p>
        </div>
        {hasData && engagement.avgTimeToOpen && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">
              {engagement.avgTimeToOpen < 1
                ? `${Math.round(engagement.avgTimeToOpen * 60)}m avg open time`
                : `${engagement.avgTimeToOpen}h avg open time`
              }
            </span>
          </div>
        )}
      </div>

      {hasData ? (
        <>
          {/* Funnel visualization */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-blue-400">{engagement.sent}</div>
              <div className="text-xs text-gray-500 mt-1">Sent</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-purple-400">{engagement.opened}</div>
              <div className="text-xs text-gray-500 mt-1">Opened</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-amber-400">{engagement.clicked}</div>
              <div className="text-xs text-gray-500 mt-1">Clicked</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="text-center flex-1">
              <div className="text-3xl font-black text-emerald-400">{engagement.replied}</div>
              <div className="text-xs text-gray-500 mt-1">Replied</div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-3 mb-6">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Open Rate</span>
                <span className="text-purple-400 font-semibold">{engagement.openRate}%</span>
              </div>
              <div className="h-2 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${engagement.openRate}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Click Rate (of opened)</span>
                <span className="text-amber-400 font-semibold">{engagement.clickRate}%</span>
              </div>
              <div className="h-2 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${engagement.clickRate}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Reply Rate</span>
                <span className="text-emerald-400 font-semibold">{engagement.replyRate}%</span>
              </div>
              <div className="h-2 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${engagement.replyRate}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Benchmark comparison */}
          <div className="pt-4 border-t border-gray-800 light:border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>
                Industry avg: 21% open rate, 2.5% click rate, 1% reply rate
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-800 light:bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">Send your first email to see engagement metrics</p>
        </div>
      )}
    </motion.div>
  );
}
