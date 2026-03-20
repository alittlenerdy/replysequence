'use client';

import { useState, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Edit3, CheckCircle2, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { DraftInlinePanel } from '../DraftInlinePanel';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getConfidenceState(draft: DraftWithMeeting): { label: string; color: string; bg: string } {
  if (draft.status === 'sent') return { label: 'Sent', color: '#22C55E', bg: 'bg-green-500/10' };
  if (draft.status === 'sending') return { label: 'Sending...', color: '#F59E0B', bg: 'bg-amber-500/10' };
  if (draft.status === 'failed') return { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' };
  // For generated drafts, check quality
  return { label: 'Ready to send', color: '#06B6D4', bg: 'bg-[#06B6D4]/10' };
}

const INTENT_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  interested:         { label: 'Interested',         color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  meeting_requested:  { label: 'Meeting Requested',  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  more_info:          { label: 'More Info',           color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  not_now:            { label: 'Not Now',             color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  objection:          { label: 'Objection',           color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  unsubscribe:        { label: 'Unsubscribe',         color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  auto_reply:         { label: 'Auto Reply',          color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  other:              { label: 'Other',               color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
};

function ReplyIntentBadge({ intent }: { intent: string }) {
  const config = INTENT_BADGE_CONFIG[intent];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${config.color} ${config.bg} border ${config.border} shrink-0`}>
      {config.label}
    </span>
  );
}

interface DraftCardStackProps {
  drafts: DraftWithMeeting[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDraftUpdated: () => void;
}

export function DraftCardStack({ drafts, total, page, totalPages, onPageChange, onDraftUpdated }: DraftCardStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="space-y-3">
        {drafts.map((draft) => {
          const isExpanded = expandedId === draft.id;
          const isSent = draft.status === 'sent';
          const isSending = draft.status === 'sending';
          const isLocked = isSent || isSending;
          const confidence = getConfidenceState(draft);
          const bodyPreview = (draft.body || '').replace(/<[^>]*>/g, '').slice(0, 180);

          return (
            <Fragment key={draft.id}>
              <motion.div
                layout
                className={`rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSent
                    ? 'bg-gray-900/30 light:bg-gray-50 border-gray-700/30 light:border-gray-200 opacity-70'
                    : isExpanded
                      ? 'bg-[#0F172A] light:bg-white border-[#06B6D4]/30 light:border-[#06B6D4]/20 shadow-lg shadow-[#06B6D4]/5'
                      : 'bg-[#0F172A] light:bg-white border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : draft.id)}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Left: meeting + recipient + time */}
                  <div className="flex-shrink-0 w-32 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white light:text-gray-900 truncate">
                        {draft.meetingTopic || 'Meeting'}
                      </p>
                      {draft.isDemo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#7A5CFF]/15 text-[#7A5CFF] border border-[#7A5CFF]/20 shrink-0">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8892B0] light:text-gray-500 truncate">
                      {draft.sentTo || draft.meetingHostEmail}
                    </p>
                    <p className="text-[10px] text-[#8892B0]/60 light:text-gray-400" suppressHydrationWarning>
                      {formatDate(draft.createdAt)}
                    </p>
                  </div>

                  {/* Center: subject + preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {draft.subjectVariantB && (
                        <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/20">A</span>
                      )}
                      <p className="text-sm font-semibold text-white light:text-gray-900 truncate">
                        {draft.subject}
                      </p>
                    </div>
                    {draft.subjectVariantB && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">B</span>
                        <p className="text-xs text-[#8892B0] light:text-gray-500 truncate">
                          {draft.subjectVariantB}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-[#8892B0] light:text-gray-500 line-clamp-1">
                      {bodyPreview}
                    </p>
                  </div>

                  {/* Confidence state + reply intent badge */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {draft.replyIntent && (
                      <ReplyIntentBadge intent={draft.replyIntent} />
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidence.bg}`}
                      style={{ color: confidence.color }}
                    >
                      {confidence.label === 'Ready to send' && <CheckCircle2 className="w-3 h-3" />}
                      {confidence.label}
                    </span>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(draft.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-black hover:scale-[1.02] transition-transform"
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                      >
                        <Mail className="w-3 h-3" />
                        Send
                      </button>
                    )}
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(draft.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-medium text-[#8892B0] light:text-gray-500 border border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#8892B0]/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </motion.div>

              {/* Inline expansion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-[#1E2A4A] light:border-gray-200 bg-[#0A1020] light:bg-gray-50 p-4 -mt-1">
                      <DraftInlinePanel
                        draft={draft}
                        meetingIntel={null}
                        meetingIntelLoading={false}
                        onClose={() => setExpandedId(null)}
                        onDraftUpdated={onDraftUpdated}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#8892B0] light:text-gray-500 tabular-nums">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-[#1E2A4A] light:border-gray-200 rounded-lg text-[#8892B0] light:text-gray-600 hover:border-white/20 light:hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-[#1E2A4A] light:border-gray-200 rounded-lg text-[#8892B0] light:text-gray-600 hover:border-white/20 light:hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
