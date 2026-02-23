'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MeetingDetail } from '@/lib/dashboard-queries';
import { DraftQualityBadge } from '@/components/ui/DraftQualityBadge';
import { DraftPreviewModal } from '@/components/DraftPreviewModal';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { label: string; color: string }> = {
    zoom: { label: 'Zoom', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    google_meet: { label: 'Google Meet', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    microsoft_teams: { label: 'Teams', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  };
  const { label, color } = config[platform] || { label: platform, color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${color}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    processing: { label: 'Processing', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    pending: { label: 'Pending', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    ready: { label: 'Ready', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    failed: { label: 'Failed', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  };
  const { label, color } = config[status] || { label: status, color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${color}`}>
      {label}
    </span>
  );
}

function DraftStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string }> = {
    generated: { color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    sent: { color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    failed: { color: 'bg-red-500/15 text-red-400 border-red-500/20' },
    pending: { color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
    generating: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  };
  const { color } = config[status] || { color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${color}`}>
      {status}
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
    year: 'numeric',
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
  if (!minutes) return 'Unknown';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface MeetingDetailViewProps {
  meeting: MeetingDetail;
}

export function MeetingDetailView({ meeting }: MeetingDetailViewProps) {
  const router = useRouter();
  const [selectedDraft, setSelectedDraft] = useState<DraftWithMeeting | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setRegenerateError(null);
    setRegenerateSuccess(false);
    try {
      const res = await fetch('/api/drafts/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      if (res.ok) {
        setRegenerateSuccess(true);
        setTimeout(() => {
          setRegenerateSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setRegenerateError(data.error || 'Failed to regenerate draft. Please try again.');
      }
    } catch {
      setRegenerateError('Unable to connect. Check your internet and try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    setRegenerateError(null);
    setRegenerateSuccess(false);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/reprocess`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRegenerateSuccess(true);
        setTimeout(() => {
          setRegenerateSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        setRegenerateError(data.error || 'Failed to retry processing. Please try again.');
      }
    } catch {
      setRegenerateError('Unable to connect. Check your internet and try again.');
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Meetings
      </Link>

      {/* Meeting Header */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white light:text-gray-900 truncate">
              {meeting.topic || 'Untitled Meeting'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <PlatformBadge platform={meeting.platform} />
              <StatusBadge status={meeting.status} />
              <span className="text-sm text-gray-400 light:text-gray-500" suppressHydrationWarning>
                {formatDate(meeting.startTime)}
                {meeting.startTime && ` at ${formatTime(meeting.startTime)}`}
              </span>
              {meeting.duration && (
                <span className="text-sm text-gray-400 light:text-gray-500">
                  {formatDuration(meeting.duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 light:border-gray-200">
            <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
              Participants ({meeting.participants.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-gray-800 light:bg-gray-100 text-gray-300 light:text-gray-600 border border-gray-700 light:border-gray-200"
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {p.user_name?.[0]?.toUpperCase() || '?'}
                  </span>
                  {p.user_name}
                  {p.email && <span className="text-gray-500 light:text-gray-400">({p.email})</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transcript Info */}
        {meeting.transcript && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 light:border-gray-200">
            <div className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-300 light:text-gray-600">
                Transcript: {meeting.transcript.wordCount?.toLocaleString() || '?'} words
              </span>
              <span className="text-gray-500">via {meeting.transcript.source}</span>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Summary */}
      {meeting.summary && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 light:shadow-sm">
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Meeting Summary
          </h2>
          <p className="text-gray-200 light:text-gray-700 leading-relaxed mb-6">{meeting.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Key Topics */}
            {meeting.keyTopics && meeting.keyTopics.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
                  Topics Discussed
                </h3>
                <div className="space-y-2">
                  {meeting.keyTopics.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/15"
                    >
                      <span className="text-sm text-gray-200 light:text-gray-700">{item.topic}</span>
                      {item.duration && (
                        <span className="text-xs text-indigo-400/60 ml-auto shrink-0">{item.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Decisions */}
            {meeting.keyDecisions && meeting.keyDecisions.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
                  Decisions Made
                </h3>
                <ul className="space-y-2">
                  {meeting.keyDecisions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-200 light:text-gray-700">{item.decision}</p>
                        {item.context && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.context}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {meeting.actionItems && meeting.actionItems.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
                  Action Items
                </h3>
                <ul className="space-y-2">
                  {meeting.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 px-3 py-2 bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/50 light:border-gray-200">
                      <span className="w-4 h-4 mt-0.5 shrink-0 rounded border border-gray-600 light:border-gray-300 flex items-center justify-center" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 light:text-gray-700">
                          <span className="font-medium text-amber-300 light:text-amber-600">{item.owner}</span>
                          {': '}
                          {item.task}
                        </p>
                        {item.deadline && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.deadline}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sentiment Analysis Card */}
      {meeting.transcript && (
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Meeting Sentiment
          </h2>

          {!meeting.sentimentAnalysis ? (
            <p className="text-sm text-gray-500 italic">Sentiment analysis not yet available for this meeting.</p>
          ) : (
            <div className="space-y-4">
              {/* Overall sentiment row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Score badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${
                  meeting.sentimentAnalysis.overall.label === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : meeting.sentimentAnalysis.overall.label === 'negative'
                    ? 'bg-red-500/15 text-red-400 border-red-500/20'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                }`}>
                  {meeting.sentimentAnalysis.overall.label === 'positive' ? '+' : meeting.sentimentAnalysis.overall.label === 'negative' ? '' : ''}
                  {meeting.sentimentAnalysis.overall.score.toFixed(2)}
                  {' '}
                  <span className="capitalize">{meeting.sentimentAnalysis.overall.label}</span>
                </span>

                {/* Trend indicator */}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {meeting.sentimentAnalysis.overall.trend === 'improving' && '\u2197'}
                  {meeting.sentimentAnalysis.overall.trend === 'declining' && '\u2198'}
                  {meeting.sentimentAnalysis.overall.trend === 'stable' && '\u2192'}
                  {' '}{meeting.sentimentAnalysis.overall.trend}
                </span>

                {/* Tone tags */}
                {meeting.sentimentAnalysis.overall.tones.map((tone: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-300 light:text-indigo-600 border border-indigo-500/15"
                  >
                    {tone}
                  </span>
                ))}
              </div>

              {/* Per-speaker breakdown */}
              {meeting.sentimentAnalysis.speakers.length > 0 && (
                <div className="pt-3 border-t border-gray-700/50 light:border-gray-200">
                  <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
                    By Speaker
                  </h3>
                  <div className="space-y-2">
                    {meeting.sentimentAnalysis.speakers.map((speaker: { name: string; score: number; label: string; tones: string[] }, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-300 light:text-gray-600 w-28 truncate">{speaker.name}</span>
                        <div className="flex-1 h-2 bg-gray-700/50 light:bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              speaker.label === 'positive'
                                ? 'bg-emerald-500'
                                : speaker.label === 'negative'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(5, ((speaker.score + 1) / 2) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right capitalize">{speaker.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Processing Status (if not completed) */}
      {meeting.status === 'processing' && meeting.processingLogs && meeting.processingLogs.length > 0 && (
        <div className="bg-gray-900/50 light:bg-white border border-amber-500/30 rounded-2xl p-6 light:shadow-sm">
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Processing...
          </h2>
          {meeting.processingProgress !== null && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progress</span>
                <span>{meeting.processingProgress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                  style={{ width: `${meeting.processingProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="space-y-1">
            {meeting.processingLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-gray-500" suppressHydrationWarning>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span>{log.message}</span>
                {log.duration_ms && <span className="text-gray-600">({log.duration_ms}ms)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed State */}
      {meeting.status === 'failed' && (
        <div className="bg-gray-900/50 light:bg-white border border-red-500/30 rounded-2xl p-6 light:shadow-sm">
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Processing Failed
          </h2>
          {meeting.processingError ? (
            <div className="mb-4">
              <p className="text-sm text-gray-400 light:text-gray-500 mb-2">
                Failed at step: <span className="text-red-400 font-medium">{meeting.processingStep || 'unknown'}</span>
              </p>
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/15">
                <p className="text-sm text-red-300 light:text-red-600 font-mono break-words">
                  {meeting.processingError}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 light:text-gray-500 mb-4">
              Something went wrong while processing this meeting. This can happen if the transcript was unavailable or the recording hasn&apos;t finished uploading.
            </p>
          )}
          <button
            onClick={handleReprocess}
            disabled={isReprocessing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isReprocessing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isReprocessing ? 'Retrying...' : 'Retry Processing'}
          </button>
          {/* Processing logs for debugging */}
          {meeting.processingLogs && meeting.processingLogs.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                Processing log ({meeting.processingLogs.length} steps)
              </summary>
              <div className="mt-2 space-y-1">
                {meeting.processingLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/50 shrink-0" />
                    <span className="text-gray-500" suppressHydrationWarning>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{log.message}</span>
                    {log.duration_ms && <span className="text-gray-600">({log.duration_ms}ms)</span>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Regenerate Feedback */}
      {regenerateError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {regenerateError}
        </div>
      )}
      {regenerateSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Processing retry initiated successfully
        </div>
      )}

      {/* Drafts Section */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white light:text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Drafts ({meeting.drafts.length})
          </h2>
          {(meeting.status === 'completed' || meeting.status === 'ready') && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>

        {meeting.drafts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-600 light:text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 light:text-gray-500 text-sm">No drafts generated yet</p>
            {meeting.status === 'processing' && (
              <p className="text-gray-500 text-xs mt-1">Draft will appear once processing completes</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {meeting.drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => setSelectedDraft(draft)}
                className="w-full text-left p-4 rounded-xl border border-gray-700/50 light:border-gray-200 hover:border-indigo-500/40 hover:bg-gray-800/30 light:hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-white light:text-gray-900 group-hover:text-indigo-400 light:group-hover:text-indigo-600 transition-colors truncate">
                      {draft.subject || 'Untitled Draft'}
                    </h3>
                    <p className="text-xs text-gray-400 light:text-gray-500 mt-1 line-clamp-2">
                      {draft.body?.replace(/\n/g, ' ').slice(0, 150)}...
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <DraftStatusBadge status={draft.status} />
                    {draft.createdAt && (
                      <span className="text-xs text-gray-500" suppressHydrationWarning>
                        {formatDate(draft.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Draft metadata row */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {draft.qualityScore !== null && (
                    <DraftQualityBadge
                      qualityScore={draft.qualityScore}
                      toneScore={draft.toneScore}
                      completenessScore={draft.completenessScore}
                      personalizationScore={draft.personalizationScore}
                      accuracyScore={draft.accuracyScore}
                      gradingNotes={draft.gradingNotes}
                    />
                  )}
                  {draft.sentAt && draft.sentTo && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sent to {draft.sentTo}
                    </span>
                  )}
                  {(draft.openCount ?? 0) > 0 && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Opened {draft.openCount}x
                    </span>
                  )}
                  {draft.repliedAt && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Replied
                    </span>
                  )}
                  {draft.generationDurationMs && (
                    <span className="text-xs text-gray-500">
                      Generated in {(draft.generationDurationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Draft Preview Modal */}
      {selectedDraft && (
        <DraftPreviewModal
          draft={selectedDraft}
          onClose={() => setSelectedDraft(null)}
          onDraftUpdated={() => {
            setSelectedDraft(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
