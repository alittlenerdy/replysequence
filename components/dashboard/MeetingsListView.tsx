'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, FileText, Send, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { MeetingListItem, MeetingsQueryResult } from '@/lib/dashboard-queries';

function PlatformIcon({ platform }: { platform: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    zoom: { label: 'Zoom', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/15' },
    google_meet: { label: 'Meet', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/15' },
    microsoft_teams: { label: 'Teams', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/15' },
  };
  const { label, color, bg } = config[platform] || { label: platform, color: 'text-gray-400', bg: 'bg-gray-500/15' };

  return (
    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <span className={`text-xs font-bold ${color}`}>{label.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

type FollowUpStatus = 'failed' | 'processing' | 'no_draft' | 'draft_ready' | 'overdue' | 'sent';

function getFollowUpStatus(meeting: MeetingListItem): FollowUpStatus {
  if (meeting.status === 'failed') return 'failed';
  if (meeting.status === 'processing' || meeting.status === 'pending') return 'processing';
  if (meeting.sentCount > 0) return 'sent';
  if (meeting.draftCount > 0) {
    // Check if draft has been sitting >24h since meeting
    if (meeting.startTime) {
      const hoursSinceMeeting = (Date.now() - new Date(meeting.startTime).getTime()) / (1000 * 60 * 60);
      if (hoursSinceMeeting > 24) return 'overdue';
    }
    return 'draft_ready';
  }
  return 'no_draft';
}

function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const config: Record<FollowUpStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    failed: {
      label: 'Failed',
      classes: 'bg-red-500/15 text-red-400 border-red-500/20',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    processing: {
      label: 'Processing\u2026',
      classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40 light:bg-amber-50 light:text-amber-700 light:border-amber-300',
      icon: <Clock className="w-3 h-3 animate-spin" />,
    },
    no_draft: {
      label: 'No draft yet',
      classes: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
      icon: <FileText className="w-3 h-3" />,
    },
    draft_ready: {
      label: 'Draft ready',
      classes: 'bg-[#6366F1]/20 text-[#818CF8] border-[#6366F1]/40 light:bg-indigo-50 light:text-indigo-700 light:border-indigo-300',
      icon: <FileText className="w-3 h-3" />,
    },
    overdue: {
      label: 'Overdue',
      classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40 light:bg-amber-50 light:text-amber-700 light:border-amber-300',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    sent: {
      label: 'Follow-up sent',
      classes: 'bg-green-500/20 text-green-300 border-green-500/40 light:bg-green-50 light:text-green-700 light:border-green-300',
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };
  const { label, classes, icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}>
      {icon}
      {label}
    </span>
  );
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Static platform filter chips - hoisted to module scope to avoid re-creation on every render
const PLATFORM_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Meet' },
  { value: 'microsoft_teams', label: 'Teams' },
] as const;

export function MeetingsListView() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatus | 'all'>('all');

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        platform,
        status: 'all',
        ...(search && { search }),
      });
      const res = await fetch(`/api/meetings?${params}`);
      if (res.ok) {
        const data: MeetingsQueryResult = await res.json();
        setMeetings(data.meetings);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setFetchError('Failed to load meetings.');
      }
    } catch (err) {
      console.error('[MEETINGS] Error fetching:', err);
      setFetchError('Unable to connect. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }, [page, platform, search]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Status summary counts
  const statusCounts = useMemo(() => {
    const counts: Record<FollowUpStatus, number> = { failed: 0, processing: 0, no_draft: 0, draft_ready: 0, overdue: 0, sent: 0 };
    for (const m of meetings) {
      counts[getFollowUpStatus(m)]++;
    }
    return counts;
  }, [meetings]);

  // Client-side follow-up filter
  const filteredMeetings = useMemo(() => {
    if (followUpFilter === 'all') return meetings;
    return meetings.filter((m) => getFollowUpStatus(m) === followUpFilter);
  }, [meetings, followUpFilter]);

  return (
    <div className="bg-gray-900/30 light:bg-white border border-gray-700/30 light:border-gray-200 rounded-2xl p-6 shadow-md light:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white light:text-gray-900">Meeting Inbox</h2>
          <p className="text-[#8892B0] light:text-gray-500 text-sm mt-0.5">
            Every meeting captured. Every follow-up tracked.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search meetings\u2026"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search meetings"
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg text-sm text-white light:text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50 focus-visible:border-[#6366F1]/50"
          />
        </div>
      </div>

      {/* Focus Strip — priority tiles */}
      {!loading && meetings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { key: 'overdue' as const, label: 'Overdue', sublabel: 'needs attention', color: '#EF4444', bg: 'bg-red-500/8', border: 'border-red-500/20', hoverBorder: 'hover:border-red-500/40' },
            { key: 'draft_ready' as const, label: 'Ready to Send', sublabel: 'drafts waiting', color: '#F59E0B', bg: 'bg-[#F59E0B]/8', border: 'border-[#F59E0B]/20', hoverBorder: 'hover:border-[#F59E0B]/40' },
            { key: 'sent' as const, label: 'Sent', sublabel: 'follow-ups delivered', color: '#22C55E', bg: 'bg-green-500/8', border: 'border-green-500/20', hoverBorder: 'hover:border-green-500/40' },
            { key: 'processing' as const, label: 'Processing', sublabel: 'in progress', color: '#06B6D4', bg: 'bg-[#06B6D4]/8', border: 'border-[#06B6D4]/20', hoverBorder: 'hover:border-[#06B6D4]/40' },
          ].map((tile) => (
            <button
              key={tile.key}
              onClick={() => setFollowUpFilter(followUpFilter === tile.key ? 'all' : tile.key)}
              className={`rounded-xl ${tile.bg} border ${tile.border} ${tile.hoverBorder} p-3 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 ${
                followUpFilter === tile.key ? 'ring-2 ring-offset-1 ring-offset-[#060B18] light:ring-offset-white' : ''
              }`}
              style={followUpFilter === tile.key ? { ringColor: tile.color } : undefined}
            >
              <p className="text-2xl font-bold tabular-nums" style={{ color: tile.color }}>{statusCounts[tile.key]}</p>
              <p className="text-xs font-medium text-white light:text-gray-900">{tile.label}</p>
              <p className="text-[10px] text-[#8892B0] light:text-gray-500">{tile.sublabel}</p>
            </button>
          ))}
          {followUpFilter !== 'all' && (
            <button
              onClick={() => setFollowUpFilter('all')}
              className="sm:col-span-4 text-xs text-[#8892B0] hover:text-white light:hover:text-gray-900 transition-colors text-center py-1"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Platform filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        {PLATFORM_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => { setPlatform(chip.value); setPage(1); }}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]
              ${platform === chip.value
                ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-sm shadow-[#6366F1]/25 light:bg-[#4F46E5] light:border-[#4F46E5]'
                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300 light:text-gray-500 light:border-gray-300 light:hover:border-gray-400 light:hover:text-gray-700'
              }
            `}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {fetchError}
          </div>
          <button
            onClick={() => fetchMeetings()}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Meetings List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 animate-pulse light:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-700 light:bg-gray-200" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-gray-700 light:bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/3 bg-gray-700 light:bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-2xl light:shadow-sm">
          {meetings.length === 0 ? (
            <>
              <svg className="w-16 h-16 text-gray-600 light:text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No meetings yet</h3>
              <p className="text-gray-400 light:text-gray-500 text-sm max-w-md mx-auto">
                Connect a meeting platform in Settings to start capturing transcripts and generating follow-up emails automatically.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              >
                Connect Platform
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No matches</h3>
              <p className="text-gray-400 light:text-gray-500 text-sm">
                No meetings match the current filter. Try a different selection.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMeetings.map((meeting) => {
            const followUp = getFollowUpStatus(meeting);
            const isOverdue = followUp === 'overdue';
            const isProcessingItem = followUp === 'processing';
            return (
              <Link
                key={meeting.id}
                href={`/dashboard/meetings/${meeting.id}`}
                className={`block rounded-xl p-4 transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                  isOverdue
                    ? 'bg-red-500/5 border border-red-500/15 hover:border-red-500/30 light:bg-red-50/50 light:border-red-200'
                    : isProcessingItem
                      ? 'bg-[#06B6D4]/5 border border-[#06B6D4]/15 hover:border-[#06B6D4]/30 light:bg-teal-50/50 light:border-teal-200 animate-pulse'
                      : 'bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 hover:border-[#6366F1]/30 hover:bg-white/[0.04] light:hover:bg-gray-50 light:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Left: platform + name + time */}
                  <PlatformIcon platform={meeting.platform} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white light:text-gray-900 group-hover:text-[#6366F1] light:group-hover:text-[#4F46E5] transition-colors truncate">
                        {meeting.topic || 'Untitled Meeting'}
                      </h3>
                      <FollowUpBadge status={followUp} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[#8892B0] light:text-gray-500">
                      <span suppressHydrationWarning>{formatDate(meeting.startTime)}</span>
                      {meeting.startTime && <span suppressHydrationWarning>{formatTime(meeting.startTime)}</span>}
                      {meeting.duration && <span>{formatDuration(meeting.duration)}</span>}
                    </div>
                  </div>

                  {/* Center: system output */}
                  <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-[11px]">
                    {meeting.draftCount > 0 && (
                      <span className="flex items-center gap-1 text-[#06B6D4]">
                        <FileText className="w-3 h-3" />
                        {followUp === 'sent' ? 'Follow-up sent' : 'Follow-up ready'}
                      </span>
                    )}
                    {meeting.sentCount > 0 && meeting.sentCount > 1 && (
                      <span className="flex items-center gap-1 text-[#22C55E]">
                        <Send className="w-3 h-3" />
                        {meeting.sentCount} sent
                      </span>
                    )}
                  </div>

                  {/* Right: action hint */}
                  <div className="shrink-0">
                    {followUp === 'draft_ready' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-black" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                        Send
                      </span>
                    )}
                    {followUp === 'overdue' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-black" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                        Review
                      </span>
                    )}
                    {followUp === 'sent' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#8892B0] light:text-gray-500 border border-[#1E2A4A] light:border-gray-200">
                        View
                      </span>
                    )}
                    {followUp === 'processing' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#06B6D4] border border-[#06B6D4]/20">
                        <Clock className="w-3 h-3 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* System hint */}
      {!loading && filteredMeetings.length > 0 && filteredMeetings.length < 10 && (
        <p className="text-center text-[11px] text-[#8892B0]/60 light:text-gray-400 mt-6">
          New meetings will appear here automatically once captured.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400 light:text-gray-500 tabular-nums">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-700 light:border-gray-200 rounded-lg text-gray-300 light:text-gray-600 hover:bg-gray-800 light:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-700 light:border-gray-200 rounded-lg text-gray-300 light:text-gray-600 hover:bg-gray-800 light:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
