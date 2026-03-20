/**
 * Contacts page loading skeleton - matches ContactsListView layout
 * (title + subtitle, search bar, contact row cards)
 */
export default function ContactsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header - title + subtitle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-44 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="w-full sm:w-80 h-10 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
      </div>

      {/* Contact rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-full shrink-0" />
            {/* Contact info */}
            <div className="flex-1 min-w-0">
              <div className="h-4 w-40 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-3 w-52 bg-gray-700/50 light:bg-gray-100 rounded" />
            </div>
            {/* Company */}
            <div className="h-3 w-28 bg-gray-700/50 light:bg-gray-100 rounded shrink-0" />
            {/* Meeting count */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-4 h-4 bg-gray-700/50 light:bg-gray-200 rounded" />
              <div className="h-3 w-6 bg-gray-700/50 light:bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
