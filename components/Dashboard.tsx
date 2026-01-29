'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';
import { DraftsTable } from './DraftsTable';
import { DashboardFilters } from './DashboardFilters';
import { DashboardStats } from './DashboardStats';
import { EmptyState } from './EmptyState';

interface DashboardProps {
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

export function Dashboard({
  initialDrafts,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialStats,
}: DashboardProps) {
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
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative z-10">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your AI-generated email drafts
              </p>
            </div>
            <a
              href="/"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <DashboardStats stats={stats} />

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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading drafts...</p>
          </div>
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
      </main>
    </div>
  );
}
