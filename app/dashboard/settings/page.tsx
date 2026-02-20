import { Suspense } from 'react';
import { SettingsTabs } from '@/components/dashboard/SettingsTabs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | ReplySequence',
  description: 'Manage your integrations, preferences, and account',
};

function SettingsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Page title */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="h-8 w-36 bg-gray-700 light:bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-700/60 light:bg-gray-200 rounded" />
      </div>
      {/* Sticky tab bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700/50 light:border-gray-200">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-9 rounded-lg ${
                i === 1 ? 'bg-indigo-600/20 light:bg-indigo-50' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>
      {/* Hero banner */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="rounded-2xl bg-gray-800/30 light:bg-gray-50 p-6 border border-gray-700/50 light:border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
            <div>
              <div className="h-6 w-48 bg-gray-700 light:bg-gray-200 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-700/60 light:bg-gray-200 rounded" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-700 light:bg-gray-200" />
                <div className="h-3 w-14 bg-gray-700/60 light:bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 bg-gray-700/50 light:bg-gray-200 rounded-full" />
        </div>
      </div>
      {/* Step cards */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white rounded-xl p-5 light:shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-gray-700 light:bg-gray-200" />
                <div className="h-4 w-28 bg-gray-700 light:bg-gray-200 rounded" />
              </div>
              <div className="h-16 bg-gray-800/50 light:bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="border border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white rounded-2xl p-5 h-64 light:shadow-sm" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <div className="max-w-6xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Settings</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Tune ReplySequence to match your tone, stack, and team.</p>
      </div>
      <SettingsTabs />
    </Suspense>
  );
}
