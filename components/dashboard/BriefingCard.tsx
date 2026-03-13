'use client';

import { useState } from 'react';
import type { BriefingContent, BriefingStatus } from '@/lib/db/schema';

interface BriefingData {
  id: string;
  meetingTitle: string;
  meetingStartTime: string;
  meetingPlatform: string | null;
  meetingUrl: string | null;
  content: BriefingContent | null;
  status: BriefingStatus;
  viewedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: BriefingStatus }) {
  const styles: Record<BriefingStatus, string> = {
    generating: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    ready: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    sent: 'bg-[#5B6CFF]/15 text-[#5B6CFF] border-[#5B6CFF]/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {status === 'generating' && (
        <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status}
    </span>
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) return `${Math.abs(diffMin)}m ago`;
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `in ${diffHrs}h`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BriefingCard({ briefing }: { briefing: BriefingData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = briefing.content;

  return (
    <div className="rounded-xl border border-gray-700/50 light:border-gray-200 bg-gray-800/30 light:bg-gray-50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 light:hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#5B6CFF]/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#5B6CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-200 light:text-gray-800 truncate">
              {briefing.meetingTitle}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatTime(briefing.meetingStartTime)} ({formatRelative(briefing.meetingStartTime)})
              {briefing.meetingPlatform && (
                <span className="ml-1.5 text-gray-600">
                  {briefing.meetingPlatform === 'google_meet' ? 'Meet' : briefing.meetingPlatform === 'zoom' ? 'Zoom' : 'Teams'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={briefing.status} />
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && content && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700/30 light:border-gray-200">
          {/* Executive Summary */}
          <div className="pt-3">
            <p className="text-sm text-gray-300 light:text-gray-700 leading-relaxed">
              {content.executiveSummary}
            </p>
          </div>

          {/* Attendee Insights */}
          {content.attendeeInsights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
                Attendees
              </h4>
              <div className="flex flex-wrap gap-2">
                {content.attendeeInsights.map((a, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-700/30 light:bg-white border border-gray-700/40 light:border-gray-200"
                  >
                    <span className="text-xs font-medium text-gray-200 light:text-gray-800">{a.name}</span>
                    {a.pastMeetingCount > 0 && (
                      <span className="text-xs text-gray-500 ml-1.5">
                        {a.pastMeetingCount} past meeting{a.pastMeetingCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {a.openActionItems.length > 0 && (
                      <span className="text-xs text-amber-400 ml-1.5">
                        {a.openActionItems.length} open item{a.openActionItems.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Talking Points */}
          {content.talkingPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
                Talking Points
              </h4>
              <ul className="space-y-2">
                {content.talkingPoints.map((tp, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#5B6CFF] text-xs font-bold mt-0.5">{i + 1}.</span>
                    <div>
                      <span className="text-sm text-gray-200 light:text-gray-800 font-medium">{tp.topic}</span>
                      <p className="text-xs text-gray-400 light:text-gray-500 mt-0.5">{tp.context}</p>
                      {tp.suggestedApproach && (
                        <p className="text-xs text-[#7A8BFF] light:text-[#4A5BEE] mt-0.5 italic">{tp.suggestedApproach}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Discovery Questions */}
          {content.discoveryQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-2">
                Questions to Ask
              </h4>
              <ul className="space-y-1.5">
                {content.discoveryQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300 light:text-gray-700">
                    <span className="text-[#5B6CFF] mt-0.5">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Open Action Items */}
          {content.openActionItems.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-2">
                Open Action Items
              </h4>
              <ul className="space-y-1">
                {content.openActionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300 light:text-gray-700">
                    <span className="text-amber-400 mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Flags */}
          {content.riskFlags.length > 0 && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1.5">
                Risk Flags
              </h4>
              <ul className="space-y-1">
                {content.riskFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-red-300 light:text-red-600">{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/30 light:border-gray-200">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {briefing.emailSentAt && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email sent
                </span>
              )}
              {briefing.viewedAt && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Viewed
                </span>
              )}
            </div>
            {briefing.meetingUrl && (
              <a
                href={briefing.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#5B6CFF]/15 text-[#5B6CFF] border border-[#5B6CFF]/20 hover:bg-[#4A5BEE]/25 transition-colors"
              >
                Join Meeting
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Generating state */}
      {isExpanded && briefing.status === 'generating' && (
        <div className="px-4 pb-4 border-t border-gray-700/30 light:border-gray-200">
          <div className="pt-3 flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating briefing...
          </div>
        </div>
      )}

      {/* Failed state */}
      {isExpanded && briefing.status === 'failed' && (
        <div className="px-4 pb-4 border-t border-gray-700/30 light:border-gray-200">
          <div className="pt-3 text-sm text-red-400">
            Failed to generate briefing. It will be retried automatically.
          </div>
        </div>
      )}
    </div>
  );
}
