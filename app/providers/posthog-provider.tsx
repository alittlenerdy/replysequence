'use client'

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()

  useEffect(() => {
    // Only initialize PostHog in browser and when key is present
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.warn('[POSTHOG] NEXT_PUBLIC_POSTHOG_KEY not configured')
      return
    }

    // Initialize PostHog
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      // Disable in development unless explicitly enabled
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Can be enabled for dev testing
          // posthog.opt_out_capturing()
        }
      },
    })

    console.log('[POSTHOG-INIT] PostHog initialized')
  }, [])

  useEffect(() => {
    // Identify user once Clerk loads
    if (!authLoaded || !userLoaded) return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    if (userId) {
      // Identify with Clerk user ID and optional properties
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        created_at: user?.createdAt?.toISOString(),
      })
      console.log('[POSTHOG-INIT] User identified:', userId)
    } else {
      // Reset identity when logged out
      posthog.reset()
    }
  }, [userId, authLoaded, userLoaded, user])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
