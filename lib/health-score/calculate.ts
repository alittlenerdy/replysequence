/**
 * Deal Health Score Calculator
 *
 * Computes a 0-100 health score for a deal based on accumulated signals,
 * risks, next steps, stakeholders, and commitments from the deal context.
 *
 * Formula: Start at 50 (neutral), apply weighted adjustments, clamp to 0-100.
 *
 * Scoring factors:
 * - Risk penalties:       −30 max (critical = −15, high = −8, medium = −3)
 * - Momentum (next steps): +20 max (explicit steps with deadlines)
 * - Stakeholder breadth:   +15 max (more stakeholders = broader buy-in)
 * - Commitment strength:   +15 max (explicit commitments from the meeting)
 */

import { log } from '@/lib/claude-api';

// ── Types ────────────────────────────────────────────────────────────

export interface HealthScoreInput {
  /** Formatted risk strings from deal context: "[severity/category] description" */
  risks: string[];
  /** Formatted next-step strings from deal context: "[confidence] task (owner, deadline)" */
  nextSteps: string[];
  /** Stakeholder names/descriptions accumulated across meetings */
  stakeholders: string[];
  /** Commitment strings accumulated across meetings */
  commitments: string[];
  /** Total signals extracted across all meetings for this deal */
  signalCount: number;
  /** Number of meetings in this deal context */
  meetingCount: number;
}

export interface HealthScoreResult {
  score: number;
  breakdown: HealthScoreBreakdown;
  label: 'critical' | 'at_risk' | 'neutral' | 'healthy' | 'strong';
}

export interface HealthScoreBreakdown {
  base: number;
  riskPenalty: number;
  momentumBonus: number;
  stakeholderBonus: number;
  commitmentBonus: number;
  riskDetails: { critical: number; high: number; medium: number; low: number };
}

// ── Calculator ───────────────────────────────────────────────────────

const BASE_SCORE = 50;

const RISK_WEIGHTS = {
  critical: -15,
  high: -8,
  medium: -3,
  low: 0,
} as const;

const MAX_RISK_PENALTY = -30;
const MAX_MOMENTUM_BONUS = 20;
const MAX_STAKEHOLDER_BONUS = 15;
const MAX_COMMITMENT_BONUS = 15;

/**
 * Calculate a deal health score from accumulated deal context data.
 * Returns a score 0-100 with a breakdown of contributing factors.
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const riskResult = calculateRiskPenalty(input.risks);
  const momentumBonus = calculateMomentumBonus(input.nextSteps);
  const stakeholderBonus = calculateStakeholderBonus(input.stakeholders);
  const commitmentBonus = calculateCommitmentBonus(input.commitments);

  const raw = BASE_SCORE + riskResult.penalty + momentumBonus + stakeholderBonus + commitmentBonus;
  const score = clamp(raw, 0, 100);

  const breakdown: HealthScoreBreakdown = {
    base: BASE_SCORE,
    riskPenalty: riskResult.penalty,
    momentumBonus,
    stakeholderBonus,
    commitmentBonus,
    riskDetails: riskResult.counts,
  };

  const label = scoreToLabel(score);

  log('info', '[HEALTH-SCORE] Calculated', {
    score,
    label,
    breakdown,
    inputSummary: {
      risks: input.risks.length,
      nextSteps: input.nextSteps.length,
      stakeholders: input.stakeholders.length,
      commitments: input.commitments.length,
      signalCount: input.signalCount,
      meetingCount: input.meetingCount,
    },
  });

  return { score, breakdown, label };
}

// ── Scoring Functions ────────────────────────────────────────────────

/**
 * Parse risk severity from formatted risk strings and calculate penalty.
 * Format: "[severity/category] description"
 */
function calculateRiskPenalty(risks: string[]): {
  penalty: number;
  counts: { critical: number; high: number; medium: number; low: number };
} {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const risk of risks) {
    const match = risk.match(/^\[(\w+)\//);
    if (match) {
      const severity = match[1] as keyof typeof counts;
      if (severity in counts) {
        counts[severity]++;
      }
    }
  }

  const rawPenalty =
    counts.critical * RISK_WEIGHTS.critical +
    counts.high * RISK_WEIGHTS.high +
    counts.medium * RISK_WEIGHTS.medium +
    counts.low * RISK_WEIGHTS.low;

  return {
    penalty: Math.max(rawPenalty, MAX_RISK_PENALTY),
    counts,
  };
}

/**
 * Score momentum based on next steps — explicit high-confidence steps
 * with deadlines contribute more than low-confidence predictions.
 */
function calculateMomentumBonus(nextSteps: string[]): number {
  let bonus = 0;

  for (const step of nextSteps) {
    const match = step.match(/^\[(\w+)\]/);
    if (match) {
      const confidence = match[1];
      if (confidence === 'high') bonus += 5;
      else if (confidence === 'medium') bonus += 3;
      else bonus += 1;
    } else {
      // Unformatted step — give minimal credit
      bonus += 1;
    }
  }

  return Math.min(bonus, MAX_MOMENTUM_BONUS);
}

/**
 * Score stakeholder breadth — more unique stakeholders = broader buy-in.
 * Diminishing returns: first 3 count for 5 each, then 3 each, then 1.
 */
function calculateStakeholderBonus(stakeholders: string[]): number {
  const count = stakeholders.length;
  if (count === 0) return 0;
  if (count <= 3) return Math.min(count * 5, MAX_STAKEHOLDER_BONUS);
  if (count <= 5) return Math.min(15 + (count - 3) * 3, MAX_STAKEHOLDER_BONUS);
  return MAX_STAKEHOLDER_BONUS;
}

/**
 * Score commitment strength — more commitments with higher quality = stronger deal.
 * Each commitment adds 3 points, capped at MAX_COMMITMENT_BONUS.
 */
function calculateCommitmentBonus(commitments: string[]): number {
  return Math.min(commitments.length * 3, MAX_COMMITMENT_BONUS);
}

// ── Helpers ──────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToLabel(score: number): HealthScoreResult['label'] {
  if (score <= 20) return 'critical';
  if (score <= 40) return 'at_risk';
  if (score <= 60) return 'neutral';
  if (score <= 80) return 'healthy';
  return 'strong';
}
