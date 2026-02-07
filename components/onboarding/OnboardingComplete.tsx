'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Check, ArrowRight, Sparkles, Calendar, Mail, Clock } from 'lucide-react';

type ConnectedPlatform = 'zoom' | 'teams' | 'meet' | null;

interface OnboardingCompleteProps {
  platformConnected: ConnectedPlatform;
  calendarConnected: boolean;
  onGoToDashboard: () => void;
}

export function OnboardingComplete({
  platformConnected,
  calendarConnected,
  onGoToDashboard,
}: OnboardingCompleteProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    // Auto-redirect after 10 seconds
    const redirectTimer = setTimeout(() => onGoToDashboard(), 10000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [onGoToDashboard]);

  const platformNames: Record<string, string> = {
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
    meet: 'Google Meet',
  };

  // Meet OAuth includes calendar.readonly scope, so calendar is connected when Meet is connected
  const hasCalendarAccess = calendarConnected || platformConnected === 'meet';

  const completionStats = [
    {
      icon: Check,
      label: platformConnected ? `${platformNames[platformConnected]} connected` : 'Platform pending',
      completed: !!platformConnected,
    },
    {
      icon: Calendar,
      label: hasCalendarAccess ? 'Calendar synced' : 'Calendar pending',
      completed: hasCalendarAccess,
    },
    {
      icon: Sparkles,
      label: 'First draft generated',
      completed: true,
    },
    {
      icon: Clock,
      label: 'Time saved so far: 0 hours',
      completed: true,
      note: "We'll track this",
    },
  ];

  return (
    <div className="py-8 text-center relative">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          colors={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']}
        />
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
      >
        <Check className="w-12 h-12 text-white" strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold mb-4"
      >
        <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          You&apos;re all set!
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-gray-400 max-w-lg mx-auto mb-10"
      >
        Your next meeting will automatically generate a follow-up draft. Time to reclaim your hours!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-md mx-auto mb-10"
      >
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Setup Summary
          </h3>
          <div className="space-y-3">
            {completionStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stat.completed ? 'bg-emerald-500/20' : 'bg-gray-800'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        stat.completed ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <span
                    className={stat.completed ? 'text-white' : 'text-gray-500'}
                  >
                    {stat.label}
                  </span>
                  {stat.note && (
                    <span className="text-xs text-gray-600">({stat.note})</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-4"
      >
        <button
          onClick={onGoToDashboard}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          <Mail className="w-5 h-5" />
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-500">Redirecting in a few seconds...</p>
      </motion.div>
    </div>
  );
}
