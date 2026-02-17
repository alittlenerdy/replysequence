export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-700 light:bg-gray-200 rounded" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 p-5 light:shadow-sm"
          >
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 w-16 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-700 light:bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-gray-900/50 light:bg-white rounded-2xl border border-gray-700/50 light:border-gray-200 p-6 light:shadow-sm">
        <div className="h-10 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-700 light:bg-gray-200 rounded mb-3" />
        ))}
      </div>
    </div>
  );
}
