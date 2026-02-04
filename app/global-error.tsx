'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Application Error
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            Something unexpected happened. Please refresh the page or contact support if the problem persists.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem', fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  )
}
