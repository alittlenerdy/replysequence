#!/usr/bin/env tsx
/**
 * Prompt Quality Testing Harness
 *
 * Tests the optimized prompt system against sample transcripts
 * and generates a quality comparison report.
 *
 * Usage:
 *   npx tsx scripts/test-prompt-quality.ts
 */

import 'dotenv/config';
import { detectMeetingType, extractParticipants } from '../lib/meeting-type-detector';
import {
  OPTIMIZED_SYSTEM_PROMPT,
  buildOptimizedPrompt,
  parseOptimizedResponse,
  type FollowUpContext,
} from '../lib/prompts/optimized-followup';
import { scoreDraft, getQualityGrade } from '../lib/quality-scorer';

// Sample transcripts for testing
const SAMPLE_TRANSCRIPTS = [
  {
    name: 'Sales Discovery Call',
    topic: 'ReplySequence Demo - Acme Corp',
    transcript: `
Jimmy: Hey Sarah, thanks for taking the time today. I know you're busy.

Sarah: No problem! We've been looking for something to help with our follow-up process. Our sales team is drowning in manual work.

Jimmy: That's exactly what we hear from a lot of teams. Can you tell me more about your current process?

Sarah: Sure. After every call, our reps spend 20-30 minutes writing follow-up emails. Most of them just copy-paste templates and forget to include the specific details from the call.

Jimmy: Got it. So the pain is both the time spent and the quality of the follow-ups?

Sarah: Exactly. And honestly, a lot of times they just don't send them at all because they're too busy with other calls.

Jimmy: Makes sense. What if I told you we could cut that 20-30 minutes down to 30 seconds of review time?

Sarah: That would be huge. What's the pricing look like?

Jimmy: For a team your size, probably around $99 per seat per month. But let me send you a proper proposal after this call.

Sarah: That sounds reasonable. When could we do a pilot?

Jimmy: We could start next week. I'll send you a calendar invite to set up your account. Sound good?

Sarah: Perfect. Let's do it.
    `,
    expectedType: 'sales_call',
    expectedTone: 'casual',
  },
  {
    name: 'Technical Discussion',
    topic: 'Redis Connection Issues - Debugging Session',
    transcript: `
James: So we've been seeing these timeout errors in production for the last few days.

Jimmy: Can you show me the error logs?

James: Yeah, here's what we're getting: "Redis connection timed out after 5000ms". It happens about 10% of the time.

Jimmy: Interesting. Are you using connection pooling?

James: We're using ioredis with the default settings.

Jimmy: That might be the issue. In serverless environments, you need to configure maxRetriesPerRequest and enableReadyCheck properly.

James: Oh, I didn't know that. What values do you recommend?

Jimmy: Set maxRetriesPerRequest to 3 instead of null, and enableReadyCheck to true. Also add a 5-second connection timeout.

James: Got it. Should I also look at the Upstash configuration?

Jimmy: Yes, make sure you're using their serverless Redis URL, not the standard one. That has optimizations for Lambda-style deployments.

James: This is really helpful. Can you share the documentation for these settings?

Jimmy: Absolutely. I'll send you our internal docs after this call. Also, let's schedule a follow-up in a few days to see if the changes helped.

James: Perfect, thanks for the help.
    `,
    expectedType: 'technical_discussion',
    expectedTone: 'neutral',
  },
  {
    name: 'Internal Team Sync',
    topic: 'Weekly Engineering Standup',
    transcript: `
Mike: Alright team, let's do our weekly sync. Who wants to start?

Anna: I'll go. I finished the authentication flow PR yesterday. It's ready for review.

Mike: Great. Who can review that today?

Dave: I can take it. Should be done by EOD.

Anna: Thanks Dave. My blocker right now is waiting for the design specs for the dashboard. Lisa, any update?

Lisa: Yeah, sorry for the delay. I'll have the mockups ready by tomorrow morning.

Mike: Okay, so Anna is blocked until tomorrow. What about you Dave?

Dave: I'm working on the API rate limiting. Should be done by Friday. No blockers.

Mike: Perfect. And I'm wrapping up the deployment pipeline. We should be able to ship to staging by Monday.

Anna: Oh, one more thing - we need to decide on the testing strategy for the new features.

Mike: Good point. Let's schedule a separate meeting for that. Can everyone do Thursday at 2pm?

Team: Works for me.

Mike: Great, I'll send the invite. Anything else? No? Okay, let's get back to it.
    `,
    expectedType: 'internal_sync',
    expectedTone: 'casual',
  },
  {
    name: 'Client Review Meeting',
    topic: 'Q1 Dashboard Project - Progress Review',
    transcript: `
Client: Thanks for the update presentation. I have some feedback on the dashboard mockups.

Jimmy: Of course, we'd love to hear it.

Client: The overall direction is good, but I think the metrics section is too cluttered. Can we simplify it?

Jimmy: Absolutely. What if we moved the secondary metrics to a separate tab?

Client: That could work. Also, the color scheme feels a bit dark. Our brand is more vibrant.

Jimmy: Good point. I'll have our designer propose some alternatives that align better with your brand guidelines.

Client: Perfect. When can we see the revisions?

Jimmy: We can have updated mockups by next Friday. Does that work for your team's review?

Client: Yes, that gives us time before the board meeting. Oh, and one more thing - can we add export to PDF functionality?

Jimmy: That wasn't in the original scope, but it's definitely doable. It would add about a week to the timeline.

Client: Let's discuss that internally and get back to you by Wednesday.

Jimmy: Sounds good. I'll also send over a summary of today's feedback and the updated timeline.

Client: Thank you, this has been productive.
    `,
    expectedType: 'client_review',
    expectedTone: 'formal',
  },
  {
    name: 'General Meeting',
    topic: 'Coffee Chat - Networking',
    transcript: `
Alex: Hey, great to finally connect! I've heard a lot about your work.

Jordan: Thanks! Same here. How did you get into product management?

Alex: Actually, I started as an engineer and transitioned about 3 years ago. Best decision I ever made.

Jordan: That's interesting. I've been thinking about a similar move.

Alex: Happy to share what I learned. The key is really understanding user problems, not just building features.

Jordan: That makes sense. Any resources you'd recommend?

Alex: There's a great book called "Inspired" by Marty Cagan. Also, just talk to customers as much as possible.

Jordan: I'll check that out. Thanks for the advice!

Alex: Of course. Let's grab coffee again sometime. Maybe next month?

Jordan: Sounds good. I'll reach out.
    `,
    expectedType: 'general',
    expectedTone: 'casual',
  },
];

