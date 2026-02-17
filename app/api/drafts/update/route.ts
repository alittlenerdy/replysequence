import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users, meetings, drafts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { updateDraft } from '@/lib/dashboard-queries';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, subject, body: draftBody } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    if (!subject && !draftBody) {
      return NextResponse.json(
        { error: 'Subject or body is required' },
        { status: 400 }
      );
    }

    // Verify draft belongs to the current user
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [draft] = await db
      .select({ id: drafts.id })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(eq(drafts.id, draftId), eq(meetings.userId, dbUser.id)))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const updateData: { subject?: string; body?: string } = {};
    if (subject !== undefined) updateData.subject = subject;
    if (draftBody !== undefined) updateData.body = draftBody;

    await updateDraft(draftId, updateData);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Draft updated',
      draftId,
      hasSubjectUpdate: !!subject,
      hasBodyUpdate: !!draftBody,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}
