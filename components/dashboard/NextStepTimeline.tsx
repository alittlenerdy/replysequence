'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  Mail,
  Phone,
  FileText,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { SourceBadge, mapToSourceType } from '@/components/ui/SourceBadge';

interface NextStepItem {
  id: string;
  task: string;
  owner: string;
  ownerType: string;
  type: string;
  urgency: string;
  source: string;
  confidence: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  meetingId: string;
  dealContextId: string | null;
  meetingTopic: string | null;
  meetingDate: string | null;
  companyName: string | null;
}

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  document: FileText,
  internal: Users,
  meeting: Calendar,
};

const URGENCY_COLORS: Record<string, string> = {
  immediate: 'text-red-400 bg-red-400/10 border-red-400/30',
  this_week: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  next_week: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  no_deadline: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const URGENCY_LABELS: Record<string, string> = {
  immediate: 'Urgent',
  this_week: 'This week',
  next_week: 'Next week',
  no_deadline: 'No deadline',
};

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function isOverdue(step: NextStepItem): boolean {
  if (step.status !== 'pending' || !step.dueDate) return false;
  return new Date(step.dueDate) < new Date();
}

interface NextStepTimelineProps {
  compact?: boolean;
}

export function NextStepTimeline({ compact = false }: NextStepTimelineProps) {
  const [steps, setSteps] = useState<NextStepItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [expanded, setExpanded] = useState(!compact);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const fetchSteps = useCallback(async () => {
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const res = await fetch(`/api/next-steps?limit=20${statusParam}`);
      if (!res.ok) return;
      const data = await res.json();
      setSteps(data.steps || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const updateStep = async (id: string, action: 'complete' | 'dismiss' | 'reopen') => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch('/api/next-steps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action }),
      });
      if (res.ok) {
        await fetchSteps();
      }
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Don't render if no steps at all
  if (!loading && steps.length === 0 && filter === 'pending') {
    return null;
  }

  const pendingCount = steps.filter((s) => s.status === 'pending').length;
  const overdueCount = steps.filter(isOverdue).length;

  return (
    <div className={`${compact ? 'rounded-2xl p-4' : 'mb-6'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        <h2 className={`${compact ? 'text-sm' : 'text-xl'} font-bold text-white light:text-gray-900`}>Next Steps</h2>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30">
            {pendingCount} pending
          </span>
        )}
        {overdueCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            {overdueCount} overdue
          </span>
        )}
      </button>

      {expanded && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-3">
            {(['pending', 'completed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setLoading(true); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filter === f
                    ? 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/50'
                    : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-700/50 light:bg-gray-100 light:text-gray-600 light:border-gray-200'
                }`}
              >
                {f === 'pending' ? 'Pending' : f === 'completed' ? 'Done' : 'All'}
              </button>
            ))}
            <span className="text-xs text-gray-500 self-center ml-auto">{total} total</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-800/50 light:bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step) => {
                const TypeIcon = TYPE_ICONS[step.type] || Circle;
                const overdue = isOverdue(step);
                const isUpdating = updatingIds.has(step.id);

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      step.status === 'completed'
                        ? 'bg-gray-900/30 border-gray-700/30 opacity-60 light:bg-gray-50 light:border-gray-200'
                        : overdue
                          ? 'bg-red-950/20 border-red-500/30 light:bg-red-50 light:border-red-200'
                          : 'bg-gray-900/50 border-gray-700/50 light:bg-white light:border-gray-200'
                    }`}
                  >
                    {/* Status icon */}
                    <button
                      disabled={isUpdating}
                      onClick={() =>
                        step.status === 'completed'
                          ? updateStep(step.id, 'reopen')
                          : updateStep(step.id, 'complete')
                      }
                      className="mt-0.5 flex-shrink-0"
                      title={step.status === 'completed' ? 'Reopen' : 'Mark complete'}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : step.status === 'dismissed' ? (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      ) : isUpdating ? (
                        <Circle className="w-5 h-5 text-gray-500 animate-pulse" />
                      ) : (
                        <Circle className={`w-5 h-5 ${overdue ? 'text-red-400' : 'text-gray-500'} hover:text-emerald-400 transition-colors`} />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${step.status === 'completed' ? 'line-through text-gray-500' : 'text-white light:text-gray-900'}`}>
                          {step.task}
                        </span>
                        <SourceBadge source={mapToSourceType(step.source)} compact />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {step.type}
                        </span>
                        <span>{step.owner}</span>
                        {step.companyName && <span>{step.companyName}</span>}
                        {step.meetingTopic && (
                          <span className="truncate max-w-[150px]" title={step.meetingTopic}>
                            {step.meetingTopic}
                          </span>
                        )}
                        <span>{relativeTime(step.createdAt)}</span>
                      </div>
                    </div>

                    {/* Urgency badge + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {step.status === 'pending' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${URGENCY_COLORS[step.urgency] || URGENCY_COLORS.no_deadline}`}>
                          {overdue ? 'Overdue' : URGENCY_LABELS[step.urgency] || step.urgency}
                        </span>
                      )}
                      {step.dueDate && step.status === 'pending' && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(step.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {step.status === 'pending' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStep(step.id, 'dismiss')}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Dismiss"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {step.status === 'dismissed' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStep(step.id, 'reopen')}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Reopen"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
