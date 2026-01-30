/**
 * Server-side analytics tracking with PostHog
 *
 * Use this for tracking events from API routes, webhooks, and server components.
 * Events are captured with the PostHog Node SDK and flushed immediately
 * (important for serverless environments like Vercel).
 */

import { PostHog } from 'posthog-node'

// Lazy initialize PostHog client to avoid issues when env vars are not set
let posthogClient: PostHog | null = null

function getPostHogClient(): PostHog | null {
  if (posthogClient) return posthogClient

  const apiKey = process.env.POSTHOG_API_KEY
  if (!apiKey) {
    console.warn('[ANALYTICS] POSTHOG_API_KEY not configured - analytics disabled')
    return null
  }

  posthogClient = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // Critical for serverless: flush after each event
    flushAt: 1,
    flushInterval: 0,
  })

  return posthogClient
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
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    })

    console.log(JSON.stringify({
      level: 'info',
      message: `[ANALYTICS-${event.toUpperCase()}] Event tracked`,
      userId: userId.substring(0, 20),
      event,
      ...Object.fromEntries(
        Object.entries(properties).filter(([_, v]) => v !== undefined)
      ),
    }))

    // Flush immediately for serverless
    await client.flush()
  } catch (error) {
    // Never let analytics break the app
    console.error(JSON.stringify({
      level: 'error',
      message: '[ANALYTICS-ERROR] Failed to track event',
      event,
      error: error instanceof Error ? error.message : String(error),
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
  const client = getPostHogClient()
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
      message: '[ANALYTICS-IDENTIFY] User identified',
      userId: userId.substring(0, 20),
    }))

    await client.flush()
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: '[ANALYTICS-ERROR] Failed to identify user',
      error: error instanceof Error ? error.message : String(error),
    }))
  }
}

/**
 * Shutdown PostHog client gracefully
 * Call this at the end of long-running processes
 */
export async function shutdownAnalytics(): Promise<void> {
  const client = getPostHogClient()
  if (!client) return

  try {
    await client.shutdown()
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: '[ANALYTICS-ERROR] Failed to shutdown',
      error: error instanceof Error ? error.message : String(error),
    }))
  }
}
