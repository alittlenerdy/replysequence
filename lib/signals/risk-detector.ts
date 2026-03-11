/**
 * Deal Risk Detector
 *
 * Second downstream consumer of extracted signals.
 * Analyzes signals from a meeting to identify and score deal risks,
 * then writes risk summaries to the deal context.
 *
 * Pipeline: extractSignals() → detectRisks() → updateAccumulatedContext()
 */

import { callClaudeAPI, log } from '@/lib/claude-api';
import { updateAccumulatedContext } from '@/lib/context-store';
import type { Signal } from '@/lib/signals/types';
import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────

export interface DealRisk {
  risk: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'budget' | 'timeline' | 'champion' | 'competition' | 'authority' | 'need' | 'process';
  mitigation: string;
}

const dealRiskSchema = z.object({
  risk: z.string().min(1).max(500),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum(['budget', 'timeline', 'champion', 'competition', 'authority', 'need', 'process']),
  mitigation: z.string().min(1).max(500),
});

const riskResponseSchema = z.object({
  risks: z.array(dealRiskSchema).max(15),
  overallRiskLevel: z.enum(['critical', 'high', 'medium', 'low']),
});

// ── System Prompt ────────────────────────────────────────────────────

const RISK_DETECTION_SYSTEM_PROMPT = `You are a deal risk analyst. Given deal signals extracted from a meeting, identify risks that could prevent the deal from closing.

Evaluate signals across these risk categories (MEDDIC-inspired):
1. **budget** — Financial constraints, approval thresholds, competing spend
2. **timeline** — Rushed deadlines, delays, competing priorities, seasonality
3. **champion** — Weak internal champion, champion leaving, lack of urgency
4. **competition** — Competing solutions, incumbent vendor, build-vs-buy
5. **authority** — Missing decision-maker, unclear approval process, committee decisions
6. **need** — Unclear pain, nice-to-have vs must-have, shifting requirements
7. **process** — Legal/procurement hurdles, security reviews, long eval cycles

For each risk:
- Describe the risk concretely based on the signals
- Assign severity: critical (deal-killing), high (likely to stall), medium (needs attention), low (minor concern)
- Suggest a specific mitigation action

Also provide an overall risk level for the deal based on the combination of risks.

Rules:
- Only flag risks supported by the signals — do not speculate
- If no risks are present, return an empty array with "low" overall risk
- Be specific, not generic (bad: "budget might be an issue", good: "CFO approval required above $25k threshold mentioned")

Respond with ONLY valid JSON:
{
  "risks": [
    {
      "risk": "CFO approval required for deals above $25k — current proposal is $40k",
      "severity": "high",
      "category": "authority",
      "mitigation": "Request a direct meeting with CFO or prepare executive summary with ROI data"
    }
  ],
  "overallRiskLevel": "medium"
}`;

// ── Detection Function ───────────────────────────────────────────────

export interface DetectRisksInput {
  meetingId: string;
  dealContextId?: string;
  signals: Signal[];
  meetingTopic?: string;
}

export interface DetectRisksResult {
  success: boolean;
  risks: DealRisk[];
  overallRiskLevel: string;
  count: number;
  durationMs?: number;
  error?: string;
}

/**
 * Detect deal risks from extracted signals using Claude API.
 * Writes risk summaries to the deal context if dealContextId is provided.
 */
export async function detectRisks(input: DetectRisksInput): Promise<DetectRisksResult> {
  const { meetingId, dealContextId, signals, meetingTopic } = input;
  const startTime = Date.now();

  if (signals.length === 0) {
    return { success: true, risks: [], overallRiskLevel: 'low', count: 0 };
  }

  try {
    const userPrompt = buildRiskPrompt(signals, meetingTopic);

    const response = await callClaudeAPI({
      systemPrompt: RISK_DETECTION_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 2048,
    });

    const durationMs = Date.now() - startTime;
    const parsed = parseRiskResponse(response.content);

    // Write to deal context if linked
    if (dealContextId && parsed.risks.length > 0) {
      await updateAccumulatedContext({
        dealContextId,
        risks: parsed.risks.map((r) => `[${r.severity}/${r.category}] ${r.risk}`),
      });
    }

    log('info', '[RISK-DETECTOR] Detection complete', {
      meetingId,
      signalCount: signals.length,
      riskCount: parsed.risks.length,
      overallRiskLevel: parsed.overallRiskLevel,
      bySeverity: countBySeverity(parsed.risks),
      durationMs,
    });

    return {
      success: true,
      risks: parsed.risks,
      overallRiskLevel: parsed.overallRiskLevel,
      count: parsed.risks.length,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', '[RISK-DETECTOR] Detection failed', {
      meetingId,
      error: errorMessage,
      durationMs,
    });

    return {
      success: false,
      risks: [],
      overallRiskLevel: 'unknown',
      count: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function buildRiskPrompt(signals: Signal[], meetingTopic?: string): string {
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
export function parseRiskResponse(content: string): { risks: DealRisk[]; overallRiskLevel: string } {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    log('error', '[RISK-DETECTOR] Failed to parse JSON response', {
      contentPreview: content.slice(0, 200),
    });
    return { risks: [], overallRiskLevel: 'unknown' };
  }

  const result = riskResponseSchema.safeParse(parsed);

  if (!result.success) {
    log('error', '[RISK-DETECTOR] Validation failed', {
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return { risks: [], overallRiskLevel: 'unknown' };
  }

  return result.data;
}

function countBySeverity(risks: DealRisk[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of risks) {
    counts[r.severity] = (counts[r.severity] || 0) + 1;
  }
  return counts;
}
