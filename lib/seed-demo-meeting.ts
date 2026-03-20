/**
 * Seeds a demo meeting for new users on their first dashboard load.
 * Uses pre-written draft content to avoid Claude API costs.
 */

import { db, meetings, transcripts, drafts, users, userOnboarding } from './db';
import { eq, and, sql } from 'drizzle-orm';
import { SAMPLE_MEETINGS } from './sample-meetings';

/** Pre-written demo draft to avoid Claude API costs for every new user */
const DEMO_DRAFT_SUBJECT = 'Great connecting — next steps for the Acme Corp pilot';

const DEMO_DRAFT_BODY = `Hi Sarah,

Thanks so much for taking the time to walk through your team's workflow today. It was great meeting you and Mike, and I really appreciated the candor about the challenges your reps are facing with follow-up delays.

Here's a quick summary of what we covered:

- Your team of 12 reps is spending 20-30 minutes per call writing follow-ups, often not sending until the next day
- ReplySequence can generate ready-to-send follow-ups in ~8 seconds after each call
- We'll sync everything to HubSpot automatically — activity logs, deal properties, and custom fields
- Pricing: $39/user/month ($468/mo for 12 reps)

**Next Steps:**

1. **Pilot setup** — I'll send over onboarding links for your 3-4 pilot reps. They can connect their Zoom accounts in about 2 minutes.
2. **14-day trial** — The pilot runs for two weeks so your team can see real results with their own calls.
3. **Check-in** — Let's reconnect after week one to review initial results and answer any questions from the team.

Could you send me the email addresses of the reps who'll be joining the pilot? I'll have everything set up within the hour.

Looking forward to showing your team what's possible.

Best,
`;

const DEMO_ACTION_ITEMS = [
  { owner: 'You', task: 'Send pilot onboarding links to Sarah', deadline: 'Today' },
  { owner: 'Sarah', task: 'Share pilot rep email addresses', deadline: 'This week' },
  { owner: 'You', task: 'Schedule week-one check-in call', deadline: 'Next week' },
];

/**
 * Check if this user needs a demo meeting seeded.
 * Returns true if onboarding is completed and user has zero non-demo meetings.
 */
export async function shouldSeedDemoMeeting(clerkId: string): Promise<{ shouldSeed: boolean; userId: string | null }> {
  // Get the internal user ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) return { shouldSeed: false, userId: null };

  // Check if onboarding is completed
  const [onboarding] = await db
    .select({ completedAt: userOnboarding.completedAt })
    .from(userOnboarding)
    .where(eq(userOnboarding.clerkId, clerkId))
    .limit(1);

  if (!onboarding?.completedAt) return { shouldSeed: false, userId: user.id };

  // Check if user already has any meetings (demo or real)
  const [meetingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(meetings)
    .where(eq(meetings.userId, user.id));

  if (Number(meetingCount?.count || 0) > 0) return { shouldSeed: false, userId: user.id };

  return { shouldSeed: true, userId: user.id };
}

/**
 * Seeds a demo meeting with transcript and pre-written draft for a new user.
 * This is idempotent — it checks for existing demo meetings first.
 */
export async function seedDemoMeeting(userId: string): Promise<{ meetingId: string; draftId: string } | null> {
  // Double-check: does user already have a demo meeting?
  const [existingDemo] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.userId, userId), eq(meetings.isDemo, true)))
    .limit(1);

  if (existingDemo) return null;

  const sample = SAMPLE_MEETINGS[0]; // Use the sales discovery call
  const now = new Date();
  const meetingStart = new Date(now.getTime() - sample.duration * 60 * 1000);

  // Get user's email for the meeting record
  const [user] = await db
    .select({ clerkId: users.clerkId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const hostEmail = 'demo@replysequence.com';

  // Create demo meeting
  const [meeting] = await db
    .insert(meetings)
    .values({
      userId,
      platform: 'zoom',
      zoomMeetingId: `demo-seed-${userId}-${Date.now()}`,
      platformMeetingId: `demo-seed-${sample.id}`,
      hostEmail,
      topic: sample.topic,
      startTime: meetingStart,
      endTime: now,
      duration: sample.duration,
      participants: sample.attendees.map(name => ({ user_name: name })),
      status: 'completed',
      processingStep: 'completed',
      processingProgress: 100,
      processingCompletedAt: now,
      isDemo: true,
      summary: 'Discovery call with Acme Corp to discuss their sales follow-up challenges. Discussed ReplySequence platform capabilities, HubSpot integration, pricing ($39/user/month for 12 reps), and agreed to set up a 14-day pilot with 3-4 reps.',
      keyTopics: [
        { topic: 'Current follow-up workflow challenges', detail: 'Reps spend 20-30 min writing follow-ups, often delayed to next day' },
        { topic: 'ReplySequence capabilities', detail: '8-second follow-ups, CRM sync, automatic sequences' },
        { topic: 'HubSpot integration', detail: 'Activity logs, deal properties, and custom field updates' },
        { topic: 'Pricing and pilot plan', detail: '$39/user/month, 14-day pilot with 3-4 reps' },
      ],
      actionItems: DEMO_ACTION_ITEMS,
    })
    .returning();

  // Create transcript
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

  // Create pre-written draft (no Claude API call)
  const [draft] = await db
    .insert(drafts)
    .values({
      meetingId: meeting.id,
      transcriptId: transcript.id,
      subject: DEMO_DRAFT_SUBJECT,
      body: DEMO_DRAFT_BODY,
      originalBody: DEMO_DRAFT_BODY,
      model: 'pre-written-demo',
      status: 'generated',
      meetingType: 'sales_call',
      toneUsed: 'formal',
      qualityScore: 92,
      toneScore: 90,
      completenessScore: 95,
      personalizationScore: 88,
      accuracyScore: 94,
      actionItems: DEMO_ACTION_ITEMS,
      keyPointsReferenced: [
        'Follow-up delays losing momentum',
        'HubSpot CRM integration',
        '14-day pilot with 3-4 reps',
        '$39/user/month pricing',
      ],
      inputTokens: 0,
      outputTokens: 0,
      costUsd: '0.000000',
      generationDurationMs: 0,
      generationStartedAt: now,
      generationCompletedAt: now,
    })
    .returning();

  return { meetingId: meeting.id, draftId: draft.id };
}
