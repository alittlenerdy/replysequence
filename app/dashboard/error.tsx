'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[DASHBOARD-ERROR]',
      message: 'Dashboard error boundary caught error',
      error: error.message,
      digest: error.digest,
    }));
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white light:text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400 light:text-gray-500">
            An error occurred while loading your dashboard. Your data is safe — try refreshing.
          </p>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all shadow-lg shadow-purple-500/20"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-700 light:border-gray-300 text-gray-300 light:text-gray-600 hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
          >
            Reload page
          </a>
        </div>
      </div>
    </div>
  );
}
