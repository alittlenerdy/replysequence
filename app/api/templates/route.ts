import { NextRequest, NextResponse } from 'next/server';
import { MEETING_TEMPLATES, getTemplatesForMeetingType } from '@/lib/meeting-templates';
import type { MeetingType } from '@/lib/meeting-type-detector';

/**
 * GET /api/templates
 * Returns available meeting note templates, optionally filtered by meeting type
 */
export async function GET(request: NextRequest) {
  const meetingType = request.nextUrl.searchParams.get('meetingType') as MeetingType | null;

  if (meetingType) {
    const templates = getTemplatesForMeetingType(meetingType);
    return NextResponse.json({ templates });
  }

  return NextResponse.json({ templates: MEETING_TEMPLATES });
}
