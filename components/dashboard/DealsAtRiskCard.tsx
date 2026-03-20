'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/* ── Types ────────────────────────────────────────── */

interface AtRiskDeal {
  dealContextId: string;
  companyName: string;
  healthScore: number;
  healthLabel: string;
  lastMeetingDate: string | null;
  topRiskSignal: string | null;
  dealStage: string | null;
}

/* ── Health Score Colors ──────────────────────────── */

function healthColor(score: number): string {
  if (score <= 20) return 'text-red-500';
  if (score <= 40) return 'text-orange-400';
  if (score <= 60) return 'text-yellow-400';
  if (score <= 80) return 'text-green-400';
  return 'text-emerald-400';
}

function healthBgColor(score: number): string {
  if (score <= 20) return 'bg-red-500/10';
  if (score <= 40) return 'bg-orange-400/10';
  return 'bg-yellow-400/10';
}

/* ── Relative Time ─────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ── Component ─────────────────────────────────────── */

export function DealsAtRiskCard() {
  const [deals, setDeals] = useState<AtRiskDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch('/api/deals/at-risk');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDeals(data.deals);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">
            Deals at Risk
          </h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400">
            Health score below 40
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-700/50 light:bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-700/50 light:bg-gray-200 rounded mb-1.5" />
                <div className="h-2.5 w-40 bg-gray-700/50 light:bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-xs text-gray-500 light:text-gray-400 py-2">
          Could not load deal health data.
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && deals.length === 0 && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">All deals looking healthy</p>
            <p className="text-[11px] text-gray-500 light:text-gray-400">No deals below the risk threshold</p>
          </div>
        </div>
      )}

      {/* Deals list */}
      {!loading && !error && deals.length > 0 && (
        <>
          {/* Headline */}
          <div className="mb-3">
            <p className="text-lg font-bold text-white light:text-gray-900 tabular-nums">
              {deals.length} {deals.length === 1 ? 'Deal Needs' : 'Deals Need'} Attention
            </p>
          </div>

          <div className="space-y-2.5">
            {deals.map((deal) => (
              <div
                key={deal.dealContextId}
                className="flex items-start gap-3 py-2 px-2.5 rounded-lg hover:bg-gray-800/40 light:hover:bg-gray-50 transition-colors"
              >
                {/* Health score badge */}
                <div className={`w-9 h-9 rounded-lg ${healthBgColor(deal.healthScore)} flex items-center justify-center shrink-0`}>
                  <span className={`text-sm font-bold tabular-nums ${healthColor(deal.healthScore)}`}>
                    {deal.healthScore}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white light:text-gray-900 truncate">
                      {deal.companyName}
                    </span>
                    {deal.dealStage && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-500 uppercase tracking-wider shrink-0">
                        {deal.dealStage.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {deal.topRiskSignal && (
                    <p className="text-[11px] text-gray-400 light:text-gray-500 truncate mt-0.5 leading-snug">
                      {deal.topRiskSignal}
                    </p>
                  )}
                </div>

                {/* Last meeting */}
                {deal.lastMeetingDate && (
                  <span className="text-[10px] text-gray-500 light:text-gray-400 tabular-nums shrink-0 mt-1">
                    {timeAgo(deal.lastMeetingDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
