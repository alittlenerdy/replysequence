'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, FileText, Send, Clock } from 'lucide-react';
import type { MeetingListItem, MeetingsQueryResult } from '@/lib/dashboard-queries';

function PlatformIcon({ platform }: { platform: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    zoom: { label: 'Zoom', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    google_meet: { label: 'Meet', color: 'text-green-400', bg: 'bg-green-500/15' },
    microsoft_teams: { label: 'Teams', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  };
  const { label, color, bg } = config[platform] || { label: platform, color: 'text-gray-400', bg: 'bg-gray-500/15' };

  return (
    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <span className={`text-xs font-bold ${color}`}>{label.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    completed: { label: 'Completed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    processing: { label: 'Processing', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    pending: { label: 'Pending', classes: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    ready: { label: 'Ready', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    failed: { label: 'Failed', classes: 'bg-red-500/15 text-red-400 border-red-500/20' },
  };
  const { label, classes } = config[status] || { label: status, classes: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}>
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

export function MeetingsListView() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        platform,
        status,
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
  }, [page, platform, status, search]);

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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-gray-900">Meetings</h2>
          <p className="text-gray-400 light:text-gray-500 text-sm mt-1">
            {total > 0
              ? `${total} meeting${total !== 1 ? 's' : ''} recorded`
              : 'No meetings recorded yet'}
            {total > 0 && (
              <span className="text-gray-500 light:text-gray-400">
                {' '}&middot; each meeting may generate multiple drafts
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg text-sm text-white light:text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={platform}
          onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
          className="bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 text-sm text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Platforms</option>
          <option value="zoom">Zoom</option>
          <option value="google_meet">Google Meet</option>
          <option value="microsoft_teams">Microsoft Teams</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 text-sm text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Error State */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {fetchError}
          </div>
          <button
            onClick={() => fetchMeetings()}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
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
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-2xl light:shadow-sm">
          <svg className="w-16 h-16 text-gray-600 light:text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No meetings yet</h3>
          <p className="text-gray-400 light:text-gray-500 text-sm max-w-md mx-auto">
            Connect a meeting platform in Settings to start capturing transcripts and generating follow-up emails automatically.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Connect Platform
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/dashboard/meetings/${meeting.id}`}
              className="block bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl p-5 hover:border-blue-500/40 hover:bg-gray-800/30 light:hover:bg-gray-50 transition-all group light:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <PlatformIcon platform={meeting.platform} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white light:text-gray-900 group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors truncate">
                      {meeting.topic || 'Untitled Meeting'}
                    </h3>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400 light:text-gray-500">
                    <span>{formatDate(meeting.startTime)}</span>
                    {meeting.startTime && (
                      <span>{formatTime(meeting.startTime)}</span>
                    )}
                    {meeting.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(meeting.duration)}
                      </span>
                    )}
                    {meeting.hasSummary && (
                      <span className="text-indigo-400">Summary available</span>
                    )}
                  </div>
                </div>

                {/* Draft stats */}
                <div className="shrink-0 flex items-center gap-3 text-xs">
                  {meeting.draftCount > 0 && (
                    <span className="flex items-center gap-1 text-gray-400 light:text-gray-500">
                      <FileText className="w-3.5 h-3.5" />
                      {meeting.draftCount} draft{meeting.draftCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {meeting.sentCount > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Send className="w-3.5 h-3.5" />
                      {meeting.sentCount} sent
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400 light:text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-700 light:border-gray-200 rounded-lg text-gray-300 light:text-gray-600 hover:bg-gray-800 light:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-700 light:border-gray-200 rounded-lg text-gray-300 light:text-gray-600 hover:bg-gray-800 light:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
