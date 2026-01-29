'use client';

export function SkeletonCard() {
  return (
    <div className="bg-gray-800 light:bg-white rounded-lg shadow-sm border border-gray-700 light:border-gray-200 p-4">
      <div className="flex items-center gap-3">
        {/* Icon skeleton */}
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="flex-1">
          {/* Number skeleton */}
          <div className="skeleton h-7 w-16 rounded mb-1" />
          {/* Label skeleton */}
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
