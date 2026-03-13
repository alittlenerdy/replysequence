'use client';

interface MeetingSummaryCardProps {
  summary: string;
  keyTopics?: Array<{ topic: string; duration?: string }> | null;
  keyDecisions?: Array<{ decision: string; context?: string }> | null;
  actionItems?: Array<{ owner: string; task: string; deadline: string }> | null;
  compact?: boolean;
}

export function MeetingSummaryCard({
  summary,
  keyTopics,
  keyDecisions,
  actionItems,
  compact = false,
}: MeetingSummaryCardProps) {
  const headingSize = compact ? 'text-sm' : 'text-lg';
  const bodySize = compact ? 'text-xs' : 'text-sm';
  const summarySize = compact ? 'text-sm' : 'text-base';
  const padding = compact ? 'p-4' : 'p-6';
  const sectionGap = compact ? 'gap-4' : 'gap-6';
  const sectionMargin = compact ? 'mb-3' : 'mb-6';
  const gridCols = compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`bg-gradient-to-br from-[#5B6CFF]/10 to-[#5B6CFF]/10 border border-[#5B6CFF]/20 rounded-2xl ${padding} light:shadow-sm`}>
      <h2 className={`${headingSize} font-semibold text-white light:text-gray-900 ${compact ? 'mb-2' : 'mb-4'} flex items-center gap-2`}>
        <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-[#5B6CFF]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Meeting Summary
      </h2>
      <p className={`text-gray-200 light:text-gray-700 leading-relaxed ${sectionMargin} ${summarySize}`}>{summary}</p>

      <div className={`grid ${gridCols} ${sectionGap}`}>
        {/* Key Topics */}
        {keyTopics && keyTopics.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
              Topics Discussed
            </h3>
            <div className="space-y-2">
              {keyTopics.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} bg-[#5B6CFF]/10 rounded-lg border border-[#5B6CFF]/15`}
                >
                  <span className={`${bodySize} text-gray-200 light:text-gray-700`}>{item.topic}</span>
                  {item.duration && (
                    <span className="text-xs text-[#5B6CFF]/60 ml-auto shrink-0">{item.duration}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Decisions */}
        {keyDecisions && keyDecisions.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
              Decisions Made
            </h3>
            <ul className="space-y-2">
              {keyDecisions.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#5B6CFF] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className={`${bodySize} text-gray-200 light:text-gray-700`}>{item.decision}</p>
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
        {actionItems && actionItems.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
              Action Items
            </h3>
            <ul className="space-y-2">
              {actionItems.map((item, i) => (
                <li key={i} className={`flex items-start gap-2 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} bg-gray-800/50 light:bg-gray-50 rounded-lg border border-gray-700/50 light:border-gray-200`}>
                  <span className="w-4 h-4 mt-0.5 shrink-0 rounded border border-gray-600 light:border-gray-300 flex items-center justify-center" />
                  <div className="min-w-0">
                    <p className={`${bodySize} text-gray-200 light:text-gray-700`}>
                      <span className="font-medium text-amber-300 light:text-amber-600">{item.owner}</span>
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
    </div>
  );
}
