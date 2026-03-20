'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquareText, ArrowRight, Calendar, X, Clock, CheckCircle2 } from 'lucide-react';

/* ── Types ────────────────────────────────────────── */

interface UnclassifiedReply {
  id: string;
  subject: string;
  body: string;
  sentTo: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  meetingTopic: string | null;
}

interface ClassifiedReply {
  id: string;
  subject: string;
  sentTo: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  replyIntent: string;
  replyIntentConfidence: string | null;
  replyIntentSummary: string | null;
  meetingTopic: string | null;
}

/* ── Intent Config ──────────────────────────────────── */

const INTENT_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  actionLabel: string;
  actionIcon: 'arrow' | 'calendar' | 'x' | 'clock';
}> = {
  interested: {
    label: 'Interested',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    actionLabel: 'Send follow-up',
    actionIcon: 'arrow',
  },
  meeting_requested: {
    label: 'Meeting Requested',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    actionLabel: 'Schedule meeting',
    actionIcon: 'calendar',
  },
  more_info: {
    label: 'More Info',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    actionLabel: 'Send details',
    actionIcon: 'arrow',
  },
  not_now: {
    label: 'Not Now',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    actionLabel: 'Snooze',
    actionIcon: 'clock',
  },
  objection: {
    label: 'Objection',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    actionLabel: 'Address concern',
    actionIcon: 'arrow',
  },
};

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case 'calendar': return <Calendar className="w-3 h-3" />;
    case 'x': return <X className="w-3 h-3" />;
    case 'clock': return <Clock className="w-3 h-3" />;
    default: return <ArrowRight className="w-3 h-3" />;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/* ── Component ─────────────────────────────────────── */

export function ReplyIntelligenceCard() {
  const [unclassified, setUnclassified] = useState<UnclassifiedReply[]>([]);
  const [classified, setClassified] = useState<ClassifiedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchReplies = useCallback(async () => {
    try {
      const res = await fetch('/api/drafts/replies-pending');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUnclassified(data.unclassified || []);
      setClassified(data.classified || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleClassify = async (draftId: string, replyBody: string) => {
    setClassifyingId(draftId);
    try {
      const res = await fetch('/api/drafts/classify-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, replyBody }),
      });

      if (res.ok) {
        // Refresh the data
        await fetchReplies();
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setClassifyingId(null);
    }
  };

  const handleDismiss = (draftId: string) => {
    setDismissedIds((prev) => new Set([...prev, draftId]));
  };

  // Filter out dismissed items
  const visibleUnclassified = unclassified.filter((r) => !dismissedIds.has(r.id));
  const visibleClassified = classified.filter((r) => !dismissedIds.has(r.id));
  const totalVisible = visibleUnclassified.length + visibleClassified.length;

  // Don't render if nothing to show
  if (!loading && !error && totalVisible === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
          <MessageSquareText className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white light:text-gray-900">
            Reply Intelligence
          </h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">
            AI-classified reply intents and suggested actions
          </p>
        </div>
        {totalVisible > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366F1]/15 text-[#6366F1]">
            {totalVisible}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-700/50 light:bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-700/50 light:bg-gray-200 rounded mb-1.5" />
                <div className="h-2.5 w-48 bg-gray-700/50 light:bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-xs text-gray-500 light:text-gray-400 py-2">
          Could not load reply data.
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && totalVisible === 0 && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">All replies handled</p>
            <p className="text-[11px] text-gray-500 light:text-gray-400">No replies needing attention</p>
          </div>
        </div>
      )}

      {!loading && !error && totalVisible > 0 && (
        <div className="space-y-2">
          {/* Unclassified replies — need AI classification */}
          {visibleUnclassified.map((reply) => (
            <div
              key={reply.id}
              className="flex items-start gap-3 py-2.5 px-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-white light:text-gray-900 truncate">
                    {reply.sentTo || 'Unknown recipient'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold shrink-0">
                    Needs classification
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 light:text-gray-500 truncate mt-0.5">
                  Re: {reply.subject}
                </p>
                {reply.repliedAt && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Replied {timeAgo(reply.repliedAt)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <button
                  onClick={() => handleClassify(reply.id, reply.body || '')}
                  disabled={classifyingId === reply.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#6366F1]/15 text-[#6366F1] hover:bg-[#6366F1]/25 disabled:opacity-50 transition-colors"
                >
                  {classifyingId === reply.id ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#6366F1]/30 border-t-[#6366F1] rounded-full animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    'Classify'
                  )}
                </button>
                <button
                  onClick={() => handleDismiss(reply.id)}
                  className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Classified replies — show intent + suggested action */}
          {visibleClassified.map((reply) => {
            const config = INTENT_CONFIG[reply.replyIntent];
            if (!config) return null;

            return (
              <div
                key={reply.id}
                className={`flex items-start gap-3 py-2.5 px-2.5 rounded-lg ${config.bg} border ${config.border}`}
              >
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <MessageSquareText className={`w-3.5 h-3.5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white light:text-gray-900 truncate">
                      {reply.sentTo || 'Unknown recipient'}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${config.color} ${config.bg} border ${config.border} shrink-0`}>
                      {config.label}
                    </span>
                  </div>
                  {reply.replyIntentSummary && (
                    <p className="text-[11px] text-gray-400 light:text-gray-500 mt-0.5 line-clamp-2">
                      {reply.replyIntentSummary}
                    </p>
                  )}
                  {reply.repliedAt && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {timeAgo(reply.repliedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${config.bg} ${config.color} hover:brightness-125 transition-all`}
                  >
                    <ActionIcon type={config.actionIcon} />
                    {config.actionLabel}
                  </button>
                  <button
                    onClick={() => handleDismiss(reply.id)}
                    className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
