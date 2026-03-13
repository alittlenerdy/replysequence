'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Pause, Play, XCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { SequenceCard } from '@/components/dashboard/SequenceCard';
import type { SequenceStatus, SequenceStepStatus, SequencePauseReason } from '@/lib/db/schema';

interface SequenceStepData {
  id: string;
  stepNumber: number;
  stepType: string;
  subject: string;
  body: string;
  delayHours: number;
  scheduledAt: string | null;
  status: SequenceStepStatus;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  errorMessage: string | null;
}

interface SequenceData {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  status: SequenceStatus;
  pauseReason: SequencePauseReason | null;
  totalSteps: number;
  completedSteps: number;
  meetingTopic: string | null;
  meetingId?: string;
  createdAt: string;
  steps: SequenceStepData[];
}

type FilterTab = 'all' | 'active' | 'paused' | 'completed';

const FILTER_TABS: { key: FilterTab; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'text-white light:text-gray-900' },
  { key: 'active', label: 'Active', color: 'text-emerald-400' },
  { key: 'paused', label: 'Paused', color: 'text-amber-400' },
  { key: 'completed', label: 'Completed', color: 'text-[#5B6CFF]' },
];

export default function SequencesPage() {
  const [sequences, setSequences] = useState<SequenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSequences = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch('/api/sequences');
      if (!res.ok) throw new Error('Failed to load sequences');
      const data = await res.json();
      setSequences(data.sequences || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sequences');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const filtered = filter === 'all'
    ? sequences
    : sequences.filter(s => s.status === filter);

  const counts = {
    all: sequences.length,
    active: sequences.filter(s => s.status === 'active').length,
    paused: sequences.filter(s => s.status === 'paused').length,
    completed: sequences.filter(s => s.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700/50 light:bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-700/50 light:bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-20 bg-gray-700/50 light:bg-gray-200 rounded-full" />
                <div className="h-5 w-40 bg-gray-700/50 light:bg-gray-200 rounded" />
              </div>
              <div className="h-2 w-full bg-gray-700/50 light:bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-gray-900 flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#7A5CFF]/15">
              <Layers className="w-5 h-5 text-[#7A5CFF]" strokeWidth={1.5} />
            </div>
            Sequences
          </h1>
          <p className="text-sm text-gray-400 light:text-gray-500 mt-1">
            Automated multi-step follow-up sequences
          </p>
        </div>
        <button
          onClick={() => fetchSequences(true)}
          disabled={isRefreshing}
          className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
          aria-label="Refresh sequences"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-800/50 light:bg-gray-100 rounded-lg p-0.5 w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-[#5B6CFF] text-white shadow-sm'
                : 'text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">({counts[tab.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={() => fetchSequences()}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Sequences list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7A5CFF]/10 mb-6">
            <Layers className="w-8 h-8 text-[#7A5CFF]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
            {filter === 'all' ? 'No sequences yet' : `No ${filter} sequences`}
          </h2>
          <p className="text-sm text-gray-400 light:text-gray-500 max-w-sm">
            {filter === 'all'
              ? 'Sequences are multi-step follow-up flows created from meetings. Open a meeting detail page and click "New Sequence" to start one.'
              : `You don't have any ${filter} sequences. Change your filter to see other sequences.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(seq => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              onStatusChange={() => fetchSequences(true)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
