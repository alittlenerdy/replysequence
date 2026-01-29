'use client';

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-gray-700 light:border-gray-200">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="skeleton w-4 h-4 rounded" />
          <div>
            <div className="skeleton h-4 w-32 rounded mb-1" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="skeleton h-4 w-48 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="skeleton h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="skeleton h-4 w-28 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="skeleton h-4 w-16 rounded" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="skeleton h-4 w-10 rounded ml-auto" />
      </td>
    </tr>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-gray-800 light:bg-white rounded-lg shadow-sm border border-gray-700 light:border-gray-200 overflow-hidden">
      {/* Table Header Skeleton */}
      <div className="px-6 py-4 border-b border-gray-700 light:border-gray-200 bg-gray-900 light:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 light:divide-gray-200">
          <thead className="bg-gray-900 light:bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <div className="skeleton h-3 w-16 rounded" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="skeleton h-3 w-14 rounded" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="skeleton h-3 w-12 rounded" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="skeleton h-3 w-16 rounded" />
              </th>
              <th className="px-6 py-3 text-left">
                <div className="skeleton h-3 w-10 rounded" />
              </th>
              <th className="px-6 py-3 text-right">
                <div className="skeleton h-3 w-14 rounded ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 light:bg-white divide-y divide-gray-700 light:divide-gray-200">
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
          </tbody>
        </table>
      </div>
    </div>
  );
}
