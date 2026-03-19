/**
 * Signal Extraction Engine
 *
 * Extracts structured deal signals from meeting transcripts using Claude API.
 * Runs alongside draft generation in the webhook processing pipeline.
 *
 * Pipeline: Transcript → extractSignals() → validate with Zod → write to signals table
 */

import { callClaudeAPI, calculateCost, log } from '@/lib/claude-api';
import { recordAgentAction } from '@/lib/agents/core';
import { signalBatchSchema, type Signal } from '@/lib/signals/types';
import { insertSignals, getDealContext, updateHealthScore, upsertDealContext, linkMeetingToDeal } from '@/lib/context-store';
import { generateNextSteps } from '@/lib/signals/next-steps';
import { detectRisks } from '@/lib/signals/risk-detector';
import { generateMap } from '@/lib/map/generate';
import { calculateHealthScore } from '@/lib/health-score/calculate';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ── Extraction Metrics ───────────────────────────────────────────────

/**
 * Structured metric log for signal extraction quality monitoring.
 * All metrics use tag [SIGNAL-METRICS] for Vercel log filtering.
 */
function logMetric(
  event: string,
  data: Record<string, unknown>,
): void {
  log('info', `[SIGNAL-METRICS] ${event}`, data);
}

// ── System Prompt ────────────────────────────────────────────────────

const SIGNAL_EXTRACTION_SYSTEM_PROMPT = `You are a sales intelligence analyst. Your job is to extract structured deal signals from meeting transcripts.

Analyze the transcript and extract signals in these 6 categories:

1. **commitment** — Promises, pledges, or agreements to take action. Examples: "I'll send the proposal by Friday", "We can do a pilot in Q2"
2. **risk** — Concerns, blockers, or red flags that could derail the deal. Examples: "Budget freeze until Q3", "Legal review could take 6 weeks"
3. **stakeholder** — People mentioned who influence the deal. Extract name + role/title when available. Examples: "VP of Engineering Sarah needs to sign off"
4. **objection** — Pushback, resistance, or disagreements. Examples: "That price point is too high for our budget", "We already have a tool for this"
5. **timeline** — Schedule, deadline, or timing mentions. Examples: "We need this deployed before our Q3 launch", "Contract renewal is in September"
6. **budget** — Cost, pricing, or financial mentions. Examples: "Our budget for this is $50k", "We'd need to get CFO approval above $25k"

Rules:
- Only extract signals that are clearly present in the transcript — do not infer or speculate
- Each signal must have a concise "value" summarizing the signal (1-2 sentences max)
- Confidence is 0.0–1.0: use 0.9+ for explicit statements, 0.6-0.8 for implied, below 0.6 for uncertain
- Include the speaker name when identifiable
- Include a direct quote when the signal comes from a specific statement
- Return 0 signals if the transcript contains no sales-relevant content (e.g. internal standups)
- Maximum 50 signals per transcript

Respond with ONLY valid JSON in this exact format:
{
  "signals": [
    {
      "type": "commitment",
      "value": "Prospect agreed to schedule a follow-up demo with their engineering team",
      "confidence": 0.92,
      "speaker": "Jane Smith",
      "quote": "Let me get my engineering lead on the next call, we can do Thursday"
    }
  ]
}`;

// ── Extraction Function ──────────────────────────────────────────────

export interface ExtractSignalsInput {
  meetingId: string;
  transcript: string;
  meetingTopic?: string;
  dealContextId?: string;
}

export interface ExtractSignalsResult {
  success: boolean;
  signals: Signal[];
  signalCount: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  durationMs?: number;
  error?: string;
}

/**
 * Extract deal signals from a meeting transcript using Claude API.
 * Validates the response with Zod and writes to the database.
 */
