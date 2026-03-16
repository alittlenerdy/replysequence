'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, Radio } from 'lucide-react';

type PipelineStatus =
  | 'idle'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'generating_sequence'
  | 'draft_ready'
  | 'failed';

interface PipelineStep {
  id: string;
  label: string;
  statusKey: PipelineStatus[];
}

interface ProcessingStatusCardProps {
  status?: PipelineStatus;
  meetingName?: string;
  lastUpdated?: string;
  error?: string;
}

const pipelineSteps: PipelineStep[] = [
  { id: 'upload', label: 'Recording received', statusKey: ['uploading'] },
  { id: 'transcribe', label: 'Transcript imported', statusKey: ['transcribing'] },
  { id: 'analyze', label: 'Analyzing conversation', statusKey: ['analyzing'] },
  { id: 'generate', label: 'Generating sequence', statusKey: ['generating_sequence'] },
  { id: 'ready', label: 'Draft ready', statusKey: ['draft_ready'] },
];

function getStepIndex(status: PipelineStatus): number {
  switch (status) {
    case 'idle': return -1;
    case 'uploading': return 0;
    case 'transcribing': return 1;
    case 'analyzing': return 2;
    case 'generating_sequence': return 3;
    case 'draft_ready': return 4;
    case 'failed': return -2;
    default: return -1;
  }
}

const defaultProps: ProcessingStatusCardProps = {
  status: 'analyzing',
  meetingName: 'Acme Corp - Sales Discovery Call',
  lastUpdated: '2 min ago',
};

export function ProcessingStatusCard({
  status = defaultProps.status!,
  meetingName = defaultProps.meetingName!,
  lastUpdated = defaultProps.lastUpdated!,
  error,
}: ProcessingStatusCardProps) {
  const currentIndex = getStepIndex(status);
  const isFailed = status === 'failed';
  const isComplete = status === 'draft_ready';
  const progressPercent = isComplete
    ? 100
    : currentIndex >= 0
      ? ((currentIndex + 0.5) / pipelineSteps.length) * 100
      : 0;

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#38E8FF]/10 flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#38E8FF]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900">Processing Pipeline</h3>
            <p className="text-[11px] text-gray-500 light:text-gray-400 truncate max-w-[240px]">{meetingName}</p>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 light:text-gray-400">Updated {lastUpdated}</span>
      </div>

      <div className="space-y-1.5 mb-4">
        {pipelineSteps.map((step, i) => {
          const isCompleted = currentIndex > i || isComplete;
          const isCurrent = currentIndex === i && !isFailed;
          const isUpcoming = currentIndex < i && !isComplete;

          return (
            <motion.div
              key={step.id}
              className="flex items-center gap-3 py-1.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.2 }}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-[#4DFFA3] shrink-0" strokeWidth={2} style={{ width: 18, height: 18 }} />
              ) : isCurrent ? (
                <Loader2 className="w-4.5 h-4.5 text-[#38E8FF] animate-spin shrink-0" strokeWidth={2} style={{ width: 18, height: 18 }} />
              ) : (
                <Circle className="w-4.5 h-4.5 text-gray-600 light:text-gray-300 shrink-0" strokeWidth={1.5} style={{ width: 18, height: 18 }} />
              )}
              <span
                className={`text-sm ${
                  isCompleted
                    ? 'text-[#4DFFA3] font-medium'
                    : isCurrent
                      ? 'text-white light:text-gray-900 font-medium'
                      : 'text-gray-500 light:text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {isCurrent && (
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#38E8FF]/10 text-[#38E8FF]">
                  In progress
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {isFailed && error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#FF5D5D]/10 border border-[#FF5D5D]/20 text-xs text-[#FF5D5D]">
          {error}
        </div>
      )}

      <div className="relative h-1.5 rounded-full bg-gray-800 light:bg-gray-100 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            backgroundColor: isFailed ? '#FF5D5D' : isComplete ? '#4DFFA3' : '#38E8FF',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
