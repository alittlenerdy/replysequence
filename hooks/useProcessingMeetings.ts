'use client';

import useSWR from 'swr';

export interface ProcessingMeeting {
  id: string;
  topic: string;
  status: string;
  processingStep: string | null;
  processingProgress: number;
  processingStartedAt: string | null;
  createdAt: string | null;
}

interface ProcessingMeetingsResponse {
  meetings: ProcessingMeeting[];
}

const fetcher = async (url: string): Promise<ProcessingMeetingsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return res.json();
};

/**
 * Hook to fetch all currently processing meetings
 * Used to show processing cards at the top of the dashboard
 */
export function useProcessingMeetings() {
  const { data, error, isLoading, mutate } = useSWR<ProcessingMeetingsResponse>(
    '/api/meetings/processing',
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    meetings: data?.meetings ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}
