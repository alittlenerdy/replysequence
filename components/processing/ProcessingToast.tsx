'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { useProcessingMeetings } from '@/hooks/useProcessingMeetings';
import Link from 'next/link';

interface ProcessingToastProps {
  /** Hide when on dashboard (since it shows processing cards there) */
  hideOnDashboard?: boolean;
}

/**
 * Floating toast that shows when meetings are being processed.
 * Minimizes to a small indicator, expands to show progress.
 */
export function ProcessingToast({ hideOnDashboard = true }: ProcessingToastProps) {
  const pathname = usePathname();
  const { meetings } = useProcessingMeetings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);
  const prevMeetingIdsRef = useRef<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track completed meetings (use ref to avoid infinite re-render loop)
  useEffect(() => {
    const currentIds = meetings.map(m => m.id);
    const completed = prevMeetingIdsRef.current.filter(id => !currentIds.includes(id));

    if (completed.length > 0) {
      setRecentlyCompleted(prev => [...prev, ...completed]);
      // Clear completed notifications after 5 seconds
      setTimeout(() => {
        setRecentlyCompleted(prev => prev.filter(id => !completed.includes(id)));
      }, 5000);
    }

    prevMeetingIdsRef.current = currentIds;
  }, [meetings]);

  // Don't render until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // Don't show if no processing meetings and no recently completed
  if (meetings.length === 0 && recentlyCompleted.length === 0) {
    return null;
  }

  // Check if on dashboard (hide there since we show full cards)
  if (hideOnDashboard && pathname === '/dashboard') {
    return null;
  }

  const processingCount = meetings.length;
  const completedCount = recentlyCompleted.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header - always visible */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {processingCount > 0 ? (
                <>
                  <div className="relative">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    {processingCount > 1 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {processingCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {processingCount === 1
                      ? 'Processing meeting...'
                      : `Processing ${processingCount} meetings...`}
                  </span>
                </>
              ) : completedCount > 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">
                    {completedCount === 1
                      ? 'Meeting ready!'
                      : `${completedCount} meetings ready!`}
                  </span>
                </>
              ) : null}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-700"
              >
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {/* Processing meetings */}
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                    >
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {meeting.topic || 'Meeting'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {meeting.processingProgress}% complete
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Recently completed */}
                  {recentlyCompleted.length > 0 && (
                    <div className="flex items-center gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <p className="text-sm text-green-400">
                        {recentlyCompleted.length} draft{recentlyCompleted.length > 1 ? 's' : ''} ready
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="px-3 pb-3">
                  <Link
                    href="/dashboard"
                    className="block w-full text-center py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-colors"
                  >
                    View Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
