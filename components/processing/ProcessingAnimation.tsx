'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Video } from 'lucide-react';
import { ProcessingSteps } from './ProcessingSteps';
import { ProcessingLogs } from './ProcessingLogs';
import { ProcessingStatus } from '@/hooks/useProcessingStatus';

interface ProcessingAnimationProps {
  status: ProcessingStatus;
  onComplete?: () => void;
  showLogs?: boolean;
  className?: string;
}

export function ProcessingAnimation({
  status,
  onComplete,
  showLogs = true,
  className = '',
}: ProcessingAnimationProps) {
  // Smooth progress animation using spring physics
  const springProgress = useSpring(status.processingProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const progressWidth = useTransform(springProgress, (value) => `${value}%`);

  const isComplete = status.processingStep === 'completed' || status.status === 'ready';
  const isFailed = status.processingStep === 'failed' || status.status === 'failed';
  const isProcessing = !isComplete && !isFailed;

  // Calculate elapsed time
  const elapsedTime = status.processingStartedAt
    ? Math.floor((Date.now() - new Date(status.processingStartedAt).getTime()) / 1000)
    : 0;

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-gray-900/80 to-gray-950/80
        border border-gray-800/50
        backdrop-blur-sm
        ${className}
      `}
    >
      {/* Animated background gradient */}
      {isProcessing && (
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(600px circle at 0% 0%, rgba(147, 51, 234, 0.15), transparent 50%)',
              'radial-gradient(600px circle at 100% 100%, rgba(147, 51, 234, 0.15), transparent 50%)',
              'radial-gradient(600px circle at 0% 0%, rgba(147, 51, 234, 0.15), transparent 50%)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2 rounded-lg
                ${isComplete ? 'bg-green-500/20' : isFailed ? 'bg-red-500/20' : 'bg-purple-500/20'}
              `}
            >
              {isComplete ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : isFailed ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Video className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {isComplete
                  ? 'Processing Complete'
                  : isFailed
                  ? 'Processing Failed'
                  : 'Processing Meeting'}
              </h3>
              <p className="text-sm text-gray-400 truncate max-w-[200px]">
                {status.topic || 'Meeting'}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isProcessing && (
              <>
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-gray-400">{formatElapsed(elapsedTime)}</span>
              </>
            )}
            {isComplete && (
              <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-500/10 rounded-full">
                Ready
              </span>
            )}
            {isFailed && (
              <span className="px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 rounded-full">
                Failed
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-mono text-gray-300">
              {status.processingProgress}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`
                h-full rounded-full
                ${
                  isComplete
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : isFailed
                    ? 'bg-gradient-to-r from-red-500 to-rose-400'
                    : 'bg-gradient-to-r from-purple-600 to-purple-400'
                }
              `}
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {/* Step Indicator */}
        <ProcessingSteps currentStep={status.processingStep} className="mb-6" />

        {/* Live Logs */}
        {showLogs && status.processingLogs && status.processingLogs.length > 0 && (
          <ProcessingLogs logs={status.processingLogs} maxHeight="160px" />
        )}

        {/* Error Message */}
        {isFailed && status.processingError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{status.processingError}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
