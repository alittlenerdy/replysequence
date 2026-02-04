import { NextRequest, NextResponse } from 'next/server'
import { trackError, trackMessage, addBreadcrumb } from '@/lib/error-tracking'

export async function GET(request: NextRequest) {
  const testType = request.nextUrl.searchParams.get('type') || 'thrown'

  // Add breadcrumb for debugging trail
  addBreadcrumb('Test error endpoint called', 'test', { type: testType })

  switch (testType) {
    case 'thrown':
      // Test 1: Unhandled thrown error - should be caught by Sentry automatically
      throw new Error('Test thrown error from API route - this is expected!')

    case 'caught':
      // Test 2: Manually tracked caught error
      try {
        throw new Error('Test caught error - this is expected!')
      } catch (e) {
        trackError(e, {
          tags: { test: 'true', type: 'caught' },
          extra: { endpoint: '/api/test-error', timestamp: new Date().toISOString() },
        })
      }
      return NextResponse.json({ success: true, type: 'caught', message: 'Error tracked via trackError()' })

    case 'warning':
      // Test 3: Warning message
      trackMessage('Test warning message - this is expected!', 'warning', {
        endpoint: '/api/test-error',
        purpose: 'testing Sentry integration',
      })
      return NextResponse.json({ success: true, type: 'warning', message: 'Warning tracked via trackMessage()' })

    case 'info':
      // Test 4: Info message
      trackMessage('Test info message - this is expected!', 'info', {
        endpoint: '/api/test-error',
        purpose: 'testing Sentry integration',
      })
      return NextResponse.json({ success: true, type: 'info', message: 'Info tracked via trackMessage()' })

    default:
      return NextResponse.json({
        error: 'Invalid test type',
        validTypes: ['thrown', 'caught', 'warning', 'info'],
        usage: '/api/test-error?type=thrown',
      }, { status: 400 })
  }
}

// Also support POST for testing from forms
export async function POST(request: NextRequest) {
  return GET(request)
}
