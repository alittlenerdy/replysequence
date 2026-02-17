import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getMeetingsList } from '@/lib/dashboard-queries';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const platform = searchParams.get('platform') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const result = await getMeetingsList({ page, limit, platform, status, search });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MEETINGS-LIST-ERROR] Failed to fetch meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
