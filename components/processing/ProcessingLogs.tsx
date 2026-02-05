'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProcessingLogEntry, ProcessingStep } from '@/lib/db/schema';

interface ProcessingLogsProps {
  logs: ProcessingLogEntry[];
  maxHeight?: string;
  className?: string;
}

const STEP_ICONS: Record<ProcessingStep, typeof Info> = {
  webhook_received: Clock,
  meeting_fetched: Info,
  meeting_created: Info,
  transcript_download: Info,
  transcript_parse: Info,
  transcript_stored: Info,
  draft_generation: Info,
  completed: CheckCircle,
  failed: XCircle,
};

const STEP_COLORS: Record<ProcessingStep, string> = {
  webhook_received: 'text-gray-400',
  meeting_fetched: 'text-blue-400',
  meeting_created: 'text-blue-400',
  transcript_download: 'text-purple-400',
  transcript_parse: 'text-purple-400',
  transcript_stored: 'text-purple-400',
  draft_generation: 'text-amber-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
};

export function ProcessingLogs({
  logs,
  maxHeight = '200px',
  className = '',
}: ProcessingLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        overflow-y-auto overflow-x-hidden
        bg-gray-900/50 light:bg-gray-50 rounded-lg border border-gray-800 light:border-gray-200
        font-mono text-xs
        ${className}
      `}
      style={{ maxHeight }}
    >
      <AnimatePresence mode="popLayout">
        {logs.map((log, index) => {
          const Icon = STEP_ICONS[log.step] || Info;
          const colorClass = STEP_COLORS[log.step] || 'text-gray-400';

          return (
            <motion.div
              key={`${log.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
              }}
              className="flex items-start gap-2 px-3 py-2 border-b border-gray-800/50 light:border-gray-200/50 last:border-0"
            >
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${colorClass}`} />
              <span className="text-gray-500 light:text-gray-400 flex-shrink-0">{formatTime(log.timestamp)}</span>
              <span className="text-gray-300 light:text-gray-700 break-words">{log.message}</span>
              {log.duration_ms !== undefined && (
                <span className="text-gray-600 light:text-gray-400 ml-auto flex-shrink-0">
                  {(log.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {logs.length === 0 && (
        <div className="px-3 py-4 text-center text-gray-600 light:text-gray-400">
          Waiting for processing to start...
        </div>
      )}
    </div>
  );
}
