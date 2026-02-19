export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      {/* Page title skeleton */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="h-8 w-36 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-700/60 light:bg-gray-200 rounded" />
      </div>

      {/* Tab bar skeleton */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700/50 light:border-gray-200">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-9 rounded-lg ${
                i === 1
                  ? 'bg-gray-700 light:bg-white'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Integration sections skeleton */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Section header */}
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-700/60 light:bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-5 bg-gray-700/40 light:bg-gray-200 rounded" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white rounded-xl p-4 light:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-24 bg-gray-700 light:bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-700/60 light:bg-gray-200 rounded" />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="h-9 w-24 bg-gray-700 light:bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Second section header */}
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-44 bg-gray-700 light:bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-700/60 light:bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-5 bg-gray-700/40 light:bg-gray-200 rounded" />
        </div>

        {/* Second card grid (collapsed - just headers) */}
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 bg-gray-700 light:bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-700/60 light:bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-5 bg-gray-700/40 light:bg-gray-200 rounded" />
        </div>

        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-36 bg-gray-700 light:bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-700/60 light:bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-5 bg-gray-700/40 light:bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
