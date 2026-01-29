'use client';

import type { DraftStatus } from '@/lib/db/schema';

interface StatusBadgeProps {
  status: DraftStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<DraftStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  },
  generating: {
    label: 'Generating',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 animate-pulse',
  },
  generated: {
    label: 'Draft',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
  },
  sent: {
    label: 'Sent',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.className} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
