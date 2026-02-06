/**
 * GET /api/track/open/[trackingId]
 * Email open tracking pixel endpoint
 * Returns a 1x1 transparent GIF and records the open event
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, drafts } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

// 1x1 transparent GIF (43 bytes)
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  // Always return the pixel immediately for good UX
  const response = new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });

  // Record the open asynchronously (don't block the response)
  try {
    if (trackingId && trackingId !== 'undefined') {
      // Update the draft with open tracking data
      await db
        .update(drafts)
        .set({
          openedAt: sql`COALESCE(${drafts.openedAt}, NOW())`, // Only set first open
          openCount: sql`COALESCE(${drafts.openCount}, 0) + 1`,
          lastOpenedAt: sql`NOW()`,
        })
        .where(eq(drafts.trackingId, trackingId));

      console.log(`[TRACK-OPEN] Recorded open for tracking ID: ${trackingId}`);
    }
  } catch (error) {
    // Log but don't fail - tracking should never break email viewing
    console.error('[TRACK-OPEN] Error recording open:', error);
  }

  return response;
}
