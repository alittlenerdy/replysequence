'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Rocket,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { ChecklistResponse, ChecklistItem } from '@/app/api/onboarding/checklist/route';

interface OnboardingChecklistProps {
  onComplete?: () => void;
}

// Checklist item component
function ChecklistItemRow({
  item,
  index,
}: {
  item: ChecklistItem;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
        item.completed
          ? 'bg-indigo-500/10 light:bg-indigo-50'
          : 'bg-gray-800/50 light:bg-gray-100 hover:bg-gray-800/70 light:hover:bg-gray-200'
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0 mt-0.5">
        {item.completed ? (
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
        ) : (
          <Circle className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-medium ${
            item.completed
              ? 'text-indigo-400 line-through'
              : 'text-white light:text-gray-900'
          }`}
        >
          {item.label}
        </h4>
        <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">
          {item.description}
        </p>
      </div>

      {/* Optional badge */}
      {item.optional && !item.completed && (
        <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-700/50 text-gray-400 light:bg-gray-200 light:text-gray-500">
          Optional
        </span>
      )}

      {/* Action button */}
      {!item.completed && item.actionUrl && (
        <Link
          href={item.actionUrl}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
            item.optional
              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 light:bg-gray-200 light:text-gray-600 light:hover:bg-gray-300'
              : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
          }`}
        >
          {item.actionLabel || 'Go'}
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}

      {/* Waiting indicator for items that need prior steps */}
      {!item.completed && !item.actionUrl && (
        <span className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700/50 text-gray-400">
          {item.actionLabel || 'Pending'}
        </span>
      )}
    </motion.div>
  );
}

// Animated particle for celebration
function CelebrationParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-20, -60, -100, -140],
        scale: [0, 1, 1, 0.5],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        delay,
        ease: 'easeOut',
      }}
      className="absolute"
    >
      <Star className="w-4 h-4 text-indigo-400" fill="currentColor" />
    </motion.div>
  );
}

// Celebration component
function CelebrationOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // Auto-close after animation
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Generate particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.1,
    x: (i % 6) * 40 - 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex items-center justify-center bg-gray-900/95 light:bg-white/95 backdrop-blur-sm rounded-2xl z-10 overflow-hidden"
    >
      {/* Particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((p) => (
          <CelebrationParticle key={p.id} delay={p.delay} x={p.x} />
        ))}
      </div>

      <div className="text-center p-6 relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-white light:text-gray-900 mb-2"
        >
          You're All Set!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 light:text-gray-500 text-sm"
        >
          ReplySequence is ready to create follow-up emails from your meetings.
        </motion.p>
      </div>
    </motion.div>
  );
}

export function OnboardingChecklist({ onComplete }: OnboardingChecklistProps) {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasFetched = useRef(false);
  const prevPercentRef = useRef<number>(0);

  const fetchChecklist = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/checklist');
      if (response.ok) {
        const result: ChecklistResponse = await response.json();
        setData(result);

        // Check if we just completed (went from <100% to 100%)
        if (result.isComplete && prevPercentRef.current < 100) {
          setShowCelebration(true);
          onComplete?.();
        }
        prevPercentRef.current = result.percentComplete;
      }
    } catch (error) {
      console.error('[ONBOARDING-CHECKLIST] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchChecklist();
    }
  }, [fetchChecklist]);

  // Poll for updates every 30 seconds (to catch platform connections, drafts, etc.)
  useEffect(() => {
    if (data?.isComplete) return;

    const interval = setInterval(fetchChecklist, 30000);
    return () => clearInterval(interval);
  }, [data?.isComplete, fetchChecklist]);

  // Handle dismissal for completed users
  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render if dismissed or loading with no data
  if (dismissed) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
          <div>
            <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-28 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-700 light:bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Hide if fully complete - no need for celebration overlay
  if (data.isComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="relative bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">

        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <CelebrationOverlay onClose={() => setShowCelebration(false)} />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-gray-900">
                Getting Started
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-500">
                {data.completedCount}/{data.totalCount} complete
              </p>
            </div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {collapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-2 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.percentComplete}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-indigo-600 rounded-full"
            />
          </div>
          <span className="absolute right-0 -top-1 text-xs font-medium text-gray-400">
            {data.percentComplete}%
          </span>
        </div>

        {/* Checklist items */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
              {data.items.map((item, index) => (
                <ChecklistItemRow key={item.id} item={item} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        {!collapsed && !data.isComplete && (
          <p className="relative text-xs text-gray-500 text-center mt-4 pt-4 border-t border-gray-700/50 light:border-gray-200">
            Complete all steps to unlock the full ReplySequence experience
          </p>
        )}
      </div>
    </motion.div>
  );
}
