'use client';

import { motion } from 'framer-motion';
import { Mail, CheckCircle, Send, ArrowRight } from 'lucide-react';

interface EmailFunnelProps {
  total: number;
  ready: number;
  sent: number;
  conversionRate: number;
}

interface FunnelStageProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage: number;
  color: string;
  gradient: string;
  delay: number;
}

function FunnelStage({ icon, label, value, percentage, color, gradient, delay }: FunnelStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex-1"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-2xl font-bold text-white light:text-gray-900">{value}</p>
          <p className="text-xs text-gray-400 light:text-gray-500">{label}</p>
        </div>
      </div>
      <div className="h-2 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        />
      </div>
    </motion.div>
  );
}

export function EmailFunnel({ total, ready, sent, conversionRate }: EmailFunnelProps) {
  const hasData = total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-400 light:text-gray-500">Email Funnel</h3>
          <p className="text-xs text-gray-500 light:text-gray-400 mt-1">Track your email journey</p>
        </div>
        {hasData && (
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">{conversionRate.toFixed(0)}%</p>
            <p className="text-xs text-gray-400">conversion</p>
          </div>
        )}
      </div>

      {hasData ? (
        <>
          {/* Funnel Stages */}
          <div className="flex items-start gap-2">
            <FunnelStage
              icon={<Mail className="w-5 h-5" />}
              label="Generated"
              value={total}
              percentage={100}
              color="#3B82F6"
              gradient="from-blue-500 to-blue-600"
              delay={0}
            />

            <div className="flex items-center justify-center pt-4">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </div>

            <FunnelStage
              icon={<CheckCircle className="w-5 h-5" />}
              label="Ready"
              value={ready}
              percentage={total > 0 ? (ready / total) * 100 : 0}
              color="#F59E0B"
              gradient="from-amber-500 to-orange-500"
              delay={0.1}
            />

            <div className="flex items-center justify-center pt-4">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </div>

            <FunnelStage
              icon={<Send className="w-5 h-5" />}
              label="Sent"
              value={sent}
              percentage={total > 0 ? (sent / total) * 100 : 0}
              color="#10B981"
              gradient="from-emerald-500 to-green-500"
              delay={0.2}
            />
          </div>

          {/* Flow visualization */}
          <div className="mt-6 pt-4 border-t border-gray-800 light:border-gray-200">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Draft generated</span>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 via-amber-500/50 to-emerald-500/50" />
              <span>Reviewed & sent</span>
            </div>
          </div>
        </>
      ) : (
        <div className="h-[100px] flex items-center justify-center">
          <div className="text-center">
            <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No emails generated yet</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
