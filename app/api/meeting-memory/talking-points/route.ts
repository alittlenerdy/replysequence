/**
 * Talking Points Suggestion API
 *
 * POST /api/meeting-memory/talking-points
 * Generates suggested talking points for an upcoming meeting based on contact history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getContactBriefing } from '@/lib/meeting-memory';
import { callClaudeAPI } from '@/lib/claude-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const requestSchema = z.object({
  contactEmail: z.string().email(),
  meetingTopic: z.string().optional(),
});

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { contactEmail, meetingTopic } = parsed.data;
  const briefing = await getContactBriefing(userId, contactEmail);

  if (!briefing) {
    return NextResponse.json({ error: 'No history found for this contact' }, { status: 404 });
  }

  const { contact, recentMeetings } = briefing;

  // Build context for Claude
  const contextParts = [
    `Contact: ${contact.contactName || contactEmail} (${contactEmail})`,
    contact.role ? `Role: ${contact.role}` : '',
    contact.companyName ? `Company: ${contact.companyName}` : '',
    contact.communicationStyle ? `Communication style: ${contact.communicationStyle}` : '',
    `Total meetings: ${contact.meetingCount}`,
    '',
    'Topics discussed previously:',
    ...(contact.topics || []).map((t) => `- ${t}`),
    '',
    'Open objections/concerns:',
    ...(contact.objections || []).map((o) => `- ${o}`),
    '',
    'Commitments made:',
    ...(contact.commitments || []).map((c) => `- ${c}`),
    '',
    'Personal notes:',
    ...(contact.personalNotes || []).map((n) => `- ${n}`),
    '',
    'Recent meeting summaries:',
    ...recentMeetings.slice(0, 5).map((m, i) => `${i + 1}. ${m.summary}`),
  ].filter(Boolean);

  if (meetingTopic) {
    contextParts.push('', `Upcoming meeting topic: ${meetingTopic}`);
  }

  const result = await callClaudeAPI({
    systemPrompt: `You are a sales meeting prep assistant. Given the history with a contact, suggest 5-7 talking points for the next meeting. Output a JSON object with:
- "talkingPoints": Array of strings, each a specific talking point (not generic)
- "iceBreakers": Array of 1-2 personal icebreaker suggestions based on personal notes
- "riskAreas": Array of 1-3 things to watch out for (open objections, unfulfilled commitments)
- "followUpOn": Array of 1-3 items from previous meetings that should be revisited

Be specific. Reference actual details from the history. Each talking point should be actionable and reference concrete context.`,
    userPrompt: contextParts.join('\n'),
    maxTokens: 1024,
  });

  // Parse response
  let suggestions;
  try {
    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    suggestions = JSON.parse(jsonStr);
  } catch {
    suggestions = {
      talkingPoints: ['Review progress on previously discussed items'],
      iceBreakers: [],
      riskAreas: (contact.objections || []).slice(0, 3),
      followUpOn: (contact.commitments || []).slice(0, 3),
    };
  }

  return NextResponse.json({
    contactEmail,
    contactName: contact.contactName,
    companyName: contact.companyName,
    meetingCount: contact.meetingCount,
    ...suggestions,
  });
}
