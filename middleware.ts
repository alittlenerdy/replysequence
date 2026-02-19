import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/drafts(.*)',
  '/api/analytics(.*)',
  '/api/billing(.*)',
  '/api/calendar(.*)',
  '/api/meetings(.*)',
  '/api/onboarding(.*)',
  '/api/stripe/create-checkout(.*)',
  '/api/stripe/create-portal(.*)',
])

// Generate a random nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
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
    "frame-src 'self' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.replysequence.com https://accounts.replysequence.com https://challenges.cloudflare.com",
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
    // Skip Next.js internals, static files, and webhook routes
    '/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
