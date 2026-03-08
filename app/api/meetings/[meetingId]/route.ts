import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMeetingDetail } from '@/lib/dashboard-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;
  const meeting = await getMeetingDetail(meetingId);

  if (!meeting) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Return only the meeting intelligence fields needed for inline display
  return NextResponse.json({
    id: meeting.id,
    topic: meeting.topic,
    platform: meeting.platform,
    startTime: meeting.startTime,
    summary: meeting.summary,
    keyTopics: meeting.keyTopics,
    keyDecisions: meeting.keyDecisions,
    actionItems: meeting.actionItems,
  });
}
