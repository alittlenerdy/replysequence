'use client';

import { CheckCircle2, FileText, Wand2 } from 'lucide-react';
import type { AtRiskMeeting } from '@/lib/types/analytics';

interface AtRiskMeetingsProps {
  meetings: AtRiskMeeting[];
}

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return '--';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DraftStatusBadge({ status }: { status: AtRiskMeeting['draftStatus'] }) {
  switch (status) {
    case 'generated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 light:bg-amber-50 light:text-amber-600 border border-amber-500/20 light:border-amber-200">
          <FileText className="w-3 h-3" />
          Draft ready
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400 light:bg-red-50 light:text-red-600 border border-red-500/20 light:border-red-200">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700/50 text-gray-400 light:bg-gray-100 light:text-gray-500 border border-gray-600/20 light:border-gray-200">
          No draft
        </span>
      );
  }
}

export function AtRiskMeetings({ meetings }: AtRiskMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <div id="at-risk-meetings" className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 light:shadow-sm">
        <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Meetings Needing Follow-up</h3>
        <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          <span className="text-sm">All meetings followed up. Nice.</span>
        </div>
      </div>
    );
  }

  return (
    <div id="at-risk-meetings" className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 light:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white light:text-gray-900">Meetings Needing Follow-up</h3>
        <span className="text-xs text-gray-500">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {meetings.slice(0, 10).map((m) => (
          <div
            key={m.meetingId}
            className="p-3 rounded-xl bg-gray-800/50 light:bg-gray-50 border border-gray-700/50 light:border-gray-200"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white light:text-gray-900 truncate">
                  {m.topic || 'Untitled Meeting'}
                </p>
                {m.contactName && (
                  <p className="text-xs text-gray-500 truncate">{m.contactName}</p>
                )}
              </div>
              <DraftStatusBadge status={m.draftStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Ended {formatRelativeTime(m.endTime)}</span>
              {m.draftStatus === 'generated' && m.draftId ? (
                <a
                  href={`/dashboard?draft=${m.draftId}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300"
                >
                  <FileText className="w-3 h-3" />
                  Open Draft
                </a>
              ) : (
                <a
                  href={`/dashboard?meeting=${m.meetingId}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300"
                >
                  <Wand2 className="w-3 h-3" />
                  Generate Draft
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-700/50 light:border-gray-200">
              <th className="text-left py-2 pr-4 font-medium">Meeting</th>
              <th className="text-left py-2 pr-4 font-medium">Ended</th>
              <th className="text-left py-2 pr-4 font-medium">Draft Status</th>
              <th className="text-right py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {meetings.slice(0, 10).map((m) => (
              <tr key={m.meetingId} className="border-b border-gray-800/50 light:border-gray-100 last:border-0">
                <td className="py-3 pr-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white light:text-gray-900 truncate max-w-[200px]">
                      {m.topic || 'Untitled Meeting'}
                    </p>
                    {m.contactName && (
                      <p className="text-xs text-gray-500 truncate">{m.contactName}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-400 light:text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(m.endTime)}
                </td>
                <td className="py-3 pr-4">
                  <DraftStatusBadge status={m.draftStatus} />
                </td>
                <td className="py-3 text-right">
                  {m.draftStatus === 'generated' && m.draftId ? (
                    <a
                      href={`/dashboard?draft=${m.draftId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300 whitespace-nowrap"
                    >
                      <FileText className="w-3 h-3" />
                      Open Draft
                    </a>
                  ) : (
                    <a
                      href={`/dashboard?meeting=${m.meetingId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300 whitespace-nowrap"
                    >
                      <Wand2 className="w-3 h-3" />
                      Generate Draft
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meetings.length > 10 && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Showing 10 of {meetings.length} meetings
        </p>
      )}
    </div>
  );
}
