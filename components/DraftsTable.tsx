'use client';

import { useState, useEffect } from 'react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftPreviewModal } from './DraftPreviewModal';

interface DraftsTableProps {
  drafts: DraftWithMeeting[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDraftUpdated: () => void;
}

export function DraftsTable({
  drafts,
  total,
  page,
  totalPages,
  onPageChange,
  onDraftUpdated,
}: DraftsTableProps) {
  const [selectedDraft, setSelectedDraft] = useState<DraftWithMeeting | null>(null);
  const [visibleRows, setVisibleRows] = useState(0);

  // Stagger reveal rows one by one
  useEffect(() => {
    setVisibleRows(0); // Reset on drafts change

    const timer = setInterval(() => {
      setVisibleRows((prev) => {
        if (prev >= drafts.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 50); // 50ms between each row

    return () => clearInterval(timer);
  }, [drafts]);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateSubject = (subject: string, maxLength = 50) => {
    if (subject.length <= maxLength) return subject;
    return subject.substring(0, maxLength) + '...';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return (
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur-md group-hover/icon:bg-blue-400/50 transition-all duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 10L20 7V17L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        );
      case 'google_meet':
        return (
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-green-500/30 rounded-lg blur-md group-hover/icon:bg-green-400/50 transition-all duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M15 8L19.5 5.5V18.5L15 16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        );
      case 'microsoft_teams':
        return (
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-lg blur-md group-hover/icon:bg-indigo-400/50 transition-all duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 14H22V17C22 18.1046 21.1046 19 20 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-gray-500/30 rounded-lg blur-md group-hover/icon:bg-gray-400/50 transition-all duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg shadow-gray-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 10L20 7V17L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-gray-900/60 light:bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 light:border-gray-200 overflow-hidden animate-card-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-700/50 light:border-gray-200 bg-gray-800/50 light:bg-gray-50/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white light:text-gray-900">Email Drafts</h2>
            <span className="text-sm text-gray-400 light:text-gray-500">{total} total</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700 light:divide-gray-200">
            <thead className="bg-gray-800/50 light:bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/40 light:bg-white/60 divide-y divide-gray-700/50 light:divide-gray-200">
              {drafts.map((draft, index) => (
                <tr
                  key={draft.id}
                  className={`
                    transition-all duration-300 ease-out
                    ${index < visibleRows
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-4'}
                    hover:bg-gray-700/70 light:hover:bg-blue-50
                    hover:shadow-lg hover:shadow-blue-500/5
                    cursor-pointer
                    border-b border-gray-700/50 light:border-gray-200
                    hover:border-blue-500/30
                  `}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(draft.meetingPlatform)}
                      <div>
                        <div className="text-sm font-medium text-white light:text-gray-900">
                          {draft.meetingTopic || 'Untitled Meeting'}
                        </div>
                        <div className="text-xs text-gray-400 light:text-gray-500">
                          {draft.meetingHostEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-200 light:text-gray-900">
                      {truncateSubject(draft.subject)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={draft.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 light:text-gray-500">
                    {formatDate(draft.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 light:text-gray-500">
                    {draft.costUsd ? `$${parseFloat(draft.costUsd).toFixed(4)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDraft(draft);
                      }}
                      className="
                        px-3 py-1.5 rounded-lg
                        text-blue-400 light:text-blue-600
                        bg-blue-500/10 light:bg-blue-50
                        hover:bg-blue-500/20 light:hover:bg-blue-100
                        hover:text-blue-300 light:hover:text-blue-700
                        hover:shadow-md hover:shadow-blue-500/20
                        hover:scale-105
                        active:scale-95
                        transition-all duration-200
                      "
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700/50 light:border-gray-200 bg-gray-800/50 light:bg-gray-50/80">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 light:text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-md hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-md hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedDraft && (
        <DraftPreviewModal
          draft={selectedDraft}
          onClose={() => setSelectedDraft(null)}
          onDraftUpdated={() => {
            onDraftUpdated();
            setSelectedDraft(null);
          }}
        />
      )}
    </>
  );
}
