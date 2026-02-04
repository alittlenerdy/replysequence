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

  // Filters
  const [status, setStatus] = useState<DraftStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
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
      }
    } catch (error) {
      console.error('[DRAFTS-VIEW-ERROR] Failed to fetch drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search, dateRange]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        setPage(1);
        fetchDrafts();
      }
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
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

      {/* Stats */}
      {isLoading && drafts.length === 0 ? (
        <SkeletonStats />
      ) : (
        <DashboardStats stats={stats} />
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
