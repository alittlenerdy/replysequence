import * as Sentry from '@sentry/nextjs'

/**
 * Track an error with Sentry and optional context
 * Use this for caught errors that should be monitored
 */
export function trackError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id?: string; email?: string }
    level?: 'fatal' | 'error' | 'warning'
  }
) {
  const errorInstance = error instanceof Error ? error : new Error(String(error))

  console.error('[ERROR]', errorInstance.message, context?.extra || {})

  Sentry.withScope((scope) => {
    // Set tags for filtering in Sentry
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    // Add extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    // Set user context
    if (context?.user) {
      scope.setUser(context.user)
    }

    // Set severity level
    if (context?.level) {
      scope.setLevel(context.level)
    }

    Sentry.captureException(errorInstance)
  })
}

/**
 * Track a message/event that isn't an error
 * Use for important events worth monitoring
 */
export function trackMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
) {
  console.log(`[${level.toUpperCase()}]`, message, context || {})

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }
    Sentry.captureMessage(message, level)
  })
}

/**
 * Set user context for all subsequent error reports
 * Call this after user authenticates
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs show the trail of events leading to an error
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Wrap an async function with error tracking
 * Automatically reports errors with context
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: { operation: string; tags?: Record<string, string> }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      trackError(error, {
        tags: { operation: context.operation, ...context.tags },
        extra: { args: args.length > 0 ? args : undefined },
      })
      throw error
    }
  }) as T
}
