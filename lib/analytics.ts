/**
 * Server-side analytics tracking with PostHog
 *
 * Uses captureImmediate() for Vercel serverless - guarantees HTTP request
 * completes before function terminates.
 */

import { PostHog } from 'posthog-node'

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
 * Track a server-side analytics event using captureImmediate()
 *
 * captureImmediate() blocks until the HTTP request to PostHog completes,
 * which is required for Vercel serverless functions.
 *
 * @param userId - Clerk user ID (distinctId)
 * @param event - Event name
 * @param properties - Event properties
 */
export async function trackEvent(
  userId: string,
  event: AnalyticsEvent,
  properties: EventProperties = {}
): Promise<void> {
  // Get API key - prefer NEXT_PUBLIC_POSTHOG_KEY (guaranteed phc_ format)
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY

  if (!apiKey) {
    console.warn('[POSTHOG] No API key configured - skipping event:', event)
    return
  }

  // Validate key format
  if (!apiKey.startsWith('phc_')) {
    console.warn('[POSTHOG] Invalid API key format - should start with phc_')
    return
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  const startTime = Date.now()

  // Create fresh client for each request (serverless best practice)
  const client = new PostHog(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-1] Calling captureImmediate()',
      event,
      distinctId: userId.substring(0, 30),
    }))

    // captureImmediate() blocks until HTTP request completes - required for serverless
    await client.captureImmediate({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        source: 'server-side',
      },
    })

    const durationMs = Date.now() - startTime

    console.log(JSON.stringify({
      level: 'info',
      message: '[POSTHOG-2] Event sent successfully',
      event,
      distinctId: userId.substring(0, 30),
      durationMs,
    }))
  } catch (error) {
    const durationMs = Date.now() - startTime

    console.error(JSON.stringify({
      level: 'error',
      message: '[POSTHOG-ERROR] Failed to send event',
      event,
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    }))
  } finally {
    // Cleanup client
    await client.shutdown().catch(() => {})
  }
}

/**
 * Identify a user with properties (server-side)
 */
export async function identifyUser(
  userId: string,
  properties: Record<string, string | number | boolean | undefined> = {}
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_API_KEY

  if (!apiKey || !apiKey.startsWith('phc_')) {
    return
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  const client = new PostHog(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    client.identify({
      distinctId: userId,
      properties: {
        ...properties,
        last_seen: new Date().toISOString(),
      },
    })

    await client.shutdown()
  } catch (error) {
    console.error('[POSTHOG-ERROR] Failed to identify user:', error)
  }
}
