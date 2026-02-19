import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | ReplySequence',
  description: 'Track your meeting follow-up performance',
};

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="h-8 w-52 bg-gray-700 light:bg-gray-200 rounded mb-2" />
          <div className="h-4 w-72 bg-gray-700/60 light:bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-800/80 light:bg-gray-100 rounded-lg border border-gray-700 light:border-gray-200 p-0.5">
            {['7d', '14d', '30d', '90d'].map((r) => (
              <div key={r} className="h-8 w-12 bg-gray-700/50 light:bg-gray-200 rounded-md mx-0.5" />
            ))}
          </div>
          <div className="h-9 w-9 bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 rounded-lg" />
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-700 light:bg-gray-200 rounded-xl" />
              <div className="h-3 w-12 bg-gray-700/40 light:bg-gray-100 rounded" />
            </div>
            <div className="h-10 w-20 bg-gray-700 light:bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-700/50 light:bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6">
            <div className="h-5 w-36 bg-gray-700 light:bg-gray-200 rounded mb-4" />
            <div className="h-[180px] bg-gray-800/50 light:bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoadingSkeleton />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
