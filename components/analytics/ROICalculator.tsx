'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { DollarSign, Clock, Zap, TrendingUp } from 'lucide-react';

interface ROIMetrics {
  hoursSaved: number;
  dollarValue: number;
  hourlyRate: number;
  emailsPerHour: number;
}

interface ROICalculatorProps {
  roi: ROIMetrics;
  emailsGenerated: number;
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

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
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

export function ROICalculator({ roi, emailsGenerated }: ROICalculatorProps) {
  const hasData = emailsGenerated > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white light:text-gray-900">ROI Calculator</h3>
          <p className="text-sm text-gray-400 light:text-gray-500">Value delivered this month</p>
        </div>
      </div>

      {hasData ? (
        <div className="relative space-y-6">
          {/* Main dollar value - BIG and prominent */}
          <div className="text-center py-4">
            <div className="text-5xl md:text-6xl font-black text-emerald-400 mb-2">
              <AnimatedDollar value={roi.dollarValue} />
            </div>
            <p className="text-sm text-gray-400 light:text-gray-500">estimated time value saved</p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-500/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white light:text-gray-900">
                <AnimatedNumber value={roi.hoursSaved} decimals={1} />
                <span className="text-sm text-gray-400 ml-1">hrs</span>
              </div>
              <p className="text-xs text-gray-500">saved</p>
            </div>

            <div className="text-center border-x border-emerald-500/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white light:text-gray-900">
                <AnimatedNumber value={emailsGenerated} />
              </div>
              <p className="text-xs text-gray-500">emails</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white light:text-gray-900">
                ${roi.hourlyRate}
              </div>
              <p className="text-xs text-gray-500">/hour rate</p>
            </div>
          </div>

          {/* Calculation explanation */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Based on {Math.round(15)} min saved per AI-generated email @ ${roi.hourlyRate}/hr
          </div>
        </div>
      ) : (
        <div className="relative text-center py-6">
          {/* Animated placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl font-black text-gray-600/50"
            >
              $0
            </motion.div>
          </motion.div>

          <p className="text-gray-400 light:text-gray-500 font-medium mb-2">
            Start Tracking Your Savings
          </p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
            Generate your first email draft and watch your time savings add up here.
          </p>

          {/* Preview of what they'll see */}
          <div className="flex justify-center gap-6 pt-4 border-t border-emerald-500/10">
            <div className="text-center opacity-50">
              <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Hours saved</p>
            </div>
            <div className="text-center opacity-50">
              <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Emails</p>
            </div>
            <div className="text-center opacity-50">
              <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">ROI</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
