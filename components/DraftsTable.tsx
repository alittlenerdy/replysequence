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
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.5 4.5h15c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2zm.5 3v8h8v-8h-8zm10 0v4l3-2v4l-3-2v4h4v-8h-4z"/>
          </svg>
        );
      case 'google_meet':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'microsoft_teams':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.2 6.4h-2.4V4.8c0-.88-.72-1.6-1.6-1.6H8.8c-.88 0-1.6.72-1.6 1.6v1.6H4.8c-.88 0-1.6.72-1.6 1.6v9.6c0 .88.72 1.6 1.6 1.6h14.4c.88 0 1.6-.72 1.6-1.6V8c0-.88-.72-1.6-1.6-1.6zM8.8 4.8h6.4v1.6H8.8V4.8zm10.4 12.8H4.8V8h14.4v9.6z"/>
            <circle cx="12" cy="11.2" r="2"/>
            <path d="M12 14c-2.21 0-4 1.34-4 3v.8h8V17c0-1.66-1.79-3-4-3z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
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
                    hover:shadow-lg hover:shadow-purple-500/5
                    cursor-pointer
                    border-b border-gray-700/50 light:border-gray-200
                    hover:border-purple-500/30
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
