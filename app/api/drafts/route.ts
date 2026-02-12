import { NextRequest, NextResponse } from 'next/server';
import { getDraftsWithMeetings, getDraftStats } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

// Allow longer timeout for cold starts
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(clientId, RATE_LIMITS.API);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = (searchParams.get('status') || 'all') as DraftStatus | 'all';
    const search = searchParams.get('search') || '';
    const dateRange = (searchParams.get('dateRange') || 'all') as 'week' | 'month' | 'all';

    console.log('[DASHBOARD-1] Fetching drafts API, filters:', { page, status, search, dateRange });

    const [draftsResult, stats] = await Promise.all([
      getDraftsWithMeetings({ page, limit, status, search, dateRange }),
      getDraftStats(),
    ]);

    console.log('[DASHBOARD-2] Drafts loaded, count:', draftsResult.drafts.length);

    return NextResponse.json(
      {
        ...draftsResult,
        stats,
      },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('[DASHBOARD-ERROR] Failed to fetch drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
