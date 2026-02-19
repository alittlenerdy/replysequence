import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Security headers (CSP is handled in middleware with nonce)
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  },
  // Note: Content-Security-Policy is set in middleware.ts with dynamic nonce
];

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Skip type checking and linting during builds (handled by CI separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images - enable modern formats and compression
  images: {
    formats: ['image/avif', 'image/webp'],
    // Minimize image sizes for faster loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Allow images from these domains if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },

  // Experimental performance optimizations
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'framer-motion',  // Re-enabled - test for animation issues
      'posthog-js',
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (except errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap with bundle analyzer (enabled with ANALYZE=true)
export default withBundleAnalyzer(nextConfig);
