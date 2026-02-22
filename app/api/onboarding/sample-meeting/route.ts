import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db, meetings, transcripts, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateDraft } from '@/lib/generate-draft';
import { getRandomSampleMeeting, getSampleMeeting } from '@/lib/sample-meetings';

export const maxDuration = 60;

/**
 * POST /api/onboarding/sample-meeting
 * Creates a demo meeting with transcript and generates a real AI draft.
 * Body: { sampleId?: string } - optional specific sample, otherwise random
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get internal user ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a demo meeting (limit to 1 at a time)
    const existingDemo = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.userId, user.id))
      .limit(1);

    const hasDemoAlready = existingDemo.some(async (m) => {
      const full = await db.select({ isDemo: meetings.isDemo }).from(meetings).where(eq(meetings.id, m.id)).limit(1);
      return full[0]?.isDemo;
    });

    // Parse optional sample ID from body
    let sampleId: string | undefined;
    try {
      const body = await request.json();
      sampleId = body.sampleId;
    } catch {
      // No body is fine, we'll pick a random sample
    }

    const sample = sampleId ? getSampleMeeting(sampleId) : getRandomSampleMeeting();
    if (!sample) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const userName = clerkUser?.firstName || 'there';
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || 'user@example.com';

    const now = new Date();
    const meetingStart = new Date(now.getTime() - sample.duration * 60 * 1000);

    // Create demo meeting record
    const [meeting] = await db
      .insert(meetings)
      .values({
        userId: user.id,
        platform: 'zoom',
        zoomMeetingId: `demo-${sample.id}-${Date.now()}`,
        platformMeetingId: `demo-${sample.id}`,
        hostEmail: userEmail,
        topic: sample.topic,
        startTime: meetingStart,
        endTime: now,
        duration: sample.duration,
        participants: sample.attendees.map(user_name => ({ user_name })),
        status: 'completed',
        processingStep: 'completed',
        processingProgress: 100,
        processingCompletedAt: now,
        isDemo: true,
      })
      .returning();

    // Create transcript record
    const [transcript] = await db
      .insert(transcripts)
      .values({
        meetingId: meeting.id,
        platform: 'zoom',
        content: sample.transcript,
        source: 'demo',
        status: 'ready',
        wordCount: sample.transcript.split(/\s+/).length,
      })
      .returning();

    // Generate a real AI draft
    const startTime = Date.now();
    const result = await generateDraft({
      meetingId: meeting.id,
      transcriptId: transcript.id,
      context: {
        meetingTopic: sample.topic,
        meetingDate: 'Today',
        hostName: userName,
        hostEmail: userEmail,
        transcript: sample.transcript,
        senderName: userName,
      },
    });

    const generationTime = (Date.now() - startTime) / 1000;

    if (!result.success) {
      // Mark meeting as failed but keep it
      await db
        .update(meetings)
        .set({ status: 'failed', processingError: result.error })
        .where(eq(meetings.id, meeting.id));

      return NextResponse.json({
        success: false,
        error: result.error || 'Draft generation failed',
        meetingId: meeting.id,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      draftId: result.draftId,
      subject: result.subject,
      generationTime: Math.round(generationTime * 10) / 10,
      meetingTopic: sample.topic,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Sample meeting generation failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
