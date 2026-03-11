/**
 * AI Mutual Action Plan Generator
 *
 * Generates a structured Mutual Action Plan from extracted signals.
 * Only uses evidence-backed commitments and next steps — no hallucinated items.
 *
 * Pipeline: signals + deal context → Claude API → validated MAP → persistence
 */

import { callClaudeAPI, log } from '@/lib/claude-api';
import { getSignalsForMeeting } from '@/lib/context-store';
import { createMap } from '@/lib/map/store';
import type { Signal } from '@/lib/signals/types';
import type { MapStepSource, NewMapStep } from '@/lib/db/schema';
import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────

export interface MapStepGenerated {
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  sourceType: 'commitment' | 'next_step' | 'risk_mitigation' | 'recommended';
  sourceQuote?: string;
}

const mapStepSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(''),
  owner: z.string().max(255).default('TBD'),
  dueDate: z.string().max(100).default('TBD'),
  sourceType: z.enum(['commitment', 'next_step', 'risk_mitigation', 'recommended']),
  sourceQuote: z.string().max(2000).optional(),
});

const mapResponseSchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
  steps: z.array(mapStepSchema).max(20),
});

// ── System Prompt ────────────────────────────────────────────────────

const MAP_SYSTEM_PROMPT = `You are a deal operations specialist generating a Mutual Action Plan (MAP) from meeting signals.

A Mutual Action Plan is a shared document between buyer and seller that lists the agreed-upon steps to close a deal. It builds trust and accountability.

You will receive extracted signals from a sales meeting. Generate a MAP that includes:

1. **Title** — A concise plan title (e.g., "Acme Corp — Enterprise Pilot Action Plan")
2. **Summary** — 2-3 sentence overview of the deal status and what this plan covers
3. **Steps** — Ordered list of action items, each with:
   - title: Concise action (start with a verb)
   - description: Brief context or details
   - owner: Who is responsible ("Buyer", "Seller", a person's name, or "Both")
   - dueDate: When it should happen (relative: "Within 48 hours", "By next meeting", "Week of April 7", or "TBD")
   - sourceType: What evidence supports this step:
     - "commitment" — Directly stated commitment from the meeting
     - "next_step" — Explicitly discussed next step
     - "risk_mitigation" — Action to address a detected risk
     - "recommended" — Suggested best practice (use sparingly)
   - sourceQuote: The exact quote from the transcript that supports this step (if available)

CRITICAL RULES:
- ONLY include steps backed by signal evidence. Do not invent commitments.
- Prefer "commitment" and "next_step" source types over "recommended"
- Maximum 3 "recommended" steps per plan — the rest must be evidence-based
- Order steps chronologically by due date when possible
- If signals are too weak to build a meaningful MAP, return an empty steps array
- Keep the plan actionable and concise — 5-15 steps is ideal

Respond with ONLY valid JSON:
{
  "title": "Company — Deal Action Plan",
  "summary": "Following our discovery call, both teams agreed on a path forward...",
  "steps": [
    {
      "title": "Send revised pricing proposal",
      "description": "Include the volume discount tiers discussed",
      "owner": "Seller",
      "dueDate": "Within 48 hours",
      "sourceType": "commitment",
      "sourceQuote": "I'll have the updated pricing over to you by Thursday"
    }
  ]
}`;

// ── Generation Function ──────────────────────────────────────────────

export interface GenerateMapInput {
  meetingId: string;
  dealContextId?: string;
  meetingTopic?: string;
  signals?: Signal[];
}

export interface GenerateMapResult {
  success: boolean;
  mapId?: string;
  title?: string;
  summary?: string;
  stepCount: number;
  commitmentSteps: number;
  recommendedSteps: number;
  durationMs?: number;
  error?: string;
}

/**
 * Generate a Mutual Action Plan from extracted meeting signals.
 * Fetches signals from the database if not provided directly.
 * Persists the result to mutual_action_plans + map_steps tables.
 */
