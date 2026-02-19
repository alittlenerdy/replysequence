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

const statusChips: { value: DraftStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'generated', label: 'Awaiting Review' },
  { value: 'sent', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
];

const dateChips: { value: 'week' | 'month' | 'all'; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
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
    <div className="space-y-3">
      {/* Chip rows + search on same level */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Status chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => onStatusChange(chip.value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                ${status === chip.value
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 light:bg-indigo-50 light:text-indigo-600 light:border-indigo-200'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300 light:text-gray-500 light:border-gray-300 light:hover:border-gray-400 light:hover:text-gray-700'
                }
              `}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-gray-700 light:bg-gray-300" />

        {/* Date range chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {dateChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => onDateRangeChange(chip.value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                ${dateRange === chip.value
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 light:bg-indigo-50 light:text-indigo-600 light:border-indigo-200'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300 light:text-gray-500 light:border-gray-300 light:hover:border-gray-400 light:hover:text-gray-700'
                }
              `}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Spacer pushes search to the right on desktop */}
        <div className="hidden lg:flex flex-1" />

        {/* Search */}
        <div className="relative w-full lg:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-500 light:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              block w-full pl-9 pr-3 py-2
              border border-gray-700 light:border-gray-300
              rounded-lg text-sm
              text-white light:text-gray-900
              placeholder-gray-500 light:placeholder-gray-400
              bg-gray-800/50 light:bg-white
              focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
              transition-all duration-200
            "
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 light:hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 rounded-lg transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
