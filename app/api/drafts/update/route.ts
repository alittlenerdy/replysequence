import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users, meetings, drafts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { updateDraft } from '@/lib/dashboard-queries';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

const updateDraftSchema = z.object({
  draftId: z.string().uuid(),
  subject: z.string().optional(),
  body: z.string().optional(),
}).refine(data => data.subject !== undefined || data.body !== undefined, {
  message: 'Subject or body is required',
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, updateDraftSchema);
    if ('error' in parsed) return parsed.error;
    const { draftId, subject, body: draftBody } = parsed.data;

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
