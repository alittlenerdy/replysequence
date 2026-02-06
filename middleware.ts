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

// Check if this is a webhook route (before Clerk runs)
function isWebhookRoute(pathname: string): boolean {
  return pathname.startsWith('/api/webhooks')
}

// Main middleware function
async function middleware(req: NextRequest) {
  // IMPORTANT: Skip ALL middleware for webhook routes
  // Webhooks have their own authentication (JWT, HMAC signatures)
  // and should not go through Clerk
  if (isWebhookRoute(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // For all other routes, use Clerk middleware
  return clerkMiddleware(async (auth, request: NextRequest) => {
    if (isProtectedRoute(request)) {
      await auth.protect()
    }

    // Generate nonce for CSP
    const nonce = generateNonce()

    // Build CSP header
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
  })(req, {} as any)
}

export default middleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes (webhook auth is handled inside middleware)
    '/(api|trpc)(.*)',
  ],
}
