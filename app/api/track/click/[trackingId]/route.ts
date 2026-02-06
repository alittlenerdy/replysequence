/**
 * GET /api/track/click/[trackingId]
 * Email link click tracking endpoint
 * Records the click event and redirects to the destination URL
 *
 * Usage: /api/track/click/[trackingId]?url=https://example.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, drafts } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const { searchParams } = new URL(request.url);
  const destinationUrl = searchParams.get('url');

  // Validate destination URL
  if (!destinationUrl) {
    return NextResponse.json(
      { error: 'Missing destination URL' },
      { status: 400 }
    );
  }

  // Decode and validate the URL
  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(destinationUrl);
    // Basic URL validation
    new URL(decodedUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid destination URL' },
      { status: 400 }
    );
  }

  // Record the click asynchronously
  try {
    if (trackingId && trackingId !== 'undefined') {
      await db
        .update(drafts)
        .set({
          clickedAt: sql`COALESCE(${drafts.clickedAt}, NOW())`, // Only set first click
          clickCount: sql`COALESCE(${drafts.clickCount}, 0) + 1`,
        })
        .where(eq(drafts.trackingId, trackingId));

      console.log(`[TRACK-CLICK] Recorded click for tracking ID: ${trackingId}, URL: ${decodedUrl}`);
    }
  } catch (error) {
    // Log but don't fail - still redirect the user
    console.error('[TRACK-CLICK] Error recording click:', error);
  }

  // Redirect to the destination
  return NextResponse.redirect(decodedUrl, 302);
}
