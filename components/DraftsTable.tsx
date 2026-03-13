'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftPreviewModal } from './DraftPreviewModal';
import { DraftInlinePanel } from './DraftInlinePanel';

// Meeting intelligence data returned by GET /api/meetings/[meetingId]
interface MeetingIntelligence {
  id: string;
  topic: string | null;
  platform: string;
  startTime: string | null;
  summary: string | null;
  keyTopics: Array<{ topic: string; duration?: string }> | null;
  keyDecisions: Array<{ decision: string; context?: string }> | null;
  actionItems: Array<{ owner: string; task: string; deadline: string }> | null;
}

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

// Time-since-meeting badge: shows how long ago the meeting occurred
function getTimeSinceBadge(meetingStartTime: Date | null): { label: string; className: string; title: string } | null {
  if (!meetingStartTime) return null;
  const msElapsed = Date.now() - new Date(meetingStartTime).getTime();
  if (msElapsed < 0) return null; // future meeting
  const hours = msElapsed / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);

  if (hours < 2) {
    return {
      label: '< 2h',
      className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      title: `Meeting started ${Math.round(hours * 60)}m ago`,
    };
  }
  if (hours < 24) {
    return {
      label: `${Math.round(hours)}h`,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      title: `Meeting started ${Math.round(hours)}h ago`,
    };
  }
  return {
    label: `${days}d`,
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    title: `Meeting started ${days} day${days !== 1 ? 's' : ''} ago`,
  };
}

// Get quality badge styling based on star count
function getQualityBadgeStyle(stars: number): { bg: string; text: string; label: string } {
  if (stars >= 4) return { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: stars === 5 ? 'Excellent' : 'Good' };
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
  tourExpandRef?: React.MutableRefObject<{
    expandedDraftId: string | null;
    expandFirst: () => void;
  } | null>;
}

