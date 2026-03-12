/**
 * Auto Next-Step Tracking
 *
 * First downstream consumer of extracted signals.
 * Analyzes signals from a meeting and generates predicted next steps
 * using Claude API, then writes them to the deal context and next_steps table.
 *
 * Pipeline: extractSignals() → generateNextSteps() → persist to DB + updateAccumulatedContext()
 */

import { callClaudeAPI, log } from '@/lib/claude-api';
import { updateAccumulatedContext } from '@/lib/context-store';
import { db, nextStepsTable, meetings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Signal } from '@/lib/signals/types';
import type { NextStepType, NextStepUrgency, NextStepOwnerType, NextStepSource } from '@/lib/db/schema';
import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────

export interface NextStep {
  task: string;
  owner: string;
  ownerType: 'rep' | 'prospect' | 'other';
  type: 'email' | 'call' | 'document' | 'internal' | 'meeting';
  urgency: 'immediate' | 'this_week' | 'next_week' | 'no_deadline';
  deadline: string;
  source: 'explicit' | 'predicted';
  confidence: 'high' | 'medium' | 'low';
}

const nextStepSchema = z.object({
  task: z.string().min(1).max(500),
  owner: z.string().max(255),
  ownerType: z.enum(['rep', 'prospect', 'other']).default('rep'),
  type: z.enum(['email', 'call', 'document', 'internal', 'meeting']).default('email'),
  urgency: z.enum(['immediate', 'this_week', 'next_week', 'no_deadline']).default('this_week'),
  deadline: z.string().max(100),
  source: z.enum(['explicit', 'predicted']),
  confidence: z.enum(['high', 'medium', 'low']),
});

const nextStepsResponseSchema = z.object({
  nextSteps: z.array(nextStepSchema).max(20),
});

// ── System Prompt ────────────────────────────────────────────────────

const NEXT_STEPS_SYSTEM_PROMPT = `You are a sales operations analyst. Given a set of deal signals extracted from a meeting, generate actionable next steps.

For each signal, determine:
1. task: What action should be taken? (start with a verb, be concise)
2. owner: Who should own it? (use the signal's speaker name, "Sales rep", "Prospect", or a role like "Engineering lead")
3. ownerType: "rep" (sales team), "prospect" (buyer side), or "other" (third party)
4. type: "email" (send an email), "call" (make a phone call), "document" (create/send a document), "internal" (internal team action), "meeting" (schedule a meeting)
5. urgency: "immediate" (within 24h), "this_week", "next_week", "no_deadline"
6. deadline: Human-readable deadline (e.g., "Within 24 hours", "Before next meeting", "This week")
7. source: "explicit" (directly stated in meeting) or "predicted" (inferred from signal)
8. confidence: "high" (directly stated), "medium" (strongly implied), "low" (suggested based on best practices)

Rules:
- Prioritize explicit next steps over predictions
- Keep task descriptions actionable and concise (start with a verb)
- Do not duplicate — if two signals imply the same action, combine them
- Return 0 next steps if the signals don't warrant any actions
- Maximum 15 next steps per meeting

Respond with ONLY valid JSON:
{
  "nextSteps": [
    {
      "task": "Send revised proposal with updated pricing tiers",
      "owner": "Sales rep",
      "ownerType": "rep",
      "type": "document",
      "urgency": "immediate",
      "deadline": "Within 48 hours",
      "source": "explicit",
      "confidence": "high"
    }
  ]
}`;

// ── Generation Function ──────────────────────────────────────────────

export interface GenerateNextStepsInput {
  meetingId: string;
  dealContextId?: string;
  signals: Signal[];
  meetingTopic?: string;
}

export interface GenerateNextStepsResult {
  success: boolean;
  nextSteps: NextStep[];
  count: number;
  persisted: number;
  durationMs?: number;
  error?: string;
}

/**
 * Compute a due date from urgency relative to meeting time.
 */
