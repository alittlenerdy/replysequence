import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

// Allow longer timeout for cold starts and AI generation
export const maxDuration = 60;

const SAMPLE_MEETING = {
  topic: 'Q1 Partnership Discussion',
  attendees: ['User', 'Sarah Chen (Acme Corp)'],
  transcript: `Sarah: Thanks for taking the time to meet today. I think there's a lot of potential here for a partnership.

User: Absolutely, I've been looking forward to this. Your product would be a great fit for our customers.

Sarah: Great! So, we should schedule a follow-up for next Tuesday to review the contract details. Does that work for you?

User: Sounds perfect. I'll send over the updated proposal by Friday so you have time to review before our call.

Sarah: That would be great. Looking forward to it!`,
};

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock draft if no API key
      console.log('[ONBOARDING-DRAFT] No API key, returning mock draft');
      return NextResponse.json({
        success: true,
        draft: {
          subject: 'Following up on Q1 Partnership Discussion',
          body: `Hi Sarah,

Great connecting today! I really enjoyed our conversation about the partnership opportunity.

As discussed, I'll send over the updated proposal by Friday so you have time to review it before our follow-up call.

I've also added our meeting to the calendar for next Tuesday to review the contract details.

Looking forward to moving this partnership forward!

Best regards`,
        },
        generationTime: 1.5,
        mock: true,
      });
    }

    // Use Claude to generate a real draft
    const client = new Anthropic();

    const prompt = `Generate a professional follow-up email based on this meeting transcript.

Meeting Topic: ${SAMPLE_MEETING.topic}
Attendees: ${SAMPLE_MEETING.attendees.join(', ')}

Transcript:
${SAMPLE_MEETING.transcript}

Generate a concise, professional follow-up email that:
1. References the meeting topic
2. Confirms the action items discussed
3. Mentions the next steps (follow-up meeting Tuesday, proposal by Friday)
4. Has a friendly but professional tone

Return ONLY the email body (no subject line, no "Subject:" prefix). Start directly with the greeting.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    const content = response.content[0];
    const body = content.type === 'text' ? content.text : '';

    console.log('[ONBOARDING-DRAFT] Generated draft in', generationTime, 'seconds for user:', userId);

    return NextResponse.json({
      success: true,
      draft: {
        subject: 'Following up on Q1 Partnership Discussion',
        body: body.trim(),
      },
      generationTime,
      mock: false,
    });
  } catch (error) {
    console.error('[ONBOARDING-DRAFT] Error:', error);

    // Return mock draft on error
    return NextResponse.json({
      success: true,
      draft: {
        subject: 'Following up on Q1 Partnership Discussion',
        body: `Hi Sarah,

Great connecting today! I really enjoyed our conversation about the partnership opportunity.

As discussed, I'll send over the updated proposal by Friday so you have time to review it before our follow-up call.

I've also added our meeting to the calendar for next Tuesday to review the contract details.

Looking forward to moving this partnership forward!

Best regards`,
      },
      generationTime: 1.5,
      mock: true,
    });
  }
}
