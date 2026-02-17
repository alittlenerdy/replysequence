'use client';

import { useState, useEffect } from 'react';

interface MeetingSummaryData {
  meetingId: string;
  topic: string | null;
  summary: string | null;
  keyDecisions: Array<{ decision: string; context?: string }>;
  keyTopics: Array<{ topic: string; duration?: string }>;
  actionItems: Array<{ owner: string; task: string; deadline: string }>;
  summaryGeneratedAt: string | null;
  startTime: string | null;
  duration: number | null;
  platform: string | null;
}

interface MeetingSummaryPanelProps {
  meetingId: string;
}

export function MeetingSummaryPanel({ meetingId }: MeetingSummaryPanelProps) {
  const [data, setData] = useState<MeetingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/summary`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error('[MEETING-SUMMARY] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-700 rounded w-full mb-2" />
        <div className="h-3 bg-gray-700 rounded w-4/5" />
      </div>
    );
  }

  if (!data?.summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-medium text-indigo-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Meeting Summary
        </h3>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Summary Text */}
          <p className="text-gray-200 text-sm leading-relaxed">{data.summary}</p>

          {/* Key Topics */}
          {data.keyTopics.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Topics Discussed</h4>
              <div className="flex flex-wrap gap-2">
                {data.keyTopics.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  >
                    <span>{item.topic}</span>
                    {item.duration && (
                      <span className="text-indigo-400/60">({item.duration})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Decisions */}
          {data.keyDecisions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Decisions Made</h4>
              <ul className="space-y-2">
                {data.keyDecisions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-200">{item.decision}</p>
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
          {data.actionItems.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Action Items</h4>
              <ul className="space-y-2">
                {data.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 mt-0.5 shrink-0 rounded border border-gray-600 flex items-center justify-center">
                      <span className="sr-only">Unchecked</span>
                    </span>
                    <div>
                      <p className="text-sm text-gray-200">
                        <span className="font-medium text-amber-300">{item.owner}</span>
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
      )}
    </div>
  );
}
