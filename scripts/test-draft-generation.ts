/**
 * Test Draft Generation End-to-End
 *
 * Tests the complete draft generation pipeline.
 * Creates test data if needed, then runs the generation.
 *
 * Usage: npx tsx scripts/test-draft-generation.ts
 */

// Load environment FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Verify environment loaded
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env.local');
  process.exit(1);
}
console.log('Environment loaded successfully');

// Sample VTT transcript content for testing
const SAMPLE_TRANSCRIPT = `Jimmy Hackett: Good morning Sarah, thanks for joining the call today. We're excited to discuss how ReplySequence can help automate your team's follow-up emails.

Sarah Chen: Hi Jimmy! Yes, I've been looking for a solution like this. Our sales team spends hours writing follow-up emails after every meeting.

Jimmy Hackett: That's exactly the problem we solve. Our platform automatically generates professional follow-up emails within minutes of your meeting ending. The AI analyzes the transcript and pulls out key discussion points, action items, and next steps.

Sarah Chen: That sounds amazing. How accurate are the generated emails?

Jimmy Hackett: Our users report over 90% accuracy on first drafts. Most emails need minimal editing before sending. We also integrate with your CRM so all activities are logged automatically.

Sarah Chen: We use HubSpot for our CRM. Do you support that?

Jimmy Hackett: Absolutely, HubSpot is one of our core integrations. We also support Salesforce, Pipedrive, and Airtable. The integration logs the meeting, the transcript, and links the draft email to the contact record.

Sarah Chen: Perfect. What about pricing? We have a team of 12 sales reps.

Jimmy Hackett: For a team that size, our Growth plan would be ideal at $49 per user per month. That includes unlimited meetings, all CRM integrations, and priority support. We also offer a 14-day free trial so you can test it with your team.

Sarah Chen: That's reasonable. Can we set up a trial starting next week?

Jimmy Hackett: Absolutely! I'll send you the trial setup link right after this call. I'll also include some onboarding resources and schedule a check-in call for next Thursday to see how things are going.

Sarah Chen: Sounds great. Looking forward to it!

Jimmy Hackett: Perfect. Thanks again Sarah. Talk to you next week!`;

/**
 * Structured logging helper
 */
