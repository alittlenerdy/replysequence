/**
 * Sequences page loading skeleton - matches SequencesListView layout
 * (title + subtitle, sequence card grid)
 */
export default function SequencesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header - title + subtitle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-36 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-56 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
      </div>

      {/* Sequence cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl"
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-48 bg-gray-700 light:bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-700/50 light:bg-gray-200 rounded-full" />
            </div>
            {/* Card description */}
            <div className="h-3 w-72 bg-gray-700/50 light:bg-gray-100 rounded mb-4" />
            {/* Card stats row */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded" />
                <div className="h-3 w-12 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-700/50 light:bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
