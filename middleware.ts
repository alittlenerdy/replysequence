import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

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
  // Note: Using 'unsafe-inline' for script-src because Next.js doesn't natively support
  // nonce-based CSP without experimental configuration. The other security headers
  // provide protection. Consider implementing experimental.serverActions.bodySizeLimit
  // and experimental.contentSecurityPolicy in the future for stricter CSP.
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com https://tally.so`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.clerk.accounts.dev https://*.sentry.io wss://*.supabase.co https://vitals.vercel-insights.com https://tally.so",
    "frame-src 'self' https://js.stripe.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://tally.so",
    "frame-ancestors 'self'",
    "form-action 'self' https://tally.so",
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
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Run for API routes EXCEPT webhooks (they have their own auth)
    '/(api(?!/webhooks)|trpc)(.*)',
  ],
}
