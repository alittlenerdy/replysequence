'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { ProcessingStep } from '@/lib/db/schema';
import { PROCESSING_STAGES } from '@/lib/processing-progress';

interface ProcessingStepsProps {
  currentStep: ProcessingStep | null;
  className?: string;
}

// Steps to show in the UI (subset of all processing steps)
const VISIBLE_STEPS: { step: ProcessingStep; label: string }[] = [
  { step: 'transcript_download', label: 'Download' },
  { step: 'transcript_parse', label: 'Parse' },
  { step: 'draft_generation', label: 'Generate' },
  { step: 'completed', label: 'Done' },
];

// Map processing steps to their order for comparison
const STEP_ORDER: Record<ProcessingStep, number> = {
  webhook_received: 0,
  meeting_fetched: 1,
  meeting_created: 2,
  transcript_download: 3,
  transcript_parse: 4,
  transcript_stored: 5,
  draft_generation: 6,
  completed: 7,
  failed: -1,
};

export function ProcessingSteps({ currentStep, className = '' }: ProcessingStepsProps) {
  const currentOrder = currentStep ? STEP_ORDER[currentStep] : -1;
  const isFailed = currentStep === 'failed';

  return (
    <>
      {/* Desktop: Horizontal layout */}
      <div className={`hidden sm:flex items-center justify-between ${className}`}>
        {VISIBLE_STEPS.map((step, index) => {
          const stepOrder = STEP_ORDER[step.step];
          const isComplete = !isFailed && currentOrder >= stepOrder;
          const isCurrent = !isFailed && currentStep && stepOrder === currentOrder;
          const isPending = currentOrder < stepOrder || isFailed;

          return (
            <div key={step.step} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
              <motion.div
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full
                  transition-colors duration-300
                  ${
                    isComplete
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : isCurrent
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : isFailed && step.step === 'completed'
                      ? 'bg-red-500/20 border-2 border-red-500'
                      : 'bg-gray-800/50 light:bg-gray-100 border-2 border-gray-600 light:border-gray-300'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isCurrent ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                {isComplete && step.step !== currentStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                ) : isFailed && step.step === 'completed' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Circle className="w-3 h-3 text-gray-500" />
                )}

                {/* Pulse effect for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-purple-500/30"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                )}
              </motion.div>

              {/* Step Label */}
              <span
                className={`
                  mt-2 text-xs font-medium
                  ${
                    isComplete
                      ? 'text-green-400'
                      : isCurrent
                      ? 'text-purple-400'
                      : 'text-gray-500'
                  }
                `}
              >
                {isFailed && step.step === 'completed' ? 'Failed' : step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < VISIBLE_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-1rem]">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ scaleX: 0, transformOrigin: 'left' }}
                  animate={{
                    scaleX: isComplete ? 1 : 0,
                    backgroundColor: isComplete ? '#22c55e' : '#4b5563',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ backgroundColor: isComplete ? '#22c55e' : '#4b5563' }}
                />
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* Mobile: Compact vertical layout */}
      <div className={`sm:hidden ${className}`}>
        <div className="flex items-center justify-between gap-1">
          {VISIBLE_STEPS.map((step, index) => {
            const stepOrder = STEP_ORDER[step.step];
            const isComplete = !isFailed && currentOrder >= stepOrder;
            const isCurrent = !isFailed && currentStep && stepOrder === currentOrder;

            return (
              <div key={step.step} className="flex items-center flex-1">
                {/* Compact Step Indicator */}
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`
                      relative flex items-center justify-center w-6 h-6 rounded-full
                      transition-colors duration-300
                      ${
                        isComplete
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : isCurrent
                          ? 'bg-purple-500/20 border-2 border-purple-500'
                          : isFailed && step.step === 'completed'
                          ? 'bg-red-500/20 border-2 border-red-500'
                          : 'bg-gray-800/50 border-2 border-gray-600'
                      }
                    `}
                    animate={{
                      scale: isCurrent ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isCurrent ? Infinity : 0,
                    }}
                  >
                    {isComplete && step.step !== currentStep ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                    ) : isFailed && step.step === 'completed' ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Circle className="w-2 h-2 text-gray-500" />
                    )}
                  </motion.div>
                  <span
                    className={`
                      mt-1 text-[10px] font-medium truncate w-full text-center
                      ${
                        isComplete
                          ? 'text-green-400'
                          : isCurrent
                          ? 'text-purple-400'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {isFailed && step.step === 'completed' ? 'Failed' : step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < VISIBLE_STEPS.length - 1 && (
                  <div className="w-4 h-0.5 -mt-4 bg-gray-700">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{
                        scaleX: isComplete ? 1 : 0,
                        backgroundColor: isComplete ? '#22c55e' : '#4b5563',
                      }}
                      style={{ backgroundColor: isComplete ? '#22c55e' : '#4b5563' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
