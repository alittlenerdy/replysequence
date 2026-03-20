'use client';

import { useEffect, useState, useCallback } from 'react';
import { Database } from 'lucide-react';

/* ── Types ────────────────────────────────────────── */

interface CRMUpdate {
  id: string;
  meetingTopic: string;
  dealStage: string | null;
  closeProbability: number | null;
  crmSynced: boolean;
  hubspot: boolean;
  salesforce: boolean;
  timestamp: string;
}

/* ── Stage Labels ─────────────────────────────────── */

const stageLabels: Record<string, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

/* ── Relative Time ────────────────────────────────── */

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

/* ── Component ─────────────────────────────────────── */

export function CRMPreviewCard() {
  const [updates, setUpdates] = useState<CRMUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/recent-updates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUpdates(data.updates);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Database className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">
            CRM Updates
          </h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">
            Recent auto-populated fields
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700 light:bg-gray-300" />
              <div className="flex-1 h-3 bg-gray-700/50 light:bg-gray-200 rounded" />
              <div className="w-10 h-3 bg-gray-700/50 light:bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-xs text-gray-500 light:text-gray-400 py-2">
          Could not load CRM updates.
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && updates.length === 0 && (
        <p className="text-xs text-gray-500 light:text-gray-400 leading-relaxed py-2">
          No CRM updates yet. Fields will be auto-populated after meetings are processed.
        </p>
      )}

      {/* Updates list */}
      {!loading && !error && updates.length > 0 && (
        <div className="space-y-1">
          {updates.map((update) => {
            const fieldsUpdated: string[] = [];
            if (update.dealStage) fieldsUpdated.push(`Stage: ${stageLabels[update.dealStage] ?? update.dealStage}`);
            if (update.closeProbability !== null) fieldsUpdated.push(`Close: ${update.closeProbability}%`);

            const crmTargets: string[] = [];
            if (update.hubspot) crmTargets.push('HubSpot');
            if (update.salesforce) crmTargets.push('Salesforce');

            return (
              <div
                key={update.id}
                className="flex items-start gap-2.5 py-2 group"
              >
                {/* Sync indicator */}
                <div className="relative mt-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${update.crmSynced ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-zinc-300 light:text-gray-700 truncate">
                    {update.meetingTopic}
                  </p>
                  {fieldsUpdated.length > 0 && (
                    <p className="text-[10px] text-zinc-500 light:text-gray-400 truncate leading-snug">
                      {fieldsUpdated.join(' | ')}
                    </p>
                  )}
                  {crmTargets.length > 0 && (
                    <p className="text-[9px] text-zinc-600 light:text-gray-400/70 mt-0.5">
                      Synced to {crmTargets.join(', ')}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span className="text-[10px] text-zinc-600 light:text-gray-400 tabular-nums shrink-0 mt-0.5">
                  {timeAgo(update.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
