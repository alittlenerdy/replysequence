/**
 * Root dashboard loading skeleton - matches the Drafts page layout
 * (title + subtitle, 4-stat cards, table with rows)
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Page header - matches DraftsView header */}
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-700/60 light:bg-gray-200 rounded" />
      </div>

      {/* Stats row - matches 4 DraftStats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gray-700 light:bg-gray-200 rounded-lg" />
              <div className="h-3 w-16 bg-gray-700/60 light:bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-14 bg-gray-700 light:bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-700/40 light:bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Table - matches DraftsView table rows */}
      <div className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-3 border-b border-gray-700/50 light:border-gray-200">
          <div className="flex gap-6">
            <div className="h-3 w-32 bg-gray-700/60 light:bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-700/60 light:bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-700/60 light:bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-700/60 light:bg-gray-200 rounded ml-auto" />
          </div>
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-700/30 light:border-gray-100 last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded mb-2" />
                <div className="h-3 w-32 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-700/50 light:bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
