'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[PAGE ERROR]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">
          We&apos;ve been notified and will fix it soon. Your data is safe.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
