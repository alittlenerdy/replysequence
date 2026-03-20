/**
 * Demo Draft Generation API
 *
 * POST /api/demo/generate — generates a follow-up email from a sample transcript
 * Public endpoint (no auth required). Rate limited by IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { SAMPLE_MEETINGS } from '@/lib/sample-meetings';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const DEMO_RATE_LIMIT = { limit: 5, window: 60 }; // 5 per minute per IP

const DEMO_SYSTEM_PROMPT = `You are a sales follow-up assistant. Generate a professional follow-up email AND a meeting recap based on the meeting transcript provided.

The email should:
1. Have a hook-driven subject line under 60 characters
2. Reference specific discussion points from the meeting
3. List concrete action items with owners
4. Include clear next steps
5. Be 150-250 words — concise but thorough
6. Use a confident, professional tone

The recap should:
1. Summarize the meeting in 3-5 bullet points
2. Highlight key decisions made
3. Note any concerns or risks raised
4. Be factual and concise

Respond with JSON only:
{
  "subject": "Subject line here",
  "body": "Email body here",
  "actionItems": ["Action 1", "Action 2"],
  "recap": {
    "summary": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "decisions": ["Decision 1", "Decision 2"],
    "risks": ["Risk or concern 1"]
  }
}`;

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`demo-generate:${clientId}`, DEMO_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many demo requests. Please try again in a minute.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const body = await request.json();
    const { sampleId, customTranscript } = body;

    let topic: string;
    let attendees: string[];
    let duration: number;
    let transcript: string;

    if (customTranscript && typeof customTranscript === 'string' && customTranscript.trim().length > 50) {
      // Custom transcript uploaded by visitor
      if (customTranscript.length > 15000) {
        return NextResponse.json({ error: 'Transcript too long. Please keep it under 15,000 characters.' }, { status: 400 });
      }
      topic = 'Your Meeting';
      attendees = ['Participants from transcript'];
      duration = 0;
      transcript = customTranscript.trim();
    } else if (customTranscript) {
      return NextResponse.json({ error: 'Transcript must be at least 50 characters.' }, { status: 400 });
    } else {
      const resolvedSampleId = sampleId || 'sample-sales-discovery';
      const sample = SAMPLE_MEETINGS.find((s) => s.id === resolvedSampleId);
      if (!sample) {
        return NextResponse.json({ error: 'Invalid sample' }, { status: 400 });
      }
      topic = sample.topic;
      attendees = sample.attendees;
      duration = sample.duration;
      transcript = sample.transcript;
    }

    const startTime = Date.now();

    // Generate with Claude if API key exists, otherwise return mock
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(mockResponse(topic, startTime));
    }

    const client = new Anthropic();

    const userPrompt = `Meeting Topic: ${topic}
Attendees: ${attendees.join(', ')}
${duration ? `Duration: ${duration} minutes` : ''}

Transcript:
${transcript}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: DEMO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const generationMs = Date.now() - startTime;
    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    // Parse JSON response
    let parsed: {
      subject: string;
      body: string;
      actionItems: string[];
      recap?: { summary: string[]; decisions: string[]; risks: string[] };
    };
    try {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat entire response as email body
      parsed = {
        subject: `Following up on ${topic}`,
        body: text,
        actionItems: [],
      };
    }

    return NextResponse.json({
      success: true,
      subject: parsed.subject,
      body: parsed.body,
      actionItems: parsed.actionItems,
      recap: parsed.recap || null,
      generationMs,
      topic,
    });
  } catch (error) {
    console.error('[DEMO] Generation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Demo generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

function mockResponse(topic: string, startTime: number) {
  return {
    success: true,
    subject: `Following up on ${topic}`,
    body: `Hi Sarah,\n\nGreat connecting today! Here's a quick recap of what we covered and the next steps.\n\nKey Discussion Points:\n- Your team of 12 reps currently spends 20-30 minutes per call on follow-ups\n- CRM data freshness is a major pain point — reps aren't logging notes consistently\n- ReplySequence can generate ready-to-send follow-ups in ~8 seconds and auto-sync to HubSpot\n\nAction Items:\n1. I'll set up a 14-day pilot for 3-4 reps on your team\n2. Please send me the email addresses of the pilot participants\n3. We'll reconvene after the pilot to review results\n\nThe Team plan at $39/user/month would save your reps an estimated 60 hours per week in follow-up time — that's significant selling time back in their day.\n\nLooking forward to getting the pilot started!\n\nBest regards`,
    actionItems: [
      'Set up 14-day pilot for 3-4 reps',
      'Sarah to send pilot participant email addresses',
      'Reconvene after pilot to review results',
    ],
    recap: {
      summary: [
        'Acme Corp evaluating follow-up automation for 12-person sales team',
        'Current pain: reps spend 20-30 min per call on manual follow-ups, CRM data goes stale',
        'Demo of ReplySequence\'s 8-second follow-up generation and HubSpot auto-sync',
        'Agreed to a 14-day pilot with 3-4 reps',
      ],
      decisions: [
        'Proceed with 14-day pilot program',
        'Team plan pricing at $39/user/month confirmed',
      ],
      risks: [
        'Pilot success depends on reps actually connecting their Zoom accounts',
      ],
    },
    generationMs: Date.now() - startTime,
    topic,
    mock: true,
  };
}
