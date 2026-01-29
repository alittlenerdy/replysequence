'use client';

import type { DraftStatus } from '@/lib/db/schema';

interface StatusBadgeProps {
  status: DraftStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<DraftStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-700 text-gray-300 border-gray-600 light:bg-gray-100 light:text-gray-700 light:border-gray-200',
  },
  generating: {
    label: 'Generating',
    className: 'bg-blue-900 text-blue-300 border-blue-800 light:bg-blue-100 light:text-blue-700 light:border-blue-200 animate-pulse',
  },
  generated: {
    label: 'Draft',
    className: 'bg-yellow-900 text-yellow-200 border-yellow-800 light:bg-amber-100 light:text-amber-700 light:border-amber-200',
  },
  sent: {
    label: 'Sent',
    className: 'bg-green-900 text-green-300 border-green-800 light:bg-green-100 light:text-green-700 light:border-green-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-900 text-red-300 border-red-800 light:bg-red-100 light:text-red-700 light:border-red-200',
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
