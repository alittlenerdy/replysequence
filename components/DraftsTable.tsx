'use client';

import { useState, useEffect } from 'react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftPreviewModal } from './DraftPreviewModal';

// Convert 0-100 score to 1-5 stars for compact display
function scoreToStars(score: number | null): number {
  if (score === null) return 0;
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

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
            <div className="absolute inset-0 bg-purple-500/30 rounded-lg blur-md group-hover/icon:bg-purple-400/50 transition-all duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
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
                    <div className="flex items-center gap-2">
                      <StatusBadge status={draft.status} size="sm" />
                      {/* Quality score stars */}
                      {draft.qualityScore !== null && (
                        <span
                          className="inline-flex items-center gap-0.5"
                          title={`Quality: ${draft.qualityScore}/100`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${star <= scoreToStars(draft.qualityScore) ? 'text-yellow-400' : 'text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </span>
                      )}
                      {/* Engagement indicators for sent emails */}
                      {draft.status === 'sent' && (
                        <div className="flex items-center gap-1">
                          {(draft.openCount ?? 0) > 0 && (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400"
                              title={`${draft.openCount} open${(draft.openCount ?? 0) > 1 ? 's' : ''}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </span>
                          )}
                          {(draft.clickCount ?? 0) > 0 && (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400"
                              title={`${draft.clickCount} click${(draft.clickCount ?? 0) > 1 ? 's' : ''}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                            </span>
                          )}
                          {draft.repliedAt && (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400"
                              title="Replied"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
