import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/waitlist/gate',
  '/api/drafts(.*)',
  '/api/analytics(.*)',
  '/api/billing(.*)',
  '/api/calendar(.*)',
  '/api/meetings(.*)',
  '/api/onboarding(.*)',
  '/api/stripe/create-checkout(.*)',
  '/api/stripe/create-portal(.*)',
])

// Routes that require the waitlist gate check (redirect unadmitted users)
const isWaitlistGatedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
])

// Routes that unadmitted users CAN access (waitlist gate page, admit check, auth callbacks)
const isWaitlistExemptRoute = createRouteMatcher([
  '/waitlist/gate',
  '/api/waitlist(.*)',
  '/api/auth(.*)',
  '/api/onboarding/progress',
])

// Generate a random nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// Skip middleware for OG image routes (social media crawlers need clean responses)
const isOgImageRoute = createRouteMatcher([
  '/opengraph-image',
  '/twitter-image',
  '/blog/:slug/opengraph-image',
  '/blog/:slug/twitter-image',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Let OG image routes pass through without CSP/security headers
  if (isOgImageRoute(req)) {
    return NextResponse.next()
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Waitlist gate: redirect unadmitted authenticated users to /waitlist/gate
  // Uses Clerk publicMetadata (set when user is admitted) to avoid DB queries in middleware.
  // publicMetadata is included in the session JWT as `metadata` by default in Clerk v5+.
  if (isWaitlistGatedRoute(req) && !isWaitlistExemptRoute(req)) {
    const session = await auth()
    if (session.userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const publicMetadata = (session.sessionClaims as any)?.metadata as Record<string, unknown> | undefined
      const isAdmitted = publicMetadata?.admitted === true
      if (!isAdmitted) {
        const url = new URL('/waitlist/gate', req.url)
        return NextResponse.redirect(url)
      }
    }
  }

  // Generate nonce for CSP
  const nonce = generateNonce()

  // Build CSP header
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.replysequence.com https://challenges.cloudflare.com https://va.vercel-scripts.com https://us-assets.i.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://clerk.replysequence.com https://accounts.replysequence.com https://*.clerk.services wss://*.supabase.co https://vitals.vercel-insights.com https://us.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com",
    "frame-src 'self' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.replysequence.com https://accounts.replysequence.com https://challenges.cloudflare.com https://demo.arcade.software",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  // Get the response
  const response = NextResponse.next()

  // Set CSP header with nonce
  response.headers.set('Content-Security-Policy', cspDirectives)

  // Pass nonce to the page via header (for use in Script components)
  response.headers.set('x-nonce', nonce)

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, webhook routes, and cron routes
    '/((?!_next|api/webhooks|api/cron|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
