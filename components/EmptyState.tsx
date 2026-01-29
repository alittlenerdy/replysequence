'use client';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      {/* Icon */}
      <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No drafts found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            No drafts match your current filters. Try adjusting your search or filters.
          </p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No drafts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Record a Zoom meeting with transcription enabled. ReplySequence will automatically
            generate a follow-up email draft when the transcript is ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://zoom.us/meeting/schedule"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.5 4.5h15c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2zm.5 3v8h8v-8h-8zm10 0v4l3-2v4l-3-2v4h4v-8h-4z"/>
              </svg>
              Schedule a Zoom Meeting
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              View Documentation
            </a>
          </div>
        </>
      )}

      {/* How it works */}
      {!hasFilters && (
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">How it works</h4>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <div className="flex items-start gap-3 text-left max-w-xs">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Record a meeting</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enable cloud recording with audio transcript in Zoom</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left max-w-xs">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">AI analyzes transcript</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Claude extracts key points and action items</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left max-w-xs">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Review and send</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Edit the draft if needed, then send with one click</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
