'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';
import { DraftsTable } from '../DraftsTable';
import { DashboardFilters } from '../DashboardFilters';
import { DashboardStats } from '../DashboardStats';
import { EmptyState } from '../EmptyState';
import { SkeletonStats } from '../ui/SkeletonCard';
import { SkeletonTable } from '../ui/SkeletonTable';
import { ProcessingMeetingCard } from '../processing';
import { useProcessingMeetings } from '@/hooks/useProcessingMeetings';
import { OnboardingChecklist } from './OnboardingChecklist';
import { UsageLimitBanner } from './UsageLimitBanner';

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
}

export function DraftsView({
  initialDrafts,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialStats,
}: DraftsViewProps) {
  const [drafts, setDrafts] = useState<DraftWithMeeting[]>(initialDrafts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<DraftStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    console.log('[DRAFTS-VIEW] Fetching drafts, filters:', { page, status, search, dateRange });
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
        console.log('[DRAFTS-VIEW] Drafts loaded, count:', data.drafts.length);
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
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

      {/* Nudge banner when drafts await review */}
      {stats.generated > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 light:bg-amber-50 light:border-amber-200">
          <span className="text-sm text-amber-300 light:text-amber-700">
            You have <strong>{stats.generated}</strong> draft{stats.generated !== 1 ? 's' : ''} awaiting your review
          </span>
          <button
            onClick={() => {
              document.getElementById('drafts-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-sm font-medium text-amber-400 light:text-amber-600 hover:text-amber-300 light:hover:text-amber-500 transition-colors whitespace-nowrap ml-4"
          >
            Review Now &rarr;
          </button>
        </div>
      )}

      {/* Onboarding Checklist - shows until completed */}
      <OnboardingChecklist />

      {/* Free tier usage limit indicator */}
      <UsageLimitBanner />

      {/* Stats */}
      {isLoading && drafts.length === 0 ? (
        <SkeletonStats />
      ) : (
        <DashboardStats stats={stats} />
      )}

      {/* Error State */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {fetchError}
          </div>
          <button
            onClick={() => fetchDrafts()}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <DashboardFilters
        status={status}
        search={search}
        dateRange={dateRange}
        onStatusChange={handleStatusChange}
        onSearchChange={setSearch}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
      />

      {/* Loading State */}
      {isLoading && (
        <SkeletonTable />
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {drafts.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onDraftGenerated={() => fetchDrafts()}
            />
          ) : (
            <DraftsTable
              drafts={drafts}
              total={total}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onDraftUpdated={handleDraftUpdated}
            />
          )}
        </>
      )}
    </div>
  );
}
