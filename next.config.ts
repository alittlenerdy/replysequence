import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Wrap with Sentry for error tracking and source map uploads
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload source maps for better stack traces
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enable React component annotations for better error context
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through Next.js to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Source maps configuration
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically instrument server functions
  automaticVercelMonitors: true,
});