export function DraftsTable({
  drafts,
  total,
  page,
  totalPages,
  onPageChange,
  onDraftUpdated,
  tourExpandRef,
}: DraftsTableProps) {
  // Modal state — used for mobile and for Edit action from expanded row
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

  // Inline expansion state (desktop only)
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [meetingIntelCache, setMeetingIntelCache] = useState<Map<string, MeetingIntelligence>>(new Map());
  const [meetingIntelLoading, setMeetingIntelLoading] = useState<Set<string>>(new Set());
  // Track in-flight fetches to avoid duplicate requests
  const fetchingRef = useRef<Set<string>>(new Set());
  // Track whether body preview is expanded
  const [bodyExpanded, setBodyExpanded] = useState(false);

  // Expose expansion state to parent via ref (used by DraftTour)
  useEffect(() => {
    if (tourExpandRef) {
      tourExpandRef.current = {
        expandedDraftId,
        expandFirst: () => {
          if (drafts.length > 0) {
            setExpandedDraftId(drafts[0].id);
            setBodyExpanded(false);
          }
        },
      };
    }
  }); // No dependency array — always sync ref with current values

  // Sendable drafts = not yet sent
  const sendableDrafts = useMemo(
    () => drafts.filter((d) => d.status !== 'sent'),
    [drafts]
  );

  // Auto-expand first draft on load so users see the inline panel immediately
  const hasAutoExpanded = useRef(false);
  useEffect(() => {
    setSelectedIds(new Set());
    setBodyExpanded(false);
    if (!hasAutoExpanded.current && drafts.length > 0) {
      hasAutoExpanded.current = true;
      setExpandedDraftId(drafts[0].id);
      fetchMeetingIntel(drafts[0].meetingId);
    } else {
      setExpandedDraftId(null);
    }
  }, [drafts]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Memoize unsent selected drafts to avoid repeated .filter() calls in JSX
  const unsentSelectedDrafts = useMemo(
    () => selectedDrafts.filter((d) => d.status !== 'sent'),
    [selectedDrafts]
  );

  // Fetch meeting intelligence data for inline expansion
  const fetchMeetingIntel = useCallback(async (meetingId: string) => {
    // Already cached or in-flight
    if (meetingIntelCache.has(meetingId) || fetchingRef.current.has(meetingId)) return;

    fetchingRef.current.add(meetingId);
    setMeetingIntelLoading((prev) => new Set(prev).add(meetingId));

    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (res.ok) {
        const data: MeetingIntelligence = await res.json();
        setMeetingIntelCache((prev) => new Map(prev).set(meetingId, data));
      }
    } catch {
      // Silently fail — the UI will show "no data" state
    } finally {
      fetchingRef.current.delete(meetingId);
      setMeetingIntelLoading((prev) => {
        const next = new Set(prev);
        next.delete(meetingId);
        return next;
      });
    }
  }, [meetingIntelCache]);

  // Handle desktop row click — toggle inline expansion
  const handleDesktopRowClick = useCallback((draft: DraftWithMeeting) => {
    if (expandedDraftId === draft.id) {
      setExpandedDraftId(null);
      setBodyExpanded(false);
    } else {
      setExpandedDraftId(draft.id);
      setBodyExpanded(false);
      fetchMeetingIntel(draft.meetingId);
    }
  }, [expandedDraftId, fetchMeetingIntel]);

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

  // Handle closing the inline panel
  const handleInlineClose = useCallback(() => {
    setExpandedDraftId(null);
    setBodyExpanded(false);
  }, []);

  // Show all rows immediately (no stagger animation)
  useEffect(() => {
    setVisibleRows(drafts.length);
  }, [drafts]);

  // Format date only after mount to avoid hydration mismatch
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    if (!isMounted) return '\u2026'; // Placeholder during SSR
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return (
          <div className="w-8 h-8 relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-lg blur-md group-hover/icon:bg-indigo-400/50 transition-colors duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 10L20 7V17L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        );
      case 'google_meet':
        return (
          <div className="w-8 h-8 relative group/icon">
            <div className="absolute inset-0 bg-green-500/30 rounded-lg blur-md group-hover/icon:bg-green-400/50 transition-colors duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 8L19.5 5.5V18.5L15 16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        );
      case 'microsoft_teams':
        return (
          <div className="w-8 h-8 relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-lg blur-md group-hover/icon:bg-indigo-400/50 transition-colors duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 14H22V17C22 18.1046 21.1046 19 20 19H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 relative group/icon">
            <div className="absolute inset-0 bg-gray-500/30 rounded-lg blur-md group-hover/icon:bg-gray-400/50 transition-colors duration-300" />
            <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg shadow-gray-500/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    if (!isMounted) return '\u2026';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Render user rating indicator (thumbs up/down)
  const renderUserRating = (draft: DraftWithMeeting) => {
    if (!draft.userRating) return null;
    const isUp = draft.userRating === 'up';
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
          isUp ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
        }`}
        title={isUp ? 'Rated: Thumbs up' : 'Rated: Thumbs down'}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {isUp ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          )}
        </svg>
      </span>
    );
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
              aria-hidden="true"
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
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400"
            title={`${draft.openCount} open${(draft.openCount ?? 0) > 1 ? 's' : ''}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </span>
        )}
        {draft.repliedAt && (
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400"
            title="Replied"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </span>
        )}
      </div>
    );
  };

  // Render the inline expanded content for a draft (desktop)
  const renderExpandedRow = (draft: DraftWithMeeting) => {
    const intel = meetingIntelCache.get(draft.meetingId);
    const isLoading = meetingIntelLoading.has(draft.meetingId);

    return (
      <tr key={`${draft.id}-expanded`}>
        <td colSpan={8} className="p-0">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <DraftInlinePanel
              draft={draft}
              meetingIntel={intel || null}
              meetingIntelLoading={isLoading}
              onDraftUpdated={onDraftUpdated}
              onClose={handleInlineClose}
            />
          </motion.div>
        </td>
      </tr>
    );
  };

  return (
    <>
      <div id="drafts-table" className="bg-[#141720] light:bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/[0.06] light:border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] light:border-gray-200 bg-[#1c2030] light:bg-gray-50/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white light:text-gray-900">Follow-ups</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 light:text-gray-500 tabular-nums">{total} total</span>
              {total > 0 && (
                <a
                  href="/api/drafts/export"
                  download
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors border border-gray-600/50 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  title="Export all drafts as CSV"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
          <div className="px-4 sm:px-6 py-3 border-b border-indigo-500/30 bg-indigo-500/10">
            {showBulkDeleteConfirm ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-red-300">Delete {selectedIds.size} draft{selectedIds.size > 1 ? 's' : ''}? This cannot be undone.</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={bulkDeleting}
                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowBulkDeleteConfirm(false); handleBulkDelete(); }}
                    disabled={bulkDeleting}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    {bulkDeleting ? 'Deleting\u2026' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            ) : showBulkSendConfirm ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-indigo-300">Send {unsentSelectedDrafts.length} email{unsentSelectedDrafts.length > 1 ? 's' : ''} to their meeting hosts?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkSendConfirm(false)}
                    disabled={bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowBulkSendConfirm(false); handleBulkSend(); }}
                    disabled={bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    {bulkSending ? 'Sending\u2026' : 'Confirm Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-indigo-300 font-medium">{selectedIds.size} selected</span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-400 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {bulkProgress && (
                    <span className="text-xs text-indigo-300 tabular-nums">
                      {bulkProgress.done}/{bulkProgress.total}
                    </span>
                  )}
                  {bulkError && (
                    <span className="text-xs text-amber-400">{bulkError}</span>
                  )}
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={bulkDeleting || bulkSending}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowBulkSendConfirm(true)}
                    disabled={bulkSending || bulkDeleting || unsentSelectedDrafts.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    {bulkSending ? 'Sending\u2026' : `Send ${unsentSelectedDrafts.length}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Card Layout - shown on small screens, uses modal */}
        <div className="md:hidden divide-y divide-white/[0.06] light:divide-gray-200">
          {drafts.map((draft, index) => (
            <button
              key={draft.id}
              type="button"
              className={`
                p-4 transition-[opacity,transform,background-color] duration-300 ease-out w-full text-left
                ${index < visibleRows ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                ${selectedIds.has(draft.id) ? 'bg-indigo-500/10' : 'hover:bg-gray-700/70 light:hover:bg-indigo-50'}
                active:bg-gray-700/90 light:active:bg-indigo-100
                cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500
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
                      className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="sr-only">Select draft</span>
                  </label>
                )}
                <div className="shrink-0">{getPlatformIcon(draft.meetingPlatform)}</div>
                {isMounted && (() => {
                  const badge = getTimeSinceBadge(draft.meetingStartTime);
                  return badge ? (
                    <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${badge.className}`} title={badge.title}>
                      {badge.label}
                    </span>
                  ) : null;
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-white light:text-gray-900 truncate">
                      {draft.meetingTopic || 'Untitled Meeting'}
                      {draft.isDemo && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          Sample
                        </span>
                      )}
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
                  {renderUserRating(draft)}
                  {renderEngagementIndicators(draft)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDraft(draft);
                  }}
                  className="
                    shrink-0 px-4 py-2 rounded-lg min-h-[44px]
                    text-indigo-400 light:text-indigo-600
                    bg-indigo-500/10 light:bg-indigo-50
                    hover:bg-indigo-500/20 light:hover:bg-indigo-100
                    active:scale-95
                    transition-[background-color,transform] duration-200
                    text-sm font-medium
                    outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                  "
                >
                  View
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Table Layout - hidden on small screens, uses inline expansion */}
        <div className="hidden md:block">
          <table className="w-full table-fixed divide-y divide-white/[0.06] light:divide-gray-200">
            <thead className="bg-[#1c2030] light:bg-gray-50/80">
              <tr>
                <th className="w-[40px] px-3 py-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sendableDrafts.length > 0 && selectedIds.size === sendableDrafts.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="sr-only">Select all drafts</span>
                  </label>
                </th>
                <th className="w-[28%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Meeting
                </th>
                <th className="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden lg:table-cell w-[8%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="hidden lg:table-cell w-[130px] px-4 py-3 text-left text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-[70px] px-2 py-3">
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#141720] light:bg-white/60 divide-y divide-white/[0.06] light:divide-gray-200">
              {drafts.map((draft, index) => {
                const isExpanded = expandedDraftId === draft.id;
                return (
                  <Fragment key={draft.id}>
                    <tr
                      data-tour={index === 0 ? 'draft-row' : undefined}
                      tabIndex={0}
                      className={`
                        group/row
                        ${selectedIds.has(draft.id) ? 'bg-indigo-500/10' : isExpanded ? 'bg-gray-800/60 light:bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-700/70 light:hover:bg-indigo-50 border-l-2 border-l-transparent'}
                        cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500
                        transition-all duration-150
                      `}
                      onClick={() => handleDesktopRowClick(draft)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDesktopRowClick(draft); } }}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {draft.status !== 'sent' ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(draft.id)}
                              onChange={() => toggleSelect(draft.id)}
                              className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="sr-only">Select draft</span>
                          </label>
                        ) : (
                          <div className="w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getPlatformIcon(draft.meetingPlatform)}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white light:text-gray-900 truncate">
                              {draft.meetingTopic || 'Untitled Meeting'}
                              {draft.isDemo && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  Sample
                                </span>
                              )}
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
                      <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                        {isMounted && (() => {
                          const badge = getTimeSinceBadge(draft.meetingStartTime);
                          return badge ? (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${badge.className}`} title={badge.title}>
                              {badge.label}
                            </span>
                          ) : <span className="text-xs text-gray-500">-</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {draft.qualityScore !== null ? (
                            <span className={`text-xs font-medium tabular-nums ${
                              draft.qualityScore >= 80 ? 'text-amber-400' :
                              draft.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {draft.qualityScore}/100
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                          {renderUserRating(draft)}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-xs text-gray-400 light:text-gray-500">
                        {formatDate(draft.createdAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDesktopRowClick(draft);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                          title={isExpanded ? 'Collapse' : 'Expand draft'}
                        >
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && renderExpandedRow(draft)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination - with proper touch targets */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06] light:border-gray-200 bg-[#1c2030] light:bg-gray-50/80">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 light:text-gray-500 tabular-nums">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal — used for mobile + Edit action from expanded row */}
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

