'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';
import { DraftsTable } from '../DraftsTable';
import { EmptyState } from '../EmptyState';
import { SkeletonTable } from '../ui/SkeletonTable';
import { ProcessingMeetingCard } from '../processing';
import { useProcessingMeetings } from '@/hooks/useProcessingMeetings';
import { UsageLimitBanner } from './UsageLimitBanner';
import DraftTour from '@/components/tour/DraftTour';

interface DraftsViewProps {
  initialDrafts: DraftWithMeeting[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialStats: {
    total: number;
    generated: number;
    sent: number;
    failed: number;
    avgCost: number;
    avgLatency: number;
  };
  initialHasConnectedPlatforms: boolean;
  hideStats?: boolean;
}

export function DraftsView({
  initialDrafts,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialStats,
  initialHasConnectedPlatforms,
  hideStats = false,
}: DraftsViewProps) {
  const [drafts, setDrafts] = useState<DraftWithMeeting[]>(initialDrafts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [stats, setStats] = useState(initialStats);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(initialHasConnectedPlatforms);
  const [isLoading, setIsLoading] = useState(false);
  // Hydration guard: render table only after client mount to prevent SSR/client mismatch
  // (DraftsTable uses date formatting that differs between server and client)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<DraftStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status,
        search,
        dateRange,
      });

      const response = await fetch(`/api/drafts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDrafts(data.drafts);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setStats(data.stats);
        if (typeof data.hasConnectedPlatforms === 'boolean') {
          setHasConnectedPlatforms(data.hasConnectedPlatforms);
        }
      } else {
        setFetchError(data.error || 'Failed to load drafts');
      }
    } catch (error) {
      console.error('[DRAFTS-VIEW-ERROR] Failed to fetch drafts:', error);
      setFetchError('Unable to connect. Check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search, dateRange]);

  // Debounce search (fires on clear too so results restore)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchDrafts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch on filter changes (except search which is debounced)
  useEffect(() => {
    fetchDrafts();
  }, [page, status, dateRange]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusChange = (newStatus: DraftStatus | 'all') => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleDateRangeChange = (newRange: 'week' | 'month' | 'all') => {
    setDateRange(newRange);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatus('all');
    setSearch('');
    setDateRange('all');
    setPage(1);
  };

  const handleDraftUpdated = () => {
    fetchDrafts();
  };

  const hasActiveFilters = status !== 'all' || search !== '' || dateRange !== 'all';

  // Tour integration: expose DraftsTable expansion control to DraftTour
  const tourExpandRef = useRef<{
    expandedDraftId: string | null;
    expandFirst: () => void;
  } | null>(null);

  const handleRetakeTour = () => {
    localStorage.removeItem('replysequence-draft-tour-completed');
    window.location.reload();
  };

  // Track processing meetings for live updates
  const { meetings: processingMeetings, refresh: refreshProcessing } = useProcessingMeetings();

  // Refresh drafts list when a processing meeting completes
  const handleProcessingComplete = useCallback(() => {
    fetchDrafts();
    refreshProcessing();
  }, [fetchDrafts, refreshProcessing]);

  return (
    <div className="space-y-6">
      {/* Processing Meetings */}
      <AnimatePresence mode="popLayout">
        {processingMeetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-white light:text-gray-900 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366F1]" />
              </span>
              Processing
            </h2>
            {processingMeetings.map((meeting) => (
              <ProcessingMeetingCard
                key={meeting.id}
                meetingId={meeting.id}
                onComplete={handleProcessingComplete}
                showLogs={true}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free tier usage limit indicator */}
      <UsageLimitBanner />

      {/* Error State */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {fetchError}
          </div>
          <button
            onClick={() => fetchDrafts()}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Simplified filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { value: 'all' as const, label: 'All' },
          { value: 'generated' as const, label: 'Ready' },
          { value: 'sent' as const, label: 'Sent' },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusChange(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 ${
              status === f.value
                ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-sm shadow-[#F59E0B]/25'
                : 'bg-transparent text-[#8892B0] light:text-gray-500 border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300 hover:text-white light:hover:text-gray-900'
            }`}
          >
            {f.label}
          </button>
        ))}
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1); }}
            className="text-xs text-[#8892B0] hover:text-white light:hover:text-gray-900 transition-colors ml-1"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Loading State */}
      {(isLoading || !hydrated) && (
        <SkeletonTable />
      )}

      {/* Content - only after hydration to prevent duplicate table rendering */}
      {!isLoading && hydrated && (
        <>
          {drafts.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              hasConnectedPlatforms={hasConnectedPlatforms || processingMeetings.length > 0}
              onClearFilters={handleClearFilters}
              onDraftGenerated={() => fetchDrafts()}
            />
          ) : (
            <>
              <DraftsTable
                drafts={drafts}
                total={total}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onDraftUpdated={handleDraftUpdated}
                tourExpandRef={tourExpandRef}
              />
              <DraftTour
                hasDrafts={drafts.length > 0}
                expandedDraftId={tourExpandRef.current?.expandedDraftId ?? null}
                onExpandFirstDraft={() => tourExpandRef.current?.expandFirst()}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