function computeDueDate(urgency: NextStepUrgency, referenceDate: Date): Date | null {
  const d = new Date(referenceDate);
  switch (urgency) {
    case 'immediate':
      d.setHours(d.getHours() + 24);
      return d;
    case 'this_week':
      d.setDate(d.getDate() + 5);
      return d;
    case 'next_week':
      d.setDate(d.getDate() + 10);
      return d;
    case 'no_deadline':
      return null;
  }
}

/**
 * Look up the userId for a meeting.
 */
async function getMeetingUserId(meetingId: string): Promise<string | null> {
  const [meeting] = await db
    .select({ userId: meetings.userId })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  return meeting?.userId || null;
}

/**
 * Generate next steps from extracted signals using Claude API.
 * Writes results to the next_steps table and deal context.
 */
export async function generateNextSteps(input: GenerateNextStepsInput): Promise<GenerateNextStepsResult> {
  const { meetingId, dealContextId, signals, meetingTopic } = input;
  const startTime = Date.now();

  if (signals.length === 0) {
    return { success: true, nextSteps: [], count: 0, persisted: 0 };
  }

  try {
    const userPrompt = buildNextStepsPrompt(signals, meetingTopic);

    const response = await callClaudeAPI({
      systemPrompt: NEXT_STEPS_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 2048,
    });

    const durationMs = Date.now() - startTime;
    const nextSteps = parseNextStepsResponse(response.content);

    // Write to deal context if linked (backwards-compatible string format)
    if (dealContextId && nextSteps.length > 0) {
      await updateAccumulatedContext({
        dealContextId,
        nextSteps: nextSteps.map((s) => `[${s.confidence}] ${s.task} (${s.owner}, ${s.deadline})`),
      });
    }

    // Persist individual records to next_steps table
    let persisted = 0;
    if (nextSteps.length > 0) {
      const userId = await getMeetingUserId(meetingId);
      if (userId) {
        const now = new Date();
        const rows = nextSteps.map((step) => ({
          userId,
          meetingId,
          dealContextId: dealContextId || null,
          task: step.task,
          owner: step.owner,
          ownerType: step.ownerType as NextStepOwnerType,
          type: step.type as NextStepType,
          urgency: step.urgency as NextStepUrgency,
          source: step.source as NextStepSource,
          confidence: step.confidence,
          status: 'pending' as const,
          dueDate: computeDueDate(step.urgency as NextStepUrgency, now),
        }));

        const inserted = await db.insert(nextStepsTable).values(rows).returning({ id: nextStepsTable.id });
        persisted = inserted.length;
      }
    }

    log('info', '[NEXT-STEPS] Generation complete', {
      meetingId,
      signalCount: signals.length,
      nextStepCount: nextSteps.length,
      persisted,
      explicit: nextSteps.filter((s) => s.source === 'explicit').length,
      predicted: nextSteps.filter((s) => s.source === 'predicted').length,
      durationMs,
    });

    return {
      success: true,
      nextSteps,
      count: nextSteps.length,
      persisted,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', '[NEXT-STEPS] Generation failed', {
      meetingId,
      error: errorMessage,
      durationMs,
    });

    return {
      success: false,
      nextSteps: [],
      count: 0,
      persisted: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function buildNextStepsPrompt(signals: Signal[], meetingTopic?: string): string {
  const topicLine = meetingTopic ? `Meeting topic: ${meetingTopic}\n\n` : '';

  const signalList = signals
    .map((s, i) => {
      let line = `${i + 1}. [${s.type}] ${s.value} (confidence: ${s.confidence})`;
      if (s.speaker) line += `\n   Speaker: ${s.speaker}`;
      if (s.quote) line += `\n   Quote: "${s.quote}"`;
      return line;
    })
    .join('\n\n');

  return `${topicLine}Extracted signals:\n\n${signalList}`;
}

/**
 * Parse Claude's JSON response and validate with Zod.
 */
export function parseNextStepsResponse(content: string): NextStep[] {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    log('error', '[NEXT-STEPS] Failed to parse JSON response', {
      contentPreview: content.slice(0, 200),
    });
    return [];
  }

  const result = nextStepsResponseSchema.safeParse(parsed);

  if (!result.success) {
    log('error', '[NEXT-STEPS] Validation failed', {
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return [];
  }

  return result.data.nextSteps;
}
