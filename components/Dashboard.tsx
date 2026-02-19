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
import { AnalyticsDashboard } from './dashboard/AnalyticsDashboard';

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
    console.log('[DASHBOARD-1] Fetching drafts, filters:', { page, status, search, dateRange });
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
        console.log('[DASHBOARD-2] Drafts loaded, count:', data.drafts.length);
      }
    } catch (error) {
      console.error('[DASHBOARD-ERROR] Failed to fetch drafts:', error);
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
      {/* ANIMATED FLOATING BUBBLES - Small particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Generate many small floating bubbles */}
        {[
          // Indigo bubbles (deep)
          { size: 20, top: '10%', left: '5%', color: 'rgba(99, 102, 241, 0.4)', delay: 0, speed: 'fast' },
          { size: 15, top: '25%', left: '15%', color: 'rgba(99, 102, 241, 0.3)', delay: -2, speed: 'medium' },
          { size: 25, top: '60%', left: '8%', color: 'rgba(99, 102, 241, 0.35)', delay: -4, speed: 'slow' },
          { size: 12, top: '80%', left: '20%', color: 'rgba(99, 102, 241, 0.25)', delay: -1, speed: 'fast' },
          // Indigo bubbles (light)
          { size: 18, top: '15%', left: '85%', color: 'rgba(129, 140, 248, 0.4)', delay: -3, speed: 'medium' },
          { size: 22, top: '40%', left: '90%', color: 'rgba(129, 140, 248, 0.35)', delay: -5, speed: 'slow' },
          { size: 14, top: '70%', left: '80%', color: 'rgba(129, 140, 248, 0.3)', delay: -2, speed: 'fast' },
          { size: 16, top: '5%', left: '75%', color: 'rgba(129, 140, 248, 0.25)', delay: 0, speed: 'medium' },
          // Amber bubbles
          { size: 20, top: '30%', left: '30%', color: 'rgba(245, 158, 11, 0.35)', delay: -4, speed: 'slow' },
          { size: 16, top: '50%', left: '25%', color: 'rgba(245, 158, 11, 0.3)', delay: -1, speed: 'fast' },
          { size: 24, top: '85%', left: '40%', color: 'rgba(245, 158, 11, 0.4)', delay: -3, speed: 'medium' },
          { size: 12, top: '20%', left: '45%', color: 'rgba(245, 158, 11, 0.25)', delay: -2, speed: 'fast' },
          // Cyan bubbles
          { size: 18, top: '45%', left: '60%', color: 'rgba(34, 211, 238, 0.35)', delay: -5, speed: 'slow' },
          { size: 14, top: '65%', left: '55%', color: 'rgba(34, 211, 238, 0.3)', delay: 0, speed: 'medium' },
          { size: 22, top: '10%', left: '65%', color: 'rgba(34, 211, 238, 0.4)', delay: -2, speed: 'fast' },
          { size: 16, top: '90%', left: '70%', color: 'rgba(34, 211, 238, 0.25)', delay: -4, speed: 'slow' },
          // Amber/yellow bubbles
          { size: 15, top: '35%', left: '50%', color: 'rgba(251, 191, 36, 0.35)', delay: -1, speed: 'medium' },
          { size: 20, top: '75%', left: '60%', color: 'rgba(251, 191, 36, 0.3)', delay: -3, speed: 'fast' },
          { size: 12, top: '55%', left: '35%', color: 'rgba(251, 191, 36, 0.25)', delay: -5, speed: 'slow' },
          { size: 18, top: '8%', left: '40%', color: 'rgba(251, 191, 36, 0.4)', delay: 0, speed: 'medium' },
          // Extra scattered bubbles
          { size: 10, top: '42%', left: '12%', color: 'rgba(99, 102, 241, 0.3)', delay: -2, speed: 'fast' },
          { size: 14, top: '68%', left: '95%', color: 'rgba(129, 140, 248, 0.35)', delay: -4, speed: 'medium' },
          { size: 16, top: '22%', left: '70%', color: 'rgba(245, 158, 11, 0.3)', delay: -1, speed: 'slow' },
          { size: 12, top: '88%', left: '15%', color: 'rgba(34, 211, 238, 0.35)', delay: -3, speed: 'fast' },
          { size: 18, top: '3%', left: '55%', color: 'rgba(251, 191, 36, 0.3)', delay: -5, speed: 'medium' },
        ].map((bubble, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              bubble.speed === 'fast' ? 'animate-float-fast' :
              bubble.speed === 'medium' ? 'animate-float-medium' : 'animate-float-slow'
            }`}
            style={{
              width: bubble.size,
              height: bubble.size,
              top: bubble.top,
              left: bubble.left,
              backgroundColor: bubble.color,
              boxShadow: `0 0 ${bubble.size / 2}px ${bubble.color}`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Header - glass effect */}
      <header className="relative bg-gray-900/70 light:bg-white/70 backdrop-blur-xl border-b border-white/10 light:border-gray-200" style={{ zIndex: 20 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-display font-bold">
                <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
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
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-600 group-hover:w-full transition-all duration-300" />
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

        {/* Analytics Dashboard - Charts and Metrics */}
        <div className="my-8">
          <AnalyticsDashboard />
        </div>

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
