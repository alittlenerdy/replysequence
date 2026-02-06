/**
 * Email Tracking Utilities
 * Injects tracking pixel and wraps links for open/click tracking
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://replysequence.vercel.app';

/**
 * Generate a tracking pixel image tag
 */
export function getTrackingPixel(trackingId: string): string {
  const pixelUrl = `${BASE_URL}/api/track/open/${trackingId}`;
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
}

/**
 * Wrap a URL with click tracking
 */
export function wrapLinkWithTracking(url: string, trackingId: string): string {
  const encodedUrl = encodeURIComponent(url);
  return `${BASE_URL}/api/track/click/${trackingId}?url=${encodedUrl}`;
}

/**
 * Inject tracking into HTML email content
 * - Adds tracking pixel before closing </body> tag
 * - Wraps all <a href="..."> links with click tracking
 */
export function injectTracking(htmlContent: string, trackingId: string): string {
  let tracked = htmlContent;

  // Wrap all links with click tracking
  // Match <a href="..."> tags and replace the href
  tracked = tracked.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (match, before, url, after) => {
      // Skip mailto:, tel:, and anchor links
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
        return match;
      }
      // Skip if already a tracking URL
      if (url.includes('/api/track/')) {
        return match;
      }
      const trackedUrl = wrapLinkWithTracking(url, trackingId);
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );

  // Add tracking pixel before </body> or at the end
  const pixel = getTrackingPixel(trackingId);
  if (tracked.includes('</body>')) {
    tracked = tracked.replace('</body>', `${pixel}</body>`);
  } else {
    tracked = tracked + pixel;
  }

  return tracked;
}

/**
 * Generate tracking URLs for a draft
 * Useful for preview/debugging
 */
export function getTrackingUrls(trackingId: string) {
  return {
    pixelUrl: `${BASE_URL}/api/track/open/${trackingId}`,
    clickBaseUrl: `${BASE_URL}/api/track/click/${trackingId}`,
  };
}
