/**
 * Server-side analytics tracking with PostHog
 *
 * Use this for tracking events from API routes, webhooks, and server components.
 * Events are captured with the PostHog Node SDK and flushed immediately
 * (important for serverless environments like Vercel).
 */

import { PostHog } from 'posthog-node'

// Create a NEW client for each request in serverless to avoid stale connections
function createPostHogClient(): PostHog | null {
  // Debug: Log which env vars are available
  const posthogApiKey = process.env.POSTHOG_API_KEY
  const publicPosthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  console.log(JSON.stringify({
    level: 'info',
    message: '[POSTHOG-DEBUG] Checking env vars',
    hasPosthogApiKey: !!posthogApiKey,
    posthogApiKeyLength: posthogApiKey?.length || 0,
    posthogApiKeyPrefix: posthogApiKey?.substring(0, 4) || 'none',
    hasPublicKey: !!publicPosthogKey,
    publicKeyLength: publicPosthogKey?.length || 0,
    publicKeyPrefix: publicPosthogKey?.substring(0, 4) || 'none',
  }))

  // Server-side should use the Project API Key (phc_), NOT Personal API Key (phx_)
  // Prefer NEXT_PUBLIC_POSTHOG_KEY since it's definitely the phc_ key
  const apiKey = publicPosthogKey || posthogApiKey

  if (!apiKey) {
    console.warn('[POSTHOG-INIT] No API key configured - analytics disabled')
    return null
  }

  // Validate key format
  const keyPrefix = apiKey.substring(0, 4)
  if (keyPrefix !== 'phc_') {
    console.warn(JSON.stringify({
      level: 'warn',
      message: '[POSTHOG-INIT] WARNING: Invalid API key format',
      keyPrefix,
      keyLength: apiKey.length,
      expected: 'phc_',
      hint: 'Check Vercel env vars - POSTHOG_API_KEY should be the phc_ key value, not the variable name',
    }))
  }

  // Use the ingestion host (us.i.posthog.com) for server-side
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  console.log(JSON.stringify({
    level: 'info',
    message: '[POSTHOG-INIT] Creating PostHog client',
    keyPrefix,
    keyLength: apiKey.length,
    host,
  }))

  const client = new PostHog(apiKey, {
    host,
    // Critical for serverless: flush immediately
    flushAt: 1,
    flushInterval: 0,
  })

  return client
}

// Event name types for type safety
export type AnalyticsEvent =
  | 'meeting_processed'
  | 'draft_generated'
  | 'email_sent'
  | 'platform_connected'
  | 'user_signed_up'

// Event property types
export interface MeetingProcessedProperties {
  platform: 'zoom' | 'teams' | 'meet'
  meeting_id: string
  transcript_length?: number
  speakers_count?: number
  duration_minutes?: number
}

export interface DraftGeneratedProperties {
  meeting_id: string
  draft_id: string
  generation_time_seconds: number
  cost_dollars: number
  word_count: number
  meeting_type?: string
  quality_score?: number
}

export interface EmailSentProperties {
  draft_id: string
  recipient_count: number
  from_draft: boolean
  crm_logged?: boolean
}

export interface PlatformConnectedProperties {
  platform: 'zoom' | 'teams' | 'meet'
}

export interface UserSignedUpProperties {
  signup_method?: string
}

// Union type for all event properties
type EventProperties =
  | MeetingProcessedProperties
  | DraftGeneratedProperties
  | EmailSentProperties
  | PlatformConnectedProperties
  | UserSignedUpProperties
  | Record<string, string | number | boolean | undefined>

/**
 * Track a server-side analytics event
 *
 * @param userId - Clerk user ID (distinctId)
 * @param event - Event name
 * @param properties - Event properties
 *
 * @example
 * ```ts
 * await trackEvent('user_123', 'meeting_processed', {
 *   platform: 'zoom',
 *   meeting_id: 'meeting_abc',
 *   transcript_length: 5000,
 * })
 * ```
 */
export async function trackEvent(
  userId: string,
  event: AnalyticsEvent,
  properties: EventProperties = {}
): Promise<void> {
  // Create fresh client for each event (serverless best practice)
  const client = createPostHogClient()
  if (!client) return

  const startTime = Date.now()

  try {
    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-1] Calling capture()',
      event,
      distinctId: userId.substring(0, 30),
    }))

    // Capture the event
    client.capture({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        source: 'server-side',
      },
    })

    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-2] Capture queued, calling shutdown()',
      event,
    }))

    // Use shutdown() instead of flush() - more reliable for serverless
    // shutdown() ensures all pending events are sent before returning
    await client.shutdown()

    const durationMs = Date.now() - startTime

    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-3] Shutdown complete - event should be sent',
      event,
      distinctId: userId.substring(0, 30),
      durationMs,
      ...Object.fromEntries(
        Object.entries(properties).filter(([_, v]) => v !== undefined)
      ),
    }))
  } catch (error) {
    const durationMs = Date.now() - startTime

    // Log the actual error
    console.error(JSON.stringify({
      level: 'error',
      message: '[POSTHOG-ERROR] Failed to track event',
      event,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined,
      durationMs,
    }))
  }
}

/**
 * Identify a user with properties (server-side)
 *
 * @param userId - Clerk user ID
 * @param properties - User properties
 */
export async function identifyUser(
  userId: string,
  properties: Record<string, string | number | boolean | undefined> = {}
): Promise<void> {
  const client = createPostHogClient()
  if (!client) return

  try {
    client.identify({
      distinctId: userId,
      properties: {
        ...properties,
        last_seen: new Date().toISOString(),
      },
    })

    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-IDENTIFY] User identified',
      userId: userId.substring(0, 20),
    }))

    await client.shutdown()
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: '[POSTHOG-ERROR] Failed to identify user',
      error: error instanceof Error ? error.message : String(error),
    }))
  }
}
