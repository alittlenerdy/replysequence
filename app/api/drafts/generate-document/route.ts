/**
 * Document Generation API
 *
 * POST /api/drafts/generate-document
 *
 * Generates a document (proposal, recap, CRM notes, internal summary) from
 * a meeting transcript. Uses the same Claude API infrastructure as follow-up
 * email generation but with document-specific prompt templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { drafts, meetings, transcripts, users } from '@/lib/db/schema';
import type { DraftType, ActionItem } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { callClaudeAPI, CLAUDE_MODEL, calculateCost } from '@/lib/claude-api';
import { getDocumentTemplate, type DocumentContext } from '@/lib/prompts/document-templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const requestSchema = z.object({
  meetingId: z.string().uuid(),
  documentType: z.enum(['proposal', 'recap', 'crm_notes', 'internal_summary']),
  recipientName: z.string().optional(),
  companyName: z.string().optional(),
  additionalContext: z.string().max(2000).optional(),
});

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[DOC-GEN]', message, ...data }));
}

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

  const { meetingId, documentType, recipientName, companyName, additionalContext } = parsed.data;

  // Verify meeting belongs to user and has a transcript
  const [meeting] = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      startTime: meetings.startTime,
      hostName: meetings.hostName,
      participants: meetings.participants,
    })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
    .limit(1);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  // Get the transcript
  const [transcript] = await db
    .select({
      id: transcripts.id,
      content: transcripts.content,
    })
    .from(transcripts)
    .where(eq(transcripts.meetingId, meetingId))
    .limit(1);

  if (!transcript?.content) {
    return NextResponse.json({ error: 'No transcript available for this meeting' }, { status: 400 });
  }

  // Truncate transcript if too long (keep under ~12k tokens worth)
  const maxChars = 48000;
  const transcriptText = transcript.content.length > maxChars
    ? transcript.content.slice(0, maxChars) + '\n\n[Transcript truncated for length]'
    : transcript.content;

  // Build document context
  const participants = (meeting.participants || []) as { user_name: string; email?: string }[];
  const participantNames = participants.map((p) => p.user_name).filter(Boolean);

  const docContext: DocumentContext = {
    meetingTopic: meeting.topic || 'Untitled Meeting',
    meetingDate: meeting.startTime
      ? new Date(meeting.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown date',
    hostName: meeting.hostName || 'Host',
    transcript: transcriptText,
    participants: participantNames,
    companyName,
    recipientName,
    additionalContext,
  };

  const template = getDocumentTemplate(documentType);
  const systemPrompt = template.systemPrompt;
  const userPrompt = template.buildUserPrompt(docContext);

  log('info', 'Generating document', { meetingId, documentType, transcriptLength: transcriptText.length });

  const startedAt = new Date();

  try {
    const result = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
    });

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const cost = calculateCost(result.inputTokens, result.outputTokens, result.cacheCreationTokens, result.cacheReadTokens);

    // Parse the response JSON
    let parsed: { subject: string; body: string; actionItems?: ActionItem[] };
    try {
      // Extract JSON from response (handle markdown code fences)
      let jsonStr = result.content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, use raw content
      parsed = {
        subject: `${template.subjectPrefix}: ${meeting.topic || 'Meeting'}`,
        body: result.content,
        actionItems: [],
      };
    }

    // Insert as a new draft with the document type
    const [newDraft] = await db
      .insert(drafts)
      .values({
        meetingId,
        transcriptId: transcript.id,
        subject: parsed.subject,
        body: parsed.body,
        originalBody: parsed.body,
        status: 'generated',
        draftType: documentType as DraftType,
        model: CLAUDE_MODEL,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: cost.toFixed(6),
        generationStartedAt: startedAt,
        generationCompletedAt: completedAt,
        generationDurationMs: durationMs,
        actionItems: parsed.actionItems || [],
      })
      .returning({ id: drafts.id });

    log('info', 'Document generated', {
      draftId: newDraft.id,
      documentType,
      durationMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });

    return NextResponse.json({
      success: true,
      draftId: newDraft.id,
      subject: parsed.subject,
      body: parsed.body,
      actionItems: parsed.actionItems || [],
      documentType,
      model: CLAUDE_MODEL,
      tokens: { input: result.inputTokens, output: result.outputTokens },
      costUsd: cost,
      durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('error', 'Document generation failed', { meetingId, documentType, error: message });

    // Store failed draft for debugging
    await db.insert(drafts).values({
      meetingId,
      transcriptId: transcript.id,
      subject: `${template.subjectPrefix}: ${meeting.topic || 'Meeting'}`,
      body: '',
      status: 'failed',
      draftType: documentType as DraftType,
      model: CLAUDE_MODEL,
      errorMessage: message,
      generationStartedAt: startedAt,
      generationCompletedAt: new Date(),
    });

    return NextResponse.json({ error: 'Document generation failed', details: message }, { status: 500 });
  }
}
