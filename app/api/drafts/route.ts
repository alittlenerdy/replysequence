import { NextRequest, NextResponse } from 'next/server';
import { getDraftsWithMeetings, getDraftStats } from '@/lib/dashboard-queries';
import type { DraftStatus } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = (searchParams.get('status') || 'all') as DraftStatus | 'all';
    const search = searchParams.get('search') || '';
    const dateRange = (searchParams.get('dateRange') || 'all') as 'week' | 'month' | 'all';

    const [draftsResult, stats] = await Promise.all([
      getDraftsWithMeetings({ page, limit, status, search, dateRange }),
      getDraftStats(),
    ]);

    return NextResponse.json({
      ...draftsResult,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