export async function generateMap(input: GenerateMapInput): Promise<GenerateMapResult> {
  const { meetingId, dealContextId, meetingTopic } = input;
  const startTime = Date.now();

  try {
    // Get signals — use provided or fetch from DB
    const signals = input.signals || await fetchSignals(meetingId);

    if (signals.length === 0) {
      log('info', '[MAP] No signals available for MAP generation', { meetingId });
      return { success: true, stepCount: 0, commitmentSteps: 0, recommendedSteps: 0 };
    }

    // Filter to MAP-relevant signal types
    const relevantSignals = signals.filter((s) =>
      ['commitment', 'stakeholder', 'timeline', 'budget', 'objection', 'risk'].includes(s.type)
    );

    if (relevantSignals.length === 0) {
      log('info', '[MAP] No MAP-relevant signals found', { meetingId, totalSignals: signals.length });
      return { success: true, stepCount: 0, commitmentSteps: 0, recommendedSteps: 0 };
    }

    const userPrompt = buildMapPrompt(relevantSignals, meetingTopic);

    const response = await callClaudeAPI({
      systemPrompt: MAP_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 4096,
    });

    const durationMs = Date.now() - startTime;
    const parsed = parseMapResponse(response.content);

    if (!parsed || parsed.steps.length === 0) {
      log('info', '[MAP] Generation returned no steps', { meetingId, durationMs });
      return { success: true, stepCount: 0, commitmentSteps: 0, recommendedSteps: 0, durationMs };
    }

    // Map generated steps to DB rows (without mapId — createMap handles that)
    const stepRows: Omit<NewMapStep, 'mapId'>[] = parsed.steps.map((s, i) => ({
      sortOrder: i,
      title: s.title,
      description: s.description || null,
      owner: s.owner || null,
      status: 'pending' as const,
      dueDate: s.dueDate || null,
      sourceSignalId: findMatchingSignalId(s, relevantSignals),
      sourceType: s.sourceType as MapStepSource,
    }));

    // Persist
    const map = await createMap({
      dealContextId,
      meetingId,
      title: parsed.title,
      summary: parsed.summary,
      steps: stepRows,
    });

    const commitmentSteps = parsed.steps.filter((s) => s.sourceType === 'commitment').length;
    const recommendedSteps = parsed.steps.filter((s) => s.sourceType === 'recommended').length;

    log('info', '[MAP] Generation complete', {
      meetingId,
      mapId: map.id,
      stepCount: parsed.steps.length,
      commitmentSteps,
      recommendedSteps,
      durationMs,
    });

    return {
      success: true,
      mapId: map.id,
      title: parsed.title,
      summary: parsed.summary,
      stepCount: parsed.steps.length,
      commitmentSteps,
      recommendedSteps,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', '[MAP] Generation failed', { meetingId, error: errorMessage, durationMs });

    return {
      success: false,
      stepCount: 0,
      commitmentSteps: 0,
      recommendedSteps: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

async function fetchSignals(meetingId: string): Promise<Signal[]> {
  const rows = await getSignalsForMeeting(meetingId);
  // Map DB rows to Signal type (db stores confidence as string)
  return rows.map((r) => ({
    type: r.type as Signal['type'],
    value: r.value,
    confidence: Number(r.confidence),
    speaker: r.speaker || undefined,
    quote: r.quote || undefined,
  }));
}

function buildMapPrompt(signals: Signal[], meetingTopic?: string): string {
  const topicLine = meetingTopic ? `Meeting topic: ${meetingTopic}\n\n` : '';

  const signalList = signals
    .map((s, i) => {
      let line = `${i + 1}. [${s.type}] ${s.value} (confidence: ${s.confidence})`;
      if (s.speaker) line += `\n   Speaker: ${s.speaker}`;
      if (s.quote) line += `\n   Quote: "${s.quote}"`;
      return line;
    })
    .join('\n\n');

  return `${topicLine}Extracted signals from the meeting:\n\n${signalList}`;
}

/**
 * Parse Claude's JSON response and validate with Zod.
 */
export function parseMapResponse(content: string): z.infer<typeof mapResponseSchema> | null {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    log('error', '[MAP] Failed to parse JSON response', { contentPreview: content.slice(0, 200) });
    return null;
  }

  const result = mapResponseSchema.safeParse(parsed);

  if (!result.success) {
    log('error', '[MAP] Validation failed', {
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }

  return result.data;
}

/**
 * Try to find the signal ID that best matches a generated step.
 * Returns null if no strong match — this is best-effort attribution.
 */
function findMatchingSignalId(step: MapStepGenerated, _signals: Signal[]): null {
  // For MVP, we don't have signal IDs in the Signal type (they come from DB rows).
  // Full attribution will be added when we pass DB rows with IDs.
  return null;
}
