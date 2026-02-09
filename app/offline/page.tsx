'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>

        <p className="text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection.
          ReplySequence needs an active connection to generate AI drafts and sync your emails.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        <p className="text-gray-500 text-sm mt-8">
          Your drafts will be saved locally and synced when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
