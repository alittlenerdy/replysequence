'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftPreviewModal } from './DraftPreviewModal';

// Hydration-safe date formatting hook
function useHydrationSafeDate() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

// Convert 0-100 score to 1-5 stars for compact display
function scoreToStars(score: number | null): number {
  if (score === null) return 0;
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

// Get quality badge styling based on star count
function getQualityBadgeStyle(stars: number): { bg: string; text: string; label: string } {
  if (stars >= 4) return { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: stars === 5 ? 'Excellent' : 'Good' };
  if (stars === 3) return { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'Review' };
  return { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: 'Needs Work' };
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkSendConfirm, setShowBulkSendConfirm] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const isMounted = useHydrationSafeDate();

  // Sendable drafts = not yet sent
  const sendableDrafts = useMemo(
    () => drafts.filter((d) => d.status !== 'sent'),
    [drafts]
  );

  // Clear selection when drafts change (page change, filter, refresh)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [drafts]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sendableDrafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sendableDrafts.map((d) => d.id)));
    }
  }, [selectedIds.size, sendableDrafts]);

  const selectedDrafts = useMemo(
    () => drafts.filter((d) => selectedIds.has(d.id)),
    [drafts, selectedIds]
  );

  const handleBulkSend = async () => {
    const toSend = selectedDrafts.filter((d) => d.status !== 'sent' && d.meetingHostEmail);
    if (toSend.length === 0) return;

    setBulkSending(true);
    setBulkError(null);
    setBulkProgress({ done: 0, total: toSend.length });

    let successCount = 0;
    let failCount = 0;

    for (const draft of toSend) {
      try {
        const res = await fetch('/api/drafts/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftId: draft.id, recipientEmail: draft.meetingHostEmail }),
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
      setBulkProgress({ done: successCount + failCount, total: toSend.length });
    }

    setBulkSending(false);
    setBulkProgress(null);
    setSelectedIds(new Set());

    if (failCount > 0) {
      setBulkError(`Sent ${successCount} of ${toSend.length} emails (${failCount} failed)`);
      setTimeout(() => setBulkError(null), 5000);
    }

    onDraftUpdated();
  };

  const handleBulkDelete = async () => {
    if (selectedDrafts.length === 0) return;

    setBulkDeleting(true);
    setBulkError(null);

    let successCount = 0;
    let failCount = 0;

    for (const draft of selectedDrafts) {
      try {
        const res = await fetch(`/api/drafts/${draft.id}`, { method: 'DELETE' });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setBulkDeleting(false);
    setSelectedIds(new Set());

    if (failCount > 0) {
      setBulkError(`Deleted ${successCount} of ${selectedDrafts.length} drafts (${failCount} failed)`);
      setTimeout(() => setBulkError(null), 5000);
    }

    onDraftUpdated();
  };

  // Show all rows immediately (no stagger animation)
  useEffect(() => {
    setVisibleRows(drafts.length);
  }, [drafts]);

  // Format date only after mount to avoid hydration mismatch
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    if (!isMounted) return '...'; // Placeholder during SSR
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

  // Format date for mobile (shorter) - hydration safe
  const formatDateShort = (date: Date | null) => {
    if (!date) return '-';
    if (!isMounted) return '...';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Render quality badge (reusable for both layouts)
  const renderQualityBadge = (draft: DraftWithMeeting, compact = false) => {
    if (draft.qualityScore === null) return null;
    const stars = scoreToStars(draft.qualityScore);
    const style = getQualityBadgeStyle(stars);
    return (
      <span
        className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-md border ${style.bg} ${style.text} text-xs font-medium`}
        title={`AI Quality Score: ${draft.qualityScore}/100`}
      >
        <span className="flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${s <= stars ? 'text-yellow-400' : 'text-gray-600/50'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </span>
        {!compact && <span className="hidden sm:inline">{style.label}</span>}
      </span>
    );
  };

  // Render engagement indicators (reusable)
  const renderEngagementIndicators = (draft: DraftWithMeeting) => {
    if (draft.status !== 'sent') return null;
    return (
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
    );
  };

  return (
    <>
      <div className="bg-gray-900/60 light:bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 light:border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-700/50 light:border-gray-200 bg-gray-800/50 light:bg-gray-50/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white light:text-gray-900">Email Drafts</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 light:text-gray-500">{total} total</span>
              {total > 0 && (
                <a
                  href="/api/drafts/export"
                  download
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors border border-gray-600/50"
                  title="Export all drafts as CSV"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-blue-500/30 bg-blue-500/10">
            {showBulkDeleteConfirm ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-red-300">Delete {selectedIds.size} draft{selectedIds.size > 1 ? 's' : ''}? This cannot be undone.</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={bulkDeleting}
                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowBulkDeleteConfirm(false); handleBulkDelete(); }}
                    disabled={bulkDeleting}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {bulkDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            ) : showBulkSendConfirm ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-blue-300">Send {selectedDrafts.filter((d) => d.status !== 'sent').length} email{selectedDrafts.filter((d) => d.status !== 'sent').length > 1 ? 's' : ''} to their meeting hosts?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkSendConfirm(false)}
                    disabled={bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowBulkSendConfirm(false); handleBulkSend(); }}
                    disabled={bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {bulkSending ? 'Sending...' : 'Confirm Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-300 font-medium">{selectedIds.size} selected</span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {bulkProgress && (
                    <span className="text-xs text-blue-300">
                      {bulkProgress.done}/{bulkProgress.total}
                    </span>
                  )}
                  {bulkError && (
                    <span className="text-xs text-amber-400">{bulkError}</span>
                  )}
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={bulkDeleting || bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowBulkSendConfirm(true)}
                    disabled={bulkSending || bulkDeleting || selectedDrafts.every((d) => d.status === 'sent')}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {bulkSending ? 'Sending...' : `Send ${selectedDrafts.filter((d) => d.status !== 'sent').length}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Card Layout - shown on small screens */}
        <div className="md:hidden divide-y divide-gray-700/50 light:divide-gray-200">
          {drafts.map((draft, index) => (
            <div
              key={draft.id}
              className={`
                p-4 transition-all duration-300 ease-out
                ${index < visibleRows ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                ${selectedIds.has(draft.id) ? 'bg-blue-500/10' : 'hover:bg-gray-700/70 light:hover:bg-blue-50'}
                active:bg-gray-700/90 light:active:bg-blue-100
                cursor-pointer
              `}
              onClick={() => setSelectedDraft(draft)}
            >
              {/* Top row: Checkbox + Platform icon + Meeting name + Date */}
              <div className="flex items-start gap-3 mb-2">
                {draft.status !== 'sent' && (
                  <label
                    className="shrink-0 flex items-center pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(draft.id)}
                      onChange={() => toggleSelect(draft.id)}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                )}
                <div className="shrink-0">{getPlatformIcon(draft.meetingPlatform)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-white light:text-gray-900 truncate flex items-center gap-1.5">
                      {draft.meetingTopic || 'Untitled Meeting'}
                      <Link
                        href={`/dashboard/meetings/${draft.meetingId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-blue-400 transition-colors shrink-0"
                        title="View meeting details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </h3>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatDateShort(draft.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 light:text-gray-500 truncate">
                    {draft.meetingHostEmail}
                  </p>
                </div>
              </div>

              {/* Subject line */}
              <p className="text-sm text-gray-300 light:text-gray-700 mb-3 truncate">
                {draft.subject}
              </p>

              {/* Bottom row: Status + Quality + Engagement + View button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={draft.status} size="sm" />
                  {renderQualityBadge(draft, true)}
                  {renderEngagementIndicators(draft)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDraft(draft);
                  }}
                  className="
                    shrink-0 px-4 py-2 rounded-lg min-h-[44px]
                    text-blue-400 light:text-blue-600
                    bg-blue-500/10 light:bg-blue-50
                    hover:bg-blue-500/20 light:hover:bg-blue-100
                    active:scale-95
                    transition-all duration-200
                    text-sm font-medium
                  "
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout - hidden on small screens */}
        <div className="hidden md:block">
          <table className="w-full table-fixed divide-y divide-gray-700 light:divide-gray-200">
            <thead className="bg-gray-800/50 light:bg-gray-50/80">
              <tr>
                <th className="w-[40px] px-3 py-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sendableDrafts.length > 0 && selectedIds.size === sendableDrafts.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                </th>
                <th className="w-[28%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Meeting
                </th>
                <th className="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-[60px] px-2 py-3">
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/40 light:bg-white/60 divide-y divide-gray-700/50 light:divide-gray-200">
              {drafts.map((draft) => (
                <tr
                  key={draft.id}
                  className={`${selectedIds.has(draft.id) ? 'bg-blue-500/10' : 'hover:bg-gray-700/70 light:hover:bg-blue-50'} cursor-pointer`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    {draft.status !== 'sent' ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(draft.id)}
                          onChange={() => toggleSelect(draft.id)}
                          className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </label>
                    ) : (
                      <div className="w-4" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {getPlatformIcon(draft.meetingPlatform)}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white light:text-gray-900 truncate flex items-center gap-1.5">
                          {draft.meetingTopic || 'Untitled Meeting'}
                          <Link
                            href={`/dashboard/meetings/${draft.meetingId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-500 hover:text-blue-400 transition-colors shrink-0"
                            title="View meeting details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                        <div className="text-xs text-gray-400 light:text-gray-500 truncate">
                          {draft.meetingHostEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-200 light:text-gray-900 truncate">
                      {draft.subject}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={draft.status} size="sm" />
                      {renderEngagementIndicators(draft)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {draft.qualityScore !== null ? (
                      <span className={`text-xs font-medium ${
                        draft.qualityScore >= 80 ? 'text-emerald-400' :
                        draft.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {draft.qualityScore}/100
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-400 light:text-gray-500">
                    {formatDate(draft.createdAt)}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDraft(draft);
                      }}
                      className="px-3 py-1.5 rounded-lg text-blue-400 light:text-blue-600 bg-blue-500/10 light:bg-blue-50 hover:bg-blue-500/20 light:hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - with proper touch targets */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-700/50 light:border-gray-200 bg-gray-800/50 light:bg-gray-50/80">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 light:text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
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
