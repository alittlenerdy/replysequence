'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingAnimation } from './ProcessingAnimation';
import { useProcessingStatus } from '@/hooks/useProcessingStatus';

interface ProcessingMeetingCardProps {
  meetingId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
  showLogs?: boolean;
}

/**
 * Self-contained card that shows processing progress for a meeting.
 * Automatically polls for updates and animates between states.
 */
export function ProcessingMeetingCard({
  meetingId,
  onComplete,
  onDismiss,
  showLogs = true,
}: ProcessingMeetingCardProps) {
  const { data, isLoading, isProcessing, isComplete, isFailed } = useProcessingStatus(meetingId);

  // Call onComplete callback when processing finishes
  useEffect(() => {
    if (isComplete && onComplete) {
      // Small delay to let the animation finish
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-gray-900/50 rounded-xl p-6 border border-gray-800/50">
        <div className="h-6 w-48 bg-gray-800 rounded mb-4" />
        <div className="h-2 w-full bg-gray-800 rounded mb-6" />
        <div className="flex gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full" />
              <div className="h-3 w-12 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={meetingId}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <ProcessingAnimation status={data} onComplete={onComplete} showLogs={showLogs} />
      </motion.div>
    </AnimatePresence>
  );
}
