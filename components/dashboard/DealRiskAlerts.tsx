'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  Users,
  Swords,
  KeyRound,
  Target,
  Settings2,
} from 'lucide-react';

interface RiskAlert {
  severity: string;
  category: string;
  description: string;
  dealContextId: string;
  companyName: string;
  companyDomain: string | null;
  dealStage: string | null;
  dealHealthScore: number | null;
  lastMeetingAt: string | null;
}

interface RiskData {
  alerts: RiskAlert[];
  dealCount: number;
  totalRisks: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; Icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', Icon: ShieldAlert },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', Icon: AlertTriangle },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', Icon: Info },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', Icon: ShieldCheck },
};

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  budget: DollarSign,
  timeline: Clock,
  champion: Users,
  competition: Swords,
  authority: KeyRound,
  need: Target,
  process: Settings2,
};

const CATEGORY_LABELS: Record<string, string> = {
  budget: 'Budget',
  timeline: 'Timeline',
  champion: 'Champion',
  competition: 'Competition',
  authority: 'Authority',
  need: 'Need',
  process: 'Process',
};

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function HealthBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 70 ? 'text-emerald-400 bg-emerald-400/10' :
    score >= 40 ? 'text-amber-400 bg-amber-400/10' :
    'text-red-400 bg-red-400/10';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>
      {score}%
    </span>
  );
}

export function DealRiskAlerts() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const fetchRisks = useCallback(async () => {
    try {
      const res = await fetch('/api/deal-risks');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  // Don't render if no risks
  if (!loading && (!data || data.totalRisks === 0)) {
    return null;
  }

  const filteredAlerts = data?.alerts.filter(
    (a) => !severityFilter || a.severity === severityFilter
  ) || [];

  const criticalCount = data?.bySeverity.critical || 0;
  const highCount = data?.bySeverity.high || 0;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        <h2 className="text-xl font-bold text-white light:text-gray-900">Deal Risk Alerts</h2>
        {criticalCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            {highCount} high
          </span>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          {data?.dealCount || 0} deal{(data?.dealCount || 0) !== 1 ? 's' : ''} with risks
        </span>
      </button>

      {expanded && (
        <>
          {/* Severity filter chips */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSeverityFilter(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !severityFilter
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-700/50 light:bg-gray-100 light:text-gray-600 light:border-gray-200'
              }`}
            >
              All ({data?.totalRisks || 0})
            </button>
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
              const count = data?.bySeverity[sev] || 0;
              if (count === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(severityFilter === sev ? null : sev)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    severityFilter === sev
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-700/50 light:bg-gray-100 light:text-gray-600 light:border-gray-200'
                  }`}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/50 light:bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert, idx) => {
                const sevConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
                const SevIcon = sevConfig.Icon;
                const CatIcon = CATEGORY_ICONS[alert.category] || Settings2;

                return (
                  <div
                    key={`${alert.dealContextId}-${idx}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${sevConfig.bg} ${sevConfig.border}`}
                  >
                    {/* Severity icon */}
                    <SevIcon className={`w-5 h-5 ${sevConfig.color} flex-shrink-0 mt-0.5`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white light:text-gray-900">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                        <span className="font-medium text-gray-300 light:text-gray-700">
                          {alert.companyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <CatIcon className="w-3 h-3" />
                          {CATEGORY_LABELS[alert.category] || alert.category}
                        </span>
                        {alert.dealStage && (
                          <span className="capitalize">{alert.dealStage.replace(/_/g, ' ')}</span>
                        )}
                        <HealthBadge score={alert.dealHealthScore} />
                        {alert.lastMeetingAt && (
                          <span>Last meeting: {relativeTime(alert.lastMeetingAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Severity badge */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${sevConfig.color} ${sevConfig.border} ${sevConfig.bg}`}>
                      {alert.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
