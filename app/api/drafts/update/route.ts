import { NextRequest, NextResponse } from 'next/server';
import { updateDraft } from '@/lib/dashboard-queries';

export async function POST(request: NextRequest) {
  try {
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
