/**
 * Analytics page loading skeleton - matches AnalyticsDashboard layout
 * (header + date selector, 4 stat cards, 2 chart cards, 2 breakdown cards)
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header row - title + date range selector + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-8 w-52 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-72 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          {/* Date range pills */}
          <div className="flex items-center bg-gray-800/80 light:bg-gray-100 rounded-lg border border-gray-700 light:border-gray-200 p-0.5">
            {['7d', '14d', '30d', '90d'].map((r) => (
              <div key={r} className="h-8 w-12 bg-gray-700/50 light:bg-gray-200 rounded-md mx-0.5" />
            ))}
          </div>
          {/* Refresh button */}
          <div className="h-9 w-9 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Hero stat cards - 4 column grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl" />
              <div className="h-3 w-12 bg-gray-700/40 light:bg-gray-100 rounded" />
            </div>
            <div className="h-10 w-20 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700/50 light:bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Charts row - 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6"
          >
            <div className="h-5 w-36 bg-gray-700 light:bg-gray-200 rounded mb-4" />
            <div className="h-[180px] bg-gray-800/50 light:bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>

      {/* ROI + Engagement row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI Calculator skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-28 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-100 rounded mb-2" />
                <div className="h-7 w-16 bg-gray-700 light:bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Email Engagement skeleton */}
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
          <div className="h-5 w-36 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <div className="h-3 w-16 bg-gray-700/50 light:bg-gray-100 rounded" />
                  <div className="h-3 w-10 bg-gray-700/50 light:bg-gray-100 rounded" />
                </div>
                <div className="h-2 w-full bg-gray-800 light:bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform + Meeting Type row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6"
          >
            <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-4" />
            <div className="h-[160px] bg-gray-800/50 light:bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
