'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, Check, X } from 'lucide-react';

/* ──────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────── */
interface AgentAction {
  id: string;
  agentName: string;
  description: string;
  status: 'success' | 'failed';
  durationMs: number;
  costUsd: string;
  createdAt: string;
}

interface ActionsResponse {
  actions: AgentAction[];
  total: number;
}

/* ──────────────────────────────────────────────
   AGENT NAME LABELS
   ────────────────────────────────────────────── */
const agentLabels: Record<string, string> = {
  'draft-generation': 'Follow-Up Draft',
  'signal-extraction': 'Deal Signals',
  'crm-auto-populate': 'CRM Update',
  'pre-meeting-briefing': 'Pre-Meeting Brief',
  'sentiment-analysis': 'Sentiment Analysis',
  'draft-grading': 'Draft Quality Check',
  'sequence-generation': 'Sequence Builder',
  'transcript-analysis': 'Transcript Analysis',
  'next-steps-extraction': 'Next Steps',
  'meeting-summary': 'Meeting Summary',
};

function getAgentLabel(agentName: string): string {
  return agentLabels[agentName] || agentName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ──────────────────────────────────────────────
   RELATIVE TIME
   ────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

/* ──────────────────────────────────────────────
   FORMAT DURATION
   ────────────────────────────────────────────── */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/* ──────────────────────────────────────────────
   FORMAT COST
   ────────────────────────────────────────────── */
function formatCost(costUsd: string): string | null {
  const val = parseFloat(costUsd);
  if (!val || val === 0) return null;
  if (val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(3)}`;
}

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
export function AIActionsFeed() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-actions?limit=20');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: ActionsResponse = await res.json();
      setActions(data.actions);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">AI Activity</h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">What the AI has been doing</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700 light:bg-gray-300" />
              <div className="flex-1 h-3 bg-gray-700/50 light:bg-gray-200 rounded" />
              <div className="w-10 h-3 bg-gray-700/50 light:bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <p className="text-xs text-gray-500 light:text-gray-400 py-2">
          Could not load AI activity.
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && actions.length === 0 && (
        <p className="text-xs text-gray-500 light:text-gray-400 leading-relaxed py-2">
          No AI activity yet. Actions will appear here as ReplySequence processes your meetings.
        </p>
      )}

      {/* Actions list */}
      {!loading && !error && actions.length > 0 && (
        <div className="space-y-0.5">
          {actions.map((action) => {
            const cost = formatCost(action.costUsd);
            return (
              <div
                key={action.id}
                className="flex items-start gap-2.5 py-1.5 group"
              >
                {/* Status dot */}
                <div className="relative mt-1.5 shrink-0">
                  {action.status === 'success' ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-zinc-300 light:text-gray-700 truncate">
                      {getAgentLabel(action.agentName)}
                    </span>
                    {action.status === 'success' ? (
                      <Check className="w-2.5 h-2.5 text-emerald-500/60 shrink-0" />
                    ) : (
                      <X className="w-2.5 h-2.5 text-red-500/60 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 light:text-gray-400 truncate leading-snug">
                    {action.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end shrink-0 gap-0.5 mt-0.5">
                  <span className="text-[10px] text-zinc-600 light:text-gray-400 tabular-nums">
                    {timeAgo(action.createdAt)}
                  </span>
                  <span className="text-[9px] text-zinc-600/70 light:text-gray-400/70 tabular-nums">
                    {formatDuration(action.durationMs)}
                    {cost && ` / ${cost}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