async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('PROMPT QUALITY TESTING HARNESS');
  console.log('='.repeat(60));
  console.log('');

  const results: Array<{
    name: string;
    meetingType: {
      detected: string;
      expected: string;
      match: boolean;
    };
    tone: {
      detected: string;
      expected: string;
      match: boolean;
    };
    qualityScore: number;
    grade: string;
    issues: string[];
    subjectPreview: string;
  }> = [];

  for (const sample of SAMPLE_TRANSCRIPTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing: ${sample.name}`);
    console.log(`Topic: ${sample.topic}`);
    console.log(`${'─'.repeat(60)}`);

    // Run meeting type detection
    const detection = detectMeetingType(sample.transcript, sample.topic);
    const participants = extractParticipants(sample.transcript);

    console.log(`\nMeeting Type Detection:`);
    console.log(`  Detected: ${detection.meetingType} (confidence: ${detection.confidence}%)`);
    console.log(`  Expected: ${sample.expectedType}`);
    console.log(`  Match: ${detection.meetingType === sample.expectedType ? '✓' : '✗'}`);
    console.log(`  Signals: ${detection.signals.slice(0, 3).join(', ')}`);

    console.log(`\nTone Detection:`);
    console.log(`  Detected: ${detection.tone}`);
    console.log(`  Expected: ${sample.expectedTone}`);
    console.log(`  Match: ${detection.tone === sample.expectedTone ? '✓' : '✗'}`);

    console.log(`\nParticipants: ${participants.join(', ') || 'None detected'}`);

    // Build prompt (we won't actually call Claude API in tests)
    const context: FollowUpContext = {
      meetingTopic: sample.topic,
      meetingDate: new Date().toLocaleDateString(),
      hostName: 'Jimmy',
      hostEmail: 'jimmy@example.com',
      transcript: sample.transcript,
      meetingType: detection.meetingType,
      detectedTone: detection.tone,
      keyParticipants: participants,
    };

    const prompt = buildOptimizedPrompt(context);
    console.log(`\nPrompt Stats:`);
    console.log(`  Length: ${prompt.length} chars`);
    console.log(`  Est. tokens: ~${Math.ceil(prompt.length / 4)}`);

    // Simulate a mock response for quality scoring test
    const mockResponse = {
      subject: `${sample.topic.split(' - ')[0]} - next steps`,
      body: `Hi ${participants[0] || 'there'},

Thanks for taking the time to discuss ${sample.topic.toLowerCase()} today.

I wanted to follow up on a few key points:
- Point 1 from the discussion
- Point 2 from the discussion

Looking forward to our next conversation.

Best regards`,
      actionItems: [
        { owner: 'Jimmy', task: 'Send follow-up materials', deadline: 'by Friday' },
        { owner: participants[0] || 'Team', task: 'Review proposal', deadline: 'next week' },
      ],
      meetingTypeDetected: detection.meetingType,
      toneUsed: detection.tone,
      keyPointsReferenced: ['key point 1', 'key point 2'],
      meetingSummary: `The team discussed ${sample.topic.toLowerCase()} and outlined next steps.`,
      keyTopics: [{ topic: sample.topic, duration: 'main focus' }],
      keyDecisions: [],
    };

    // Score the mock draft
    const qualityResult = scoreDraft(mockResponse, sample.transcript);
    const grade = getQualityGrade(qualityResult.overall);

    console.log(`\nQuality Score (Mock Draft):`);
    console.log(`  Overall: ${qualityResult.overall}/100 (Grade: ${grade})`);
    console.log(`  Breakdown:`);
    console.log(`    - Subject: ${qualityResult.breakdown.subjectScore}/25`);
    console.log(`    - Body: ${qualityResult.breakdown.bodyScore}/25`);
    console.log(`    - Action Items: ${qualityResult.breakdown.actionItemsScore}/25`);
    console.log(`    - Structure: ${qualityResult.breakdown.structureScore}/25`);

    if (qualityResult.issues.length > 0) {
      console.log(`  Issues: ${qualityResult.issues.slice(0, 3).join(', ')}`);
    }

    results.push({
      name: sample.name,
      meetingType: {
        detected: detection.meetingType,
        expected: sample.expectedType,
        match: detection.meetingType === sample.expectedType,
      },
      tone: {
        detected: detection.tone,
        expected: sample.expectedTone,
        match: detection.tone === sample.expectedTone,
      },
      qualityScore: qualityResult.overall,
      grade,
      issues: qualityResult.issues.slice(0, 3),
      subjectPreview: mockResponse.subject.substring(0, 50),
    });
  }

  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(60));

  const typeMatches = results.filter(r => r.meetingType.match).length;
  const toneMatches = results.filter(r => r.tone.match).length;
  const avgQuality = Math.round(results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length);

  console.log(`\nMeeting Type Detection: ${typeMatches}/${results.length} correct (${Math.round(typeMatches/results.length*100)}%)`);
  console.log(`Tone Detection: ${toneMatches}/${results.length} correct (${Math.round(toneMatches/results.length*100)}%)`);
  console.log(`Average Quality Score: ${avgQuality}/100`);

  console.log('\nPer-Test Results:');
  console.log('─'.repeat(60));

  for (const result of results) {
    const typeIcon = result.meetingType.match ? '✓' : '✗';
    const toneIcon = result.tone.match ? '✓' : '✗';
    console.log(`${result.name}:`);
    console.log(`  Type: ${typeIcon} | Tone: ${toneIcon} | Quality: ${result.qualityScore} (${result.grade})`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing complete!');
  console.log('='.repeat(60));

  // Exit with error if quality is too low
  if (avgQuality < 50) {
    console.error('\n⚠️  Average quality score is below 50. Review prompt design.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
