'use client';

import useSWR from 'swr';
import { ProcessingStep, ProcessingLogEntry } from '@/lib/db/schema';

export interface ProcessingStatus {
  id: string;
  topic: string;
  status: string;
  processingStep: ProcessingStep | null;
  processingProgress: number;
  processingLogs: ProcessingLogEntry[];
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingError: string | null;
}

const fetcher = async (url: string): Promise<ProcessingStatus> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

interface UseProcessingStatusOptions {
  /** Polling interval in milliseconds. Set to 0 to disable polling. Default: 1500ms */
  refreshInterval?: number;
  /** Whether to pause polling when status is completed or failed */
  pauseWhenDone?: boolean;
}

/**
 * Hook to poll meeting processing status for real-time UI updates
 *
 * @param meetingId - The meeting ID to track
 * @param options - Polling options
 * @returns Processing status data and SWR utilities
 */
export function useProcessingStatus(
  meetingId: string | null | undefined,
  options: UseProcessingStatusOptions = {}
) {
  const { refreshInterval = 1500, pauseWhenDone = true } = options;

  const { data, error, isLoading, mutate } = useSWR<ProcessingStatus>(
    meetingId ? `/api/meetings/${meetingId}/status` : null,
    fetcher,
    {
      refreshInterval: (latestData) => {
        // Stop polling when processing is done
        if (pauseWhenDone && latestData) {
          const isDone =
            latestData.processingStep === 'completed' ||
            latestData.processingStep === 'failed' ||
            latestData.status === 'ready' ||
            latestData.status === 'completed' ||
            latestData.status === 'failed';
          if (isDone) return 0;
        }
        return refreshInterval;
      },
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  const isProcessing =
    data?.status === 'processing' ||
    (data?.processingStep !== null &&
      data?.processingStep !== 'completed' &&
      data?.processingStep !== 'failed');

  const isComplete =
    data?.processingStep === 'completed' || data?.status === 'ready';

  const isFailed = data?.processingStep === 'failed' || data?.status === 'failed';

  return {
    data,
    error,
    isLoading,
    isProcessing,
    isComplete,
    isFailed,
    refresh: mutate,
  };
}
