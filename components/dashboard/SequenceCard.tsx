'use client';

import { useState } from 'react';
import type { SequenceStatus, SequenceStepStatus, SequencePauseReason } from '@/lib/db/schema';

interface SequenceStepData {
  id: string;
  stepNumber: number;
  stepType: string;
  subject: string;
  body: string;
  delayHours: number;
  scheduledAt: string | null;
  status: SequenceStepStatus;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  errorMessage: string | null;
}

interface SequenceData {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  status: SequenceStatus;
  pauseReason: SequencePauseReason | null;
  totalSteps: number;
  completedSteps: number;
  meetingTopic: string | null;
  createdAt: string;
  steps: SequenceStepData[];
}

interface SequenceCardProps {
  sequence: SequenceData;
  isStale?: boolean;
  onStatusChange?: () => void;
}

const STATUS_CONFIG: Record<SequenceStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  paused: { label: 'Paused', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', color: 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/20' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const STEP_STATUS_CONFIG: Record<SequenceStepStatus, { icon: string; color: string }> = {
  pending: { icon: 'clock', color: 'text-gray-400' },
  scheduled: { icon: 'calendar', color: 'text-blue-400' },
  sent: { icon: 'check', color: 'text-emerald-400' },
  paused: { icon: 'pause', color: 'text-amber-400' },
  skipped: { icon: 'skip', color: 'text-gray-500' },
  failed: { icon: 'x', color: 'text-red-400' },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  check_in: '48h Check-in',
  value_nudge: '1-week Value Nudge',
  breakup: '2-week Closing',
};

const PAUSE_REASON_LABELS: Record<string, string> = {
  recipient_replied: 'Recipient replied',
  recipient_opened: 'Recipient opened',
  user_paused: 'Manually paused',
  bounce: 'Email bounced',
  complaint: 'Spam complaint',
};

function StepStatusIcon({ status }: { status: SequenceStepStatus }) {
  const config = STEP_STATUS_CONFIG[status];
  const cls = `w-4 h-4 ${config.color}`;

  switch (config.icon) {
    case 'check':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'x':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'skip':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      );
    case 'pause':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default: // clock
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    // Past
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'today';
    if (absDays === 1) return 'yesterday';
    return `${absDays}d ago`;
  }
  // Future
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays}d`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Optimal send time suggestions per step type
const TIMING_SUGGESTIONS: Record<string, { label: string; tip: string }> = {
  check_in: {
    label: 'Best: Tue-Thu 9-11 AM',
    tip: '48h check-ins get 23% higher open rates mid-week mornings',
  },
  value_nudge: {
    label: 'Best: Mon or Wed 2-4 PM',
    tip: 'Value-add emails perform best early in the week, afternoon',
  },
  breakup: {
    label: 'Best: Tue 10 AM',
    tip: 'Breakup emails get the most replies Tuesday mornings',
  },
};

export function SequenceCard({ sequence, isStale, onStatusChange }: SequenceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [rewritingStep, setRewritingStep] = useState<string | null>(null);
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [showRewriteInput, setShowRewriteInput] = useState<string | null>(null);

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sequences/${sequence.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to ${action} sequence`);
        return;
      }
      onStatusChange?.();
    } catch {
      setError(`Failed to ${action} sequence`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (step: SequenceStepData) => {
    setEditingStep(step.id);
    setEditSubject(step.subject);
    setEditBody(step.body);
    setExpandedStep(step.id);
  };

  const handleSaveEdit = async (stepId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sequences/${sequence.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_step',
          stepId,
          subject: editSubject,
          body: editBody,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save edit');
        return;
      }
      setEditingStep(null);
      onStatusChange?.();
    } catch {
      setError('Failed to save edit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleAll = async () => {
    setIsScheduling(true);
    setError(null);
    try {
      const res = await fetch(`/api/sequences/${sequence.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule_all' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to schedule');
        return;
      }
      onStatusChange?.();
    } catch {
      setError('Failed to schedule');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRewrite = async (stepId: string) => {
    setRewritingStep(stepId);
    setError(null);
    try {
      const res = await fetch(
        `/api/sequences/${sequence.id}/steps/${stepId}/rewrite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructions: rewriteInstructions || undefined,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to rewrite step');
        return;
      }
      setShowRewriteInput(null);
      setRewriteInstructions('');
      onStatusChange?.();
    } catch {
      setError('Failed to rewrite step');
    } finally {
      setRewritingStep(null);
    }
  };

  const hasPendingSteps = sequence.steps.some(s => s.status === 'pending');

  const statusConfig = STATUS_CONFIG[sequence.status];
  const progress = sequence.totalSteps > 0
    ? Math.round((sequence.completedSteps / sequence.totalSteps) * 100)
    : 0;

  return (
    <div className="border border-[#1E2A4A] light:border-gray-200 light:shadow-sm rounded-xl overflow-hidden">
      {/* Header — human-first */}
      <div className="p-4 bg-gray-800/30 light:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white light:text-gray-900 truncate">
              {sequence.recipientName || sequence.recipientEmail}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {isStale && (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/20">
                  Stale
                </span>
              )}
              <span className="text-xs text-[#8892B0] light:text-gray-500">
                {sequence.status === 'active' ? 'Following up after your last call' : sequence.status === 'completed' ? 'Sequence completed' : sequence.status === 'paused' ? 'Sequence paused' : 'Sequence cancelled'}
              </span>
            </div>
            {sequence.recipientName && (
              <p className="text-[11px] text-[#8892B0]/60 light:text-gray-400 mt-0.5">{sequence.recipientEmail}</p>
            )}
            {sequence.pauseReason && (
              <p className="text-xs text-amber-400/80 mt-1">
                {PAUSE_REASON_LABELS[sequence.pauseReason] || sequence.pauseReason}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {sequence.status === 'active' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                Pause
              </button>
            )}
            {sequence.status === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                Resume
              </button>
            )}
            {hasPendingSteps && (sequence.status === 'active' || sequence.status === 'paused') && (
              <button
                onClick={handleScheduleAll}
                disabled={isScheduling || isLoading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#4F46E5]/20 transition-colors disabled:opacity-50"
              >
                {isScheduling ? 'Scheduling...' : 'Schedule All'}
              </button>
            )}
            {(sequence.status === 'active' || sequence.status === 'paused') && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {sequence.totalSteps > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#8892B0] light:text-gray-500 mb-1">
              <span className="font-medium">{sequence.completedSteps} of {sequence.totalSteps} steps sent</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-700/50 light:bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#6366F1] rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Next Step callout */}
        {(() => {
          const nextStep = sequence.steps.find(s => s.status === 'scheduled' || s.status === 'pending');
          if (!nextStep || sequence.status !== 'active') return null;
          const timing = nextStep.scheduledAt ? formatRelativeTime(nextStep.scheduledAt) : `+${nextStep.delayHours}h`;
          return (
            <div className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/25">
              <span className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-wider flex items-center gap-1">→ Next</span>
              <span className="text-sm font-semibold text-white light:text-gray-900">
                {STEP_TYPE_LABELS[nextStep.stepType] || nextStep.subject}
              </span>
              <span className="text-xs text-[#06B6D4] ml-auto font-bold">{timing}</span>
            </div>
          );
        })()}

        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>

      {/* Steps timeline */}
      <div className="divide-y divide-[#1E2A4A]/60 light:divide-gray-100">
        {sequence.steps.map((step) => {
          const isExpanded = expandedStep === step.id;
          const stepConfig = STEP_STATUS_CONFIG[step.status];

          return (
            <div key={step.id}>
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] light:hover:bg-gray-50 transition-colors ${
                  step.status === 'sent' ? 'opacity-40' : step.status === 'scheduled' ? '' : step.status === 'pending' ? 'opacity-60' : ''
                }`}
              >
                {/* Step number circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  step.status === 'sent'
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : step.status === 'failed'
                    ? 'bg-red-500/15 border-red-500/30'
                    : step.status === 'scheduled'
                    ? 'bg-blue-500/15 border-blue-500/30'
                    : 'bg-gray-700/30 border-gray-600/30 light:bg-gray-100 light:border-gray-200'
                }`}>
                  <span className={`text-xs font-bold ${stepConfig.color}`}>
                    {step.stepNumber}
                  </span>
                </div>

                {/* Step info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200 light:text-gray-800">
                      {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                    </span>
                    <StepStatusIcon status={step.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {step.subject}
                  </p>
                </div>

                {/* Timing */}
                <div className="text-right shrink-0">
                  {step.sentAt ? (
                    <span className="text-xs text-gray-400" suppressHydrationWarning>
                      Sent {formatDate(step.sentAt)}
                    </span>
                  ) : step.scheduledAt ? (
                    <span className="text-xs text-gray-500" suppressHydrationWarning>
                      {formatRelativeTime(step.scheduledAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">
                      +{step.delayHours}h
                    </span>
                  )}
                </div>

                {/* Expand chevron */}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 ml-10">
                  {/* Timing suggestion */}
                  {(step.status === 'pending' || step.status === 'scheduled') && TIMING_SUGGESTIONS[step.stepType] && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6366F1]/5 border border-[#6366F1]/10">
                      <svg className="w-3.5 h-3.5 text-[#6366F1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-[#818CF8] light:text-[#4F46E5]">
                        <strong>{TIMING_SUGGESTIONS[step.stepType].label}</strong>
                        <span className="text-gray-500 ml-1.5">{TIMING_SUGGESTIONS[step.stepType].tip}</span>
                      </span>
                    </div>
                  )}

                  {editingStep === step.id ? (
                    /* Inline editor */
                    <div className="rounded-lg bg-gray-800/40 light:bg-gray-50 border border-[#6366F1]/30 p-3 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 light:text-gray-500 block mb-1">Subject</label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800/50 light:bg-white border border-[#1E2A4A] light:border-gray-200 text-gray-200 light:text-gray-800 focus:outline-none focus:border-[#6366F1]/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 light:text-gray-500 block mb-1">Body</label>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800/50 light:bg-white border border-[#1E2A4A] light:border-gray-200 text-gray-200 light:text-gray-800 focus:outline-none focus:border-[#6366F1]/50 resize-y"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(step.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-only view */
                    <div className="rounded-lg bg-gray-800/40 light:bg-gray-50 border border-[#1E2A4A]/60 light:border-gray-200 p-3">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-medium text-gray-400 light:text-gray-500 mb-1">Subject</p>
                        {(step.status === 'pending' || step.status === 'scheduled') && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (showRewriteInput === step.id) {
                                  setShowRewriteInput(null);
                                } else {
                                  setShowRewriteInput(step.id);
                                  setRewriteInstructions('');
                                }
                              }}
                              disabled={rewritingStep === step.id}
                              className="text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {rewritingStep === step.id ? 'Rewriting...' : 'Rewrite with AI'}
                            </button>
                            <button
                              onClick={() => startEditing(step)}
                              className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Rewrite instructions input */}
                      {showRewriteInput === step.id && (
                        <div className="mb-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={rewriteInstructions}
                            onChange={(e) => setRewriteInstructions(e.target.value)}
                            placeholder="Optional: make it shorter, add urgency, etc."
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-gray-800/50 light:bg-white border border-[#1E2A4A] light:border-gray-200 text-gray-200 light:text-gray-800 focus:outline-none focus:border-[#06B6D4]/50 placeholder:text-gray-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRewrite(step.id);
                            }}
                          />
                          <button
                            onClick={() => handleRewrite(step.id)}
                            disabled={rewritingStep === step.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/25 hover:bg-[#06B6D4]/25 transition-colors disabled:opacity-50"
                          >
                            {rewritingStep === step.id ? 'Rewriting...' : 'Rewrite'}
                          </button>
                        </div>
                      )}

                      <p className="text-sm text-gray-200 light:text-gray-800 mb-3">{step.subject}</p>
                      <p className="text-xs font-medium text-gray-400 light:text-gray-500 mb-1">Body</p>
                      <p className="text-sm text-gray-300 light:text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  )}

                  {/* Engagement indicators */}
                  {step.status === 'sent' && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {step.openedAt && (
                        <span className="text-xs text-[#6366F1] flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Opened
                        </span>
                      )}
                      {step.clickedAt && (
                        <span className="text-xs text-[#6366F1] flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Clicked
                        </span>
                      )}
                      {step.repliedAt && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Replied
                        </span>
                      )}
                      {!step.openedAt && !step.clickedAt && !step.repliedAt && (
                        <span className="text-xs text-gray-500">No engagement yet</span>
                      )}
                    </div>
                  )}

                  {step.errorMessage && (
                    <p className="text-xs text-red-400 mt-2">{step.errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-800/20 light:bg-gray-50 border-t border-[#1E2A4A]/60 light:border-gray-200">
        <span className="text-xs text-gray-500" suppressHydrationWarning>
          Created {formatDate(sequence.createdAt)}
        </span>
      </div>
    </div>
  );
}
