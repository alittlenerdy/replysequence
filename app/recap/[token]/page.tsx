import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { sharedRecaps, meetings, dealContexts, nextStepsTable } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import type {
  MeetingDecision,
  MeetingTopic,
  ActionItem,
} from '@/lib/db/schema';

interface RecapPageProps {
  params: Promise<{ token: string }>;
}

async function getRecapData(token: string) {
  // Look up the share token
  const [recap] = await db
    .select()
    .from(sharedRecaps)
    .where(eq(sharedRecaps.shareToken, token))
    .limit(1);

  if (!recap) return null;

  // Check expiration
  if (recap.expiresAt && new Date(recap.expiresAt) < new Date()) {
    return null;
  }

  // Increment view count (fire and forget)
  await db
    .update(sharedRecaps)
    .set({ viewCount: sql`${sharedRecaps.viewCount} + 1` })
    .where(eq(sharedRecaps.id, recap.id));

  // Fetch the meeting
  const [meeting] = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      platform: meetings.platform,
      startTime: meetings.startTime,
      duration: meetings.duration,
      summary: meetings.summary,
      keyDecisions: meetings.keyDecisions,
      keyTopics: meetings.keyTopics,
      actionItems: meetings.actionItems,
      dealContextId: meetings.dealContextId,
    })
    .from(meetings)
    .where(eq(meetings.id, recap.meetingId))
    .limit(1);

  if (!meeting) return null;

  // Fetch deal health score if deal context exists
  let dealHealthScore: number | null = null;
  let companyName: string | null = null;
  let dealStage: string | null = null;
  if (meeting.dealContextId) {
    const [dc] = await db
      .select({
        dealHealthScore: dealContexts.dealHealthScore,
        companyName: dealContexts.companyName,
        dealStage: dealContexts.dealStage,
      })
      .from(dealContexts)
      .where(eq(dealContexts.id, meeting.dealContextId))
      .limit(1);
    if (dc) {
      dealHealthScore = dc.dealHealthScore;
      companyName = dc.companyName;
      dealStage = dc.dealStage;
    }
  }

  // Fetch next steps for this meeting
  const nextSteps = await db
    .select({
      task: nextStepsTable.task,
      owner: nextStepsTable.owner,
      dueDate: nextStepsTable.dueDate,
      status: nextStepsTable.status,
      type: nextStepsTable.type,
    })
    .from(nextStepsTable)
    .where(eq(nextStepsTable.meetingId, meeting.id));

  return {
    meeting,
    dealHealthScore,
    companyName,
    dealStage,
    nextSteps,
    viewCount: recap.viewCount + 1,
  };
}

export async function generateMetadata({ params }: RecapPageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getRecapData(token);
  if (!data) {
    return { title: 'Recap Not Found - ReplySequence' };
  }
  return {
    title: `${data.meeting.topic || 'Meeting Recap'} - ReplySequence`,
    description: data.meeting.summary?.slice(0, 160) || 'Shared deal recap from ReplySequence',
  };
}

function formatPlatform(platform: string): string {
  const map: Record<string, string> = {
    zoom: 'Zoom',
    google_meet: 'Google Meet',
    microsoft_teams: 'Microsoft Teams',
  };
  return map[platform] || platform;
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'Unknown date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDueDate(date: Date | string | null): string {
  if (!date) return 'No deadline';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function HealthScoreBadge({ score }: { score: number }) {
  let color = 'bg-gray-100 text-gray-600 border-gray-200';
  let label = 'Unknown';
  if (score >= 80) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Strong';
  } else if (score >= 60) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Healthy';
  } else if (score >= 40) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'At Risk';
  } else {
    color = 'bg-red-50 text-red-700 border-red-200';
    label = 'Critical';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${color}`}>
      <span className="text-lg font-bold">{score}</span>
      <span>/100</span>
      <span className="text-xs font-normal opacity-75">{label}</span>
    </div>
  );
}

export default async function RecapPage({ params }: RecapPageProps) {
  const { token } = await params;
  const data = await getRecapData(token);

  if (!data) {
    notFound();
  }

  const { meeting, dealHealthScore, companyName, dealStage, nextSteps } = data;
  const keyDecisions = meeting.keyDecisions as MeetingDecision[] | null;
  const keyTopics = meeting.keyTopics as MeetingTopic[] | null;
  const actionItems = meeting.actionItems as ActionItem[] | null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">ReplySequence</span>
          </div>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Shared Deal Recap</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Meeting Title Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {meeting.topic || 'Meeting Recap'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
              {formatPlatform(meeting.platform)}
            </span>
            <span>{formatDate(meeting.startTime)}</span>
            {meeting.duration && (
              <>
                <span className="text-gray-300">|</span>
                <span>{formatDuration(meeting.duration)}</span>
              </>
            )}
          </div>

          {/* Deal info row */}
          {(companyName || dealStage || dealHealthScore !== null) && (
            <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-4">
              {companyName && (
                <span className="text-sm font-medium text-gray-700">{companyName}</span>
              )}
              {dealStage && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 capitalize">
                  {dealStage.replace('_', ' ')}
                </span>
              )}
              {dealHealthScore !== null && (
                <HealthScoreBadge score={dealHealthScore} />
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {meeting.summary && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Summary
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {meeting.summary}
            </p>
          </div>
        )}

        {/* Key Topics */}
        {keyTopics && keyTopics.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Key Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {keyTopics.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100"
                >
                  {t.topic}
                  {t.duration && (
                    <span className="ml-1.5 text-indigo-400 text-xs font-normal">({t.duration})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Decisions */}
        {keyDecisions && keyDecisions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Key Decisions
            </h2>
            <ul className="space-y-3">
              {keyDecisions.map((d, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">{d.decision}</p>
                    {d.context && (
                      <p className="text-gray-500 text-sm mt-0.5">{d.context}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {actionItems && actionItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Action Items
            </h2>
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm font-medium">{item.task}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                        {item.owner}
                      </span>
                      {item.deadline && (
                        <span className="text-xs text-gray-500">
                          Due: {item.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps (from next_steps table) */}
        {nextSteps.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Next Steps
            </h2>
            <div className="space-y-3">
              {nextSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-600'
                      : step.status === 'overdue'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {step.task}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                        {step.owner}
                      </span>
                      <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                        {step.type}
                      </span>
                      {step.dueDate && (
                        <span className={`text-xs ${step.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                          Due: {formatDueDate(step.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal Health Score (standalone card if no deal info in header) */}
        {dealHealthScore !== null && !companyName && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Deal Health
            </h2>
            <HealthScoreBadge score={dealHealthScore} />
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-400 mb-3">
            Powered by <span className="font-semibold text-gray-600">ReplySequence</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Turn every meeting into intelligent follow-ups that close deals faster.
          </p>
          <a
            href="https://www.replysequence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Try ReplySequence Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
