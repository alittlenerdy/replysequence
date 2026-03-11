/**
 * Auto Next-Step Tracking
 *
 * First downstream consumer of extracted signals.
 * Analyzes signals from a meeting and generates predicted next steps
 * using Claude API, then writes them to the deal context.
 *
 * Pipeline: extractSignals() → generateNextSteps() → updateAccumulatedContext()
 */

import { callClaudeAPI, log } from '@/lib/claude-api';
import { updateAccumulatedContext } from '@/lib/context-store';
import type { Signal } from '@/lib/signals/types';
import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────

export interface NextStep {
  task: string;
  owner: string;
  deadline: string;
  source: 'explicit' | 'predicted';
  confidence: 'high' | 'medium' | 'low';
}

const nextStepSchema = z.object({
  task: z.string().min(1).max(500),
  owner: z.string().max(255),
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
1. What action should be taken as a result?
2. Who should own it? (use the signal's speaker name, "Sales rep", "Prospect", or a role like "Engineering lead")
3. What's a reasonable deadline? (use relative terms: "Within 24 hours", "Before next meeting", "This week", "Within 2 weeks", etc.)
4. Is this an explicit next step (directly stated in the meeting) or a predicted one (inferred from the signal)?
5. Confidence level: high (directly stated), medium (strongly implied), low (suggested based on best practices)

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
  durationMs?: number;
  error?: string;
}

/**
 * Generate next steps from extracted signals using Claude API.
 * Writes results to the deal context if dealContextId is provided.
 */
export async function generateNextSteps(input: GenerateNextStepsInput): Promise<GenerateNextStepsResult> {
  const { meetingId, dealContextId, signals, meetingTopic } = input;
  const startTime = Date.now();

  if (signals.length === 0) {
    return { success: true, nextSteps: [], count: 0 };
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

    // Write to deal context if linked
    if (dealContextId && nextSteps.length > 0) {
      await updateAccumulatedContext({
        dealContextId,
        nextSteps: nextSteps.map((s) => `[${s.confidence}] ${s.task} (${s.owner}, ${s.deadline})`),
      });
    }

    log('info', '[NEXT-STEPS] Generation complete', {
      meetingId,
      signalCount: signals.length,
      nextStepCount: nextSteps.length,
      explicit: nextSteps.filter((s) => s.source === 'explicit').length,
      predicted: nextSteps.filter((s) => s.source === 'predicted').length,
      durationMs,
    });

    return {
      success: true,
      nextSteps,
      count: nextSteps.length,
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
