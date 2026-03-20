/**
 * Drafts page loading skeleton - matches DraftsListView layout
 * (title + subtitle, filter tabs, draft row cards)
 */
export default function DraftsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header - title + subtitle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-28 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-20 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        <div className="h-9 w-24 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        <div className="h-9 w-20 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        <div className="h-9 w-22 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>

      {/* Draft rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl"
          >
            {/* Status indicator */}
            <div className="w-2 h-2 bg-gray-700 light:bg-gray-200 rounded-full shrink-0" />
            {/* Draft info */}
            <div className="flex-1 min-w-0">
              <div className="h-4 w-64 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-3 w-80 bg-gray-700/50 light:bg-gray-100 rounded" />
            </div>
            {/* Meeting source */}
            <div className="h-3 w-24 bg-gray-700/50 light:bg-gray-100 rounded shrink-0" />
            {/* Status badge */}
            <div className="h-6 w-16 bg-gray-700/50 light:bg-gray-200 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