export async function extractSignals(input: ExtractSignalsInput): Promise<ExtractSignalsResult> {
  const { meetingId, transcript, meetingTopic } = input;
  let { dealContextId } = input;
  const startTime = Date.now();

  if (!transcript || transcript.trim().length < 50) {
    logMetric('skipped_short_transcript', {
      meetingId,
      transcriptLength: transcript?.length || 0,
    });
    return { success: true, signals: [], signalCount: 0 };
  }

  // Auto-resolve deal context if not provided
  if (!dealContextId) {
    dealContextId = await resolveDealContext(meetingId);
  }

  logMetric('extraction_started', { meetingId, transcriptLength: transcript.length, dealContextId: dealContextId || 'none' });

  try {
    const userPrompt = buildUserPrompt(transcript, meetingTopic);

    const response = await callClaudeAPI({
      systemPrompt: SIGNAL_EXTRACTION_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 4096,
    });

    const durationMs = Date.now() - startTime;
    const costUsd = calculateCost(
      response.inputTokens,
      response.outputTokens,
      response.cacheCreationTokens,
      response.cacheReadTokens,
    );

    // Parse and validate the JSON response
    const signals = parseSignalResponse(response.content);

    // Write to database and attach DB IDs back to signals for downstream attribution
    if (signals.length > 0) {
      const insertedRows = await insertSignals({
        meetingId,
        dealContextId,
        signals,
      });

      // Map DB IDs back onto signals so downstream consumers (MAP attribution) can reference them
      // insertSignals preserves order: rows[i] corresponds to signals[i]
      for (let i = 0; i < signals.length && i < insertedRows.length; i++) {
        signals[i].id = insertedRows[i].id;
      }

      // Run downstream consumers in parallel (fire-and-forget)
      // Next-step tracking, risk detection, and MAP generation use the extracted signals
      const downstreamInput = { meetingId, dealContextId, signals, meetingTopic };
      Promise.allSettled([
        generateNextSteps(downstreamInput),
        detectRisks(downstreamInput),
        generateMap(downstreamInput),
      ]).then(async (results) => {
        for (const r of results) {
          if (r.status === 'rejected') {
            log('error', 'Downstream signal consumer failed (non-blocking)', {
              meetingId,
              error: r.reason instanceof Error ? r.reason.message : String(r.reason),
            });
          }
        }

        // Calculate health score after downstream consumers update the deal context
        if (dealContextId) {
          try {
            const ctx = await getDealContext(dealContextId);
            if (ctx) {
              const health = calculateHealthScore({
                risks: (ctx.risks as string[]) || [],
                nextSteps: (ctx.nextSteps as string[]) || [],
                stakeholders: (ctx.stakeholders as string[]) || [],
                commitments: (ctx.commitments as string[]) || [],
                signalCount: ctx.signalCount,
                meetingCount: ctx.meetingCount,
              });
              await updateHealthScore(dealContextId, health.score);
            }
          } catch (err) {
            log('error', 'Health score calculation failed (non-blocking)', {
              meetingId,
              dealContextId,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      });
    }

    // ── Emit metrics ──
    logMetric('extraction_complete', {
      meetingId,
      signalCount: signals.length,
      zeroSignals: signals.length === 0,
      byType: countByType(signals),
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd: costUsd.toFixed(6),
      durationMs,
      transcriptLength: transcript.length,
    });

    // Record agent action for AI transparency feed
    recordAgentAction({
      agentName: 'signal-extraction',
      description: `Extracted ${signals.length} deal signals from meeting`,
      meetingId,
      status: 'success',
      durationMs,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      metadata: {
        signalCount: signals.length,
        byType: countByType(signals),
        dealContextId: dealContextId || null,
      },
      errorMessage: null,
    }).catch(() => { /* fire-and-forget */ });

    return {
      success: true,
      signals,
      signalCount: signals.length,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logMetric('extraction_failed', {
      meetingId,
      error: errorMessage,
      durationMs,
    });

    // Record failed agent action
    recordAgentAction({
      agentName: 'signal-extraction',
      description: `Signal extraction failed for meeting ${meetingId}`,
      meetingId,
      status: 'failed',
      durationMs,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      metadata: null,
      errorMessage,
    }).catch(() => { /* fire-and-forget */ });

    return {
      success: false,
      signals: [],
      signalCount: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function buildUserPrompt(transcript: string, meetingTopic?: string): string {
  const topicLine = meetingTopic ? `Meeting topic: ${meetingTopic}\n\n` : '';

  // Truncate very long transcripts to stay within token limits (~100k chars ≈ 25k tokens)
  const maxLength = 100_000;
  const truncated = transcript.length > maxLength
    ? transcript.slice(0, maxLength) + '\n\n[Transcript truncated]'
    : transcript;

  return `${topicLine}Transcript:\n\n${truncated}`;
}

/**
 * Parse Claude's JSON response and validate with Zod.
 * Handles markdown code fences and extracts the JSON object.
 */
export function parseSignalResponse(content: string): Signal[] {
  // Strip markdown code fences if present
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    logMetric('parse_failure', {
      contentPreview: content.slice(0, 200),
    });
    return [];
  }

  const result = signalBatchSchema.safeParse(parsed);

  if (!result.success) {
    logMetric('validation_failure', {
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return [];
  }

  return result.data.signals;
}

function countByType(signals: Signal[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of signals) {
    counts[s.type] = (counts[s.type] || 0) + 1;
  }
  return counts;
}

// ── Deal Context Auto-Resolution ────────────────────────────────────

/** Free email domains that shouldn't create deal contexts */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
  'protonmail.com', 'proton.me', 'zoho.com', 'ymail.com',
]);

/**
 * Auto-resolve a deal context for a meeting.
 * Looks up the meeting's host email, extracts the company domain,
 * and upserts a deal context. Links the meeting to the deal context.
 * Returns the dealContextId or undefined if resolution fails.
 */
async function resolveDealContext(meetingId: string): Promise<string | undefined> {
  try {
    const [meeting] = await db
      .select({ userId: meetings.userId, hostEmail: meetings.hostEmail, dealContextId: meetings.dealContextId })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) return undefined;

    // If meeting already has a deal context, use it
    if (meeting.dealContextId) return meeting.dealContextId;

    // Need userId to create a deal context (user-scoped)
    if (!meeting.userId) {
      logMetric('deal_context_skip_no_user', { meetingId });
      return undefined;
    }

    const domain = meeting.hostEmail.split('@')[1]?.toLowerCase();
    if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
      logMetric('deal_context_skip_free_email', { meetingId, domain });
      return undefined;
    }

    // Derive company name from domain (e.g., "acme.com" → "Acme")
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    const dealContext = await upsertDealContext({
      userId: meeting.userId,
      companyName,
      companyDomain: domain,
    });

    if (dealContext) {
      // Link meeting to deal context
      await linkMeetingToDeal({ meetingId, dealContextId: dealContext.id });
      logMetric('deal_context_auto_resolved', { meetingId, dealContextId: dealContext.id, companyDomain: domain });
      return dealContext.id;
    }

    return undefined;
  } catch (err) {
    logMetric('deal_context_auto_resolve_failed', {
      meetingId,
      error: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}
