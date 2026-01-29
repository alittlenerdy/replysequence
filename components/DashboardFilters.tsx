'use client';

import type { DraftStatus } from '@/lib/db/schema';

interface DashboardFiltersProps {
  status: DraftStatus | 'all';
  search: string;
  dateRange: 'week' | 'month' | 'all';
  onStatusChange: (status: DraftStatus | 'all') => void;
  onSearchChange: (search: string) => void;
  onDateRangeChange: (range: 'week' | 'month' | 'all') => void;
  onClearFilters: () => void;
}

const statusOptions: { value: DraftStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'generated', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'generating', label: 'Generating' },
  { value: 'pending', label: 'Pending' },
];

const dateOptions: { value: 'week' | 'month' | 'all'; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
];

export function DashboardFilters({
  status,
  search,
  dateRange,
  onStatusChange,
  onSearchChange,
  onDateRangeChange,
  onClearFilters,
}: DashboardFiltersProps) {
  const hasActiveFilters = status !== 'all' || search !== '' || dateRange !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search by meeting name or subject..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <label htmlFor="status" className="sr-only">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as DraftStatus | 'all')}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="w-full md:w-40">
          <label htmlFor="dateRange" className="sr-only">Date Range</label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as 'week' | 'month' | 'all')}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
