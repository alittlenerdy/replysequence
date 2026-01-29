'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';
import { DraftsTable } from './DraftsTable';
import { DashboardFilters } from './DashboardFilters';
import { DashboardStats } from './DashboardStats';
import { EmptyState } from './EmptyState';
import { SkeletonStats } from './ui/SkeletonCard';
import { SkeletonTable } from './ui/SkeletonTable';

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
    <div className="min-h-screen bg-[#0a0a0f] light:bg-gray-50 relative overflow-hidden">
      {/* ANIMATED FLOATING ORBS - HIGH VISIBILITY */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Large blue orb - top left - VERY VISIBLE */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-float-slow"
          style={{
            top: '-10%',
            left: '-5%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 30%, rgba(59, 130, 246, 0.05) 60%, transparent 80%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Purple orb - center right - BRIGHT */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-float-medium"
          style={{
            top: '15%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.5) 0%, rgba(147, 51, 234, 0.25) 30%, rgba(147, 51, 234, 0.08) 60%, transparent 80%)',
            filter: 'blur(25px)',
            animationDelay: '-7s',
          }}
        />

        {/* Pink/magenta orb - bottom left */}
        <div
          className="absolute w-[450px] h-[450px] rounded-full animate-float-fast"
          style={{
            bottom: '5%',
            left: '20%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0.2) 30%, rgba(236, 72, 153, 0.05) 60%, transparent 80%)',
            filter: 'blur(20px)',
            animationDelay: '-3s',
          }}
        />

        {/* Cyan accent orb - middle */}
        <div
          className="absolute w-[350px] h-[350px] rounded-full animate-float-slow"
          style={{
            top: '50%',
            left: '40%',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.1) 40%, transparent 70%)',
            filter: 'blur(30px)',
            animationDelay: '-12s',
          }}
        />

        {/* Small bright accent orb - top center */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full animate-float-fast"
          style={{
            top: '10%',
            left: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.1) 50%, transparent 80%)',
            filter: 'blur(15px)',
            animationDelay: '-5s',
          }}
        />
      </div>

      {/* Header - glass effect */}
      <header className="relative bg-gray-900/70 light:bg-white/70 backdrop-blur-xl border-b border-white/10 light:border-gray-200" style={{ zIndex: 20 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-display font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                  Dashboard
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-400 light:text-gray-500">
                Manage your AI-generated email drafts
              </p>
            </div>
            <a
              href="/"
              className="group text-sm font-medium text-gray-400 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-all duration-300"
            >
              <span className="relative">
                Back to Home
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ zIndex: 10 }}>
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
      </main>
    </div>
  );
}