function log(tag: string, message: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    tag,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

/**
 * Main test function
 */
async function testDraftGeneration() {
  const overallStart = Date.now();

  console.log('\n========================================');
  console.log('DRAFT GENERATION END-TO-END TEST');
  console.log('========================================\n');

  // Dynamic imports after env is loaded
  const { db, transcripts, meetings, drafts } = await import('../lib/db');
  const { eq, desc } = await import('drizzle-orm');
  const { generateDraft } = await import('../lib/generate-draft');

  try {
    // Check for existing transcripts
    const existingTranscripts = await db
      .select()
      .from(transcripts)
      .orderBy(desc(transcripts.createdAt))
      .limit(1);

    let transcript: typeof existingTranscripts[0];
    let meeting: any;

    if (existingTranscripts.length > 0 && existingTranscripts[0].content && existingTranscripts[0].content.length > 100) {
      // Use existing transcript
      transcript = existingTranscripts[0];
      log('[DRAFT-1]', 'Using existing transcript', {
        transcriptId: transcript.id,
        contentLength: transcript.content?.length || 0,
      });

      // Get associated meeting
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, transcript.meetingId))
        .limit(1);

      if (!existingMeeting) {
        throw new Error('Meeting not found for existing transcript');
      }
      meeting = existingMeeting;

    } else {
      // Create test data
      log('[DRAFT-1]', 'No existing transcripts with content, creating test data');

      // Create test meeting
      const [newMeeting] = await db
        .insert(meetings)
        .values({
          zoomMeetingId: `test-meeting-${Date.now()}`,
          platformMeetingId: `test-meeting-${Date.now()}`,
          hostEmail: 'jimmy@replysequence.com',
          topic: 'ReplySequence Product Demo - Sarah Chen',
          startTime: new Date(),
          duration: 15,
          platform: 'zoom',
          status: 'ready',
        })
        .returning();

      log('[DRAFT-1]', 'Test meeting created', {
        meetingId: newMeeting.id,
        topic: newMeeting.topic,
      });

      // Create test transcript
      const [newTranscript] = await db
        .insert(transcripts)
        .values({
          meetingId: newMeeting.id,
          content: SAMPLE_TRANSCRIPT,
          vttContent: `WEBVTT\n\n00:00:00.000 --> 00:05:00.000\n${SAMPLE_TRANSCRIPT}`,
          speakerSegments: [
            { speaker: 'Jimmy Hackett', start_time: 0, end_time: 60000, text: 'Good morning Sarah...' },
            { speaker: 'Sarah Chen', start_time: 60000, end_time: 120000, text: 'Hi Jimmy!...' },
          ],
          platform: 'zoom',
          source: 'test',
          wordCount: SAMPLE_TRANSCRIPT.split(/\s+/).length,
          status: 'ready',
        })
        .returning();

      log('[DRAFT-1]', 'Test transcript created', {
        transcriptId: newTranscript.id,
        contentLength: newTranscript.content?.length || 0,
        wordCount: newTranscript.wordCount,
      });

      transcript = newTranscript;
      meeting = newMeeting;
    }

    // [DRAFT-1] Transcript fetched
    log('[DRAFT-1]', 'Transcript fetched successfully', {
      transcriptId: transcript.id,
      meetingId: transcript.meetingId,
      contentLength: transcript.content?.length || 0,
      wordCount: transcript.wordCount,
      source: transcript.source,
      status: transcript.status,
    });

    // Verify content exists
    if (!transcript.content || transcript.content.length === 0) {
      log('[DRAFT-1]', 'FAILED - Transcript has no content', { transcriptId: transcript.id });
      throw new Error('Transcript content is empty');
    }

    log('[DRAFT-1]', 'Meeting metadata', {
      meetingId: meeting.id,
      topic: meeting.topic,
      hostEmail: meeting.hostEmail,
      startTime: meeting.startTime,
      duration: meeting.duration,
      status: meeting.status,
    });

    // [DRAFT-2] Prepare and call Claude API
    log('[DRAFT-2]', 'Claude API request starting', {
      meetingId: meeting.id,
      transcriptId: transcript.id,
      transcriptLength: transcript.content.length,
      meetingTopic: meeting.topic,
    });

    const generateStart = Date.now();

    // Call generateDraft with real data
    const result = await generateDraft({
      meetingId: meeting.id,
      transcriptId: transcript.id,
      context: {
        meetingTopic: meeting.topic || 'Meeting',
        meetingDate: meeting.startTime
          ? meeting.startTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : new Date().toLocaleDateString('en-US'),
        hostName: meeting.hostEmail?.split('@')[0] || 'Host',
        hostEmail: meeting.hostEmail,
        transcript: transcript.content,
        senderName: meeting.hostEmail?.split('@')[0],
      },
    });

    const generateDuration = Date.now() - generateStart;

    // [DRAFT-3] Check streaming response
    if (result.success) {
      log('[DRAFT-3]', 'Streaming response received', {
        success: true,
        draftId: result.draftId,
        generationDurationMs: generateDuration,
      });

      // [DRAFT-4] Parse response details
      log('[DRAFT-4]', 'Response parsed', {
        subject: result.subject,
        bodyLength: result.body?.length || 0,
        actionItemCount: result.actionItems?.length || 0,
        meetingType: result.meetingType,
        toneUsed: result.toneUsed,
        qualityScore: result.qualityScore,
      });

      // [DRAFT-5] Verify stored in database
      if (result.draftId) {
        const [storedDraft] = await db
          .select()
          .from(drafts)
          .where(eq(drafts.id, result.draftId))
          .limit(1);

        if (storedDraft) {
          log('[DRAFT-5]', 'Draft stored in database', {
            draftId: storedDraft.id,
            subject: storedDraft.subject,
            bodyLength: storedDraft.body?.length || 0,
            status: storedDraft.status,
            qualityScore: storedDraft.qualityScore,
            meetingType: storedDraft.meetingType,
          });
        } else {
          log('[DRAFT-5]', 'WARNING - Draft not found in database', { draftId: result.draftId });
        }
      }

      // [DRAFT-6] Complete with metrics
      const totalDuration = Date.now() - overallStart;

      log('[DRAFT-6]', 'Complete', {
        totalTimeSeconds: (totalDuration / 1000).toFixed(2),
        generationTimeSeconds: (generateDuration / 1000).toFixed(2),
        costUsd: result.costUsd?.toFixed(6) || '0',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });

      // Print summary
      console.log('\n========================================');
      console.log('TEST SUCCESSFUL');
      console.log('========================================');
      console.log(`Draft ID: ${result.draftId}`);
      console.log(`Subject: ${result.subject}`);
      console.log(`Body length: ${result.body?.length || 0} chars`);
      console.log(`Action items: ${result.actionItems?.length || 0}`);
      console.log(`Quality score: ${result.qualityScore}/100`);
      console.log(`Meeting type: ${result.meetingType}`);
      console.log(`Tone: ${result.toneUsed}`);
      console.log(`Generation time: ${(generateDuration / 1000).toFixed(2)}s`);
      console.log(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);
      console.log(`Cost: $${result.costUsd?.toFixed(6) || '0'}`);
      console.log(`Input tokens: ${result.inputTokens}`);
      console.log(`Output tokens: ${result.outputTokens}`);
      console.log('\n--- EMAIL PREVIEW ---');
      console.log(`Subject: ${result.subject}`);
      console.log(`\nBody (first 500 chars):\n${result.body?.substring(0, 500)}...`);
      console.log('========================================\n');

    } else {
      // Generation failed
      log('[DRAFT-3]', 'FAILED - Generation failed', {
        success: false,
        error: result.error,
        draftId: result.draftId,
        generationDurationMs: generateDuration,
      });

      console.log('\n========================================');
      console.log('TEST FAILED');
      console.log('========================================');
      console.log(`Error: ${result.error}`);
      console.log(`Duration: ${(generateDuration / 1000).toFixed(2)}s`);
      console.log('========================================\n');

      process.exit(1);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const totalDuration = Date.now() - overallStart;

    log('[DRAFT-ERROR]', 'Test crashed', {
      error: errorMessage,
      totalDurationMs: totalDuration,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });

    console.log('\n========================================');
    console.log('TEST CRASHED');
    console.log('========================================');
    console.log(`Error: ${errorMessage}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('========================================\n');

    process.exit(1);
  }

  // Clean exit
  process.exit(0);
}

// Run the test
testDraftGeneration().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
