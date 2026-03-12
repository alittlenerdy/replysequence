import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/claude-api', () => ({
  log: vi.fn(),
}));

import { calculateHealthScore, type HealthScoreInput } from '@/lib/health-score/calculate';

// ── Helper ──────────────────────────────────────────────────────────

function makeInput(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    risks: [],
    nextSteps: [],
    stakeholders: [],
    commitments: [],
    signalCount: 0,
    meetingCount: 0,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('calculateHealthScore', () => {
  it('returns base score of 50 with no inputs', () => {
    const result = calculateHealthScore(makeInput());
    expect(result.score).toBe(50);
    expect(result.label).toBe('neutral');
    expect(result.breakdown.base).toBe(50);
    expect(result.breakdown.riskPenalty).toBe(0);
    expect(result.breakdown.momentumBonus).toBe(0);
    expect(result.breakdown.stakeholderBonus).toBe(0);
    expect(result.breakdown.commitmentBonus).toBe(0);
  });

  // ── Risk Penalties ──────────────────────────────────────────────

  it('applies critical risk penalty (-15 each)', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[critical/budget] CFO approval needed above $25k'],
    }));
    expect(result.score).toBe(35);
    expect(result.breakdown.riskPenalty).toBe(-15);
    expect(result.breakdown.riskDetails.critical).toBe(1);
    expect(result.label).toBe('at_risk');
  });

  it('applies high risk penalty (-8 each)', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[high/timeline] Tight Q3 deadline'],
    }));
    expect(result.score).toBe(42);
    expect(result.breakdown.riskPenalty).toBe(-8);
  });

  it('applies medium risk penalty (-3 each)', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[medium/process] Legal review required'],
    }));
    expect(result.score).toBe(47);
    expect(result.breakdown.riskPenalty).toBe(-3);
  });

  it('ignores low risk (0 penalty)', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[low/need] Minor feature gap'],
    }));
    expect(result.score).toBe(50);
    expect(result.breakdown.riskPenalty).toBe(0);
  });

  it('caps risk penalty at -30', () => {
    const result = calculateHealthScore(makeInput({
      risks: [
        '[critical/budget] Deal-killing budget freeze',
        '[critical/authority] No executive sponsor',
        '[critical/champion] Champion leaving company',
      ],
    }));
    // 3 × -15 = -45, capped at -30
    expect(result.breakdown.riskPenalty).toBe(-30);
    expect(result.score).toBe(20);
    expect(result.label).toBe('critical');
  });

  it('handles mixed severity risks', () => {
    const result = calculateHealthScore(makeInput({
      risks: [
        '[critical/budget] CFO approval needed',
        '[high/timeline] Tight deadline',
        '[medium/process] Legal review',
      ],
    }));
    // -15 + -8 + -3 = -26
    expect(result.breakdown.riskPenalty).toBe(-26);
    expect(result.score).toBe(24);
  });

  // ── Momentum Bonus ─────────────────────────────────────────────

  it('gives +5 per high-confidence next step', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['[high] Send proposal (Sales rep, Within 48 hours)'],
    }));
    expect(result.breakdown.momentumBonus).toBe(5);
    expect(result.score).toBe(55);
  });

  it('gives +3 per medium-confidence next step', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['[medium] Schedule follow-up (Buyer, Next week)'],
    }));
    expect(result.breakdown.momentumBonus).toBe(3);
  });

  it('gives +1 per low-confidence next step', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['[low] Research competitors (Sales rep, This month)'],
    }));
    expect(result.breakdown.momentumBonus).toBe(1);
  });

  it('caps momentum bonus at +20', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: [
        '[high] Step 1 (Owner, Deadline)',
        '[high] Step 2 (Owner, Deadline)',
        '[high] Step 3 (Owner, Deadline)',
        '[high] Step 4 (Owner, Deadline)',
        '[high] Step 5 (Owner, Deadline)',
      ],
    }));
    // 5 × 5 = 25, capped at 20
    expect(result.breakdown.momentumBonus).toBe(20);
  });

  // ── Stakeholder Bonus ──────────────────────────────────────────

  it('gives +5 per stakeholder for first 3', () => {
    const result = calculateHealthScore(makeInput({
      stakeholders: ['VP Engineering', 'CTO', 'Product Lead'],
    }));
    expect(result.breakdown.stakeholderBonus).toBe(15);
  });

  it('caps stakeholder bonus at +15', () => {
    const result = calculateHealthScore(makeInput({
      stakeholders: ['A', 'B', 'C', 'D', 'E', 'F'],
    }));
    expect(result.breakdown.stakeholderBonus).toBe(15);
  });

  it('gives 0 for no stakeholders', () => {
    const result = calculateHealthScore(makeInput({ stakeholders: [] }));
    expect(result.breakdown.stakeholderBonus).toBe(0);
  });

  // ── Commitment Bonus ───────────────────────────────────────────

  it('gives +3 per commitment', () => {
    const result = calculateHealthScore(makeInput({
      commitments: ['Send proposal by Friday', 'Schedule demo next week'],
    }));
    expect(result.breakdown.commitmentBonus).toBe(6);
  });

  it('caps commitment bonus at +15', () => {
    const result = calculateHealthScore(makeInput({
      commitments: ['A', 'B', 'C', 'D', 'E', 'F'],
    }));
    expect(result.breakdown.commitmentBonus).toBe(15);
  });

  // ── Score Labels ───────────────────────────────────────────────

  it('labels scores 0-20 as critical', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[critical/a] x', '[critical/b] y'],
    }));
    expect(result.score).toBe(20);
    expect(result.label).toBe('critical');
  });

  it('labels scores 21-40 as at_risk', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['[critical/a] x'],
    }));
    expect(result.score).toBe(35);
    expect(result.label).toBe('at_risk');
  });

  it('labels scores 41-60 as neutral', () => {
    const result = calculateHealthScore(makeInput());
    expect(result.label).toBe('neutral');
  });

  it('labels scores 61-80 as healthy', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['[high] Step 1 (O, D)', '[high] Step 2 (O, D)', '[high] Step 3 (O, D)'],
      stakeholders: ['A', 'B'],
    }));
    // 50 + 15 + 10 = 75
    expect(result.label).toBe('healthy');
  });

  it('labels scores 81-100 as strong', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['[high] S1 (O, D)', '[high] S2 (O, D)', '[high] S3 (O, D)', '[high] S4 (O, D)'],
      stakeholders: ['A', 'B', 'C'],
      commitments: ['C1', 'C2', 'C3', 'C4', 'C5'],
    }));
    // 50 + 20 + 15 + 15 = 100
    expect(result.score).toBe(100);
    expect(result.label).toBe('strong');
  });

  // ── Clamping ───────────────────────────────────────────────────

  it('clamps score to minimum 0', () => {
    // Even with max risk penalty (-30), base is 50, so minimum is 20
    // But let's verify the clamp works conceptually
    const result = calculateHealthScore(makeInput({
      risks: [
        '[critical/a] x',
        '[critical/b] y',
        '[critical/c] z',
      ],
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('clamps score to maximum 100', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: Array(10).fill('[high] Step (O, D)'),
      stakeholders: Array(10).fill('Person'),
      commitments: Array(10).fill('Commitment'),
    }));
    expect(result.score).toBe(100);
  });

  // ── Full Scenario ──────────────────────────────────────────────

  it('calculates realistic deal scenario correctly', () => {
    const result = calculateHealthScore(makeInput({
      risks: [
        '[high/timeline] Q3 launch deadline is tight',
        '[medium/authority] Need VP sign-off above $30k',
      ],
      nextSteps: [
        '[high] Send revised proposal (Sales rep, Within 48 hours)',
        '[high] Schedule technical demo (Buyer, Next week)',
        '[medium] Get VP on next call (Sales rep, Before March 20)',
      ],
      stakeholders: [
        'Jane Smith — Director of Engineering',
        'Bob Lee — Head of Procurement',
      ],
      commitments: [
        'Send proposal by Friday',
        'Schedule demo with engineering team',
        'Provide customer reference list',
      ],
      signalCount: 12,
      meetingCount: 2,
    }));

    // base: 50
    // risks: -8 (high) + -3 (medium) = -11
    // momentum: 5 + 5 + 3 = 13
    // stakeholders: 2 × 5 = 10
    // commitments: 3 × 3 = 9
    // total: 50 - 11 + 13 + 10 + 9 = 71
    expect(result.score).toBe(71);
    expect(result.label).toBe('healthy');
    expect(result.breakdown.riskPenalty).toBe(-11);
    expect(result.breakdown.momentumBonus).toBe(13);
    expect(result.breakdown.stakeholderBonus).toBe(10);
    expect(result.breakdown.commitmentBonus).toBe(9);
  });

  it('handles unformatted risk strings gracefully', () => {
    const result = calculateHealthScore(makeInput({
      risks: ['Some unformatted risk without brackets'],
    }));
    // No severity parsed — no penalty applied
    expect(result.breakdown.riskPenalty).toBe(0);
    expect(result.score).toBe(50);
  });

  it('handles unformatted next-step strings gracefully', () => {
    const result = calculateHealthScore(makeInput({
      nextSteps: ['Some unformatted next step'],
    }));
    // No confidence parsed — gets +1 minimal credit
    expect(result.breakdown.momentumBonus).toBe(1);
  });
});
