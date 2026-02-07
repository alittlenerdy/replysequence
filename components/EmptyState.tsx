'use client';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="dashboard-fade-in bg-gray-800 light:bg-white rounded-lg shadow-sm border border-gray-700 light:border-gray-200 p-12 text-center">
      {/* Animated Icon */}
      <div className="relative mx-auto w-20 h-20 mb-6">
        {/* Pulse rings */}
        <div className="pulse-ring absolute inset-0 text-blue-400 light:text-blue-500" />
        <div className="pulse-ring absolute inset-0 text-blue-400 light:text-blue-500" style={{ animationDelay: '0.5s' }} />
        <div className="pulse-ring absolute inset-0 text-blue-400 light:text-blue-500" style={{ animationDelay: '1s' }} />

        {/* Main icon container */}
        <div className="empty-state-icon relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-400 light:text-gray-500 mb-4 max-w-sm mx-auto">
            No drafts match your current filters. Try adjusting your search or filters.
          </p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-400 light:text-blue-600 bg-blue-900/30 light:bg-blue-50 rounded-lg hover:bg-blue-900/50 light:hover:bg-blue-100 transition-all duration-300 hover:scale-105"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No drafts yet</h3>
          <p className="text-gray-400 light:text-gray-500 mb-6 max-w-md mx-auto">
            Record a meeting with transcription enabled on Zoom, Google Meet, or Teams.
            ReplySequence will automatically generate a follow-up email draft when the transcript is ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/settings"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.5 4.5h15c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2zm.5 3v8h8v-8h-8zm10 0v4l3-2v4l-3-2v4h4v-8h-4z"/>
              </svg>
              Connect a Platform
            </a>
            <a
              href="/#how-it-works"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 transition-all duration-300 hover:scale-105"
            >
              Learn How It Works
            </a>
          </div>
        </>
      )}

      {/* How it works */}
      {!hasFilters && (
        <div className="mt-10 pt-8 border-t border-gray-700 light:border-gray-200">
          <h4 className="text-sm font-medium text-white light:text-gray-900 mb-6">How it works</h4>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {[
              {
                step: 1,
                title: 'Record a meeting',
                desc: 'Enable transcription in Zoom, Meet, or Teams',
                delay: '0.1s',
              },
              {
                step: 2,
                title: 'AI analyzes transcript',
                desc: 'Claude extracts key points and action items',
                delay: '0.2s',
              },
              {
                step: 3,
                title: 'Review and send',
                desc: 'Edit the draft if needed, then send with one click',
                delay: '0.3s',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 text-left max-w-xs opacity-0"
                style={{
                  animation: 'statCardFadeIn 0.4s ease-out forwards',
                  animationDelay: item.delay,
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white light:text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400 light:text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
