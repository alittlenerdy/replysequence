/**
 * Buyer Intent Detection from Reply Signals
 *
 * Analyzes behavioral engagement patterns to detect:
 * 1. Buying signals — fast replies, multi-opens, link clicks, stakeholder forwarding
 * 2. Competitive evaluation signals — comparison page clicks, pricing page visits, delayed-then-rapid engagement
 * 3. Disengagement signals — declining open rates, no replies after opens, increasing response delays
 *
 * Feeds detected signals into the deal_context for Deal Health Scoring.
 *
 * Data sources:
 * - email_events table (opens, clicks, timing patterns)
 * - drafts table (sent/replied timestamps, engagement metrics)
 * - sequence_steps table (multi-touch engagement patterns)
 * - email_sequences table (sequence-level engagement)
 */

import { db } from '@/lib/db';
import {
  drafts,
  emailEvents,
  emailSequences,
  sequenceSteps,
  meetings,
  signals,
  dealContexts,
} from '@/lib/db/schema';
import { eq, and, desc, sql, gte, isNotNull } from 'drizzle-orm';
import { insertSignals, getDealContext, updateHealthScore, upsertDealContext, linkMeetingToDeal } from '@/lib/context-store';
import { calculateHealthScore } from '@/lib/health-score/calculate';
import type { Signal } from '@/lib/signals/types';

// ── Types ───────────────────────────────────────────────────────────

export type IntentSignalCategory = 'buying' | 'competitive' | 'disengagement';

export interface IntentSignal {
  category: IntentSignalCategory;
  signalName: string;
  description: string;
  confidence: number; // 0.0–1.0
  evidence: string;
  recipientEmail: string;
}

export interface BuyerIntentResult {
  success: boolean;
  signals: IntentSignal[];
  recipientEmail: string;
  overallIntent: 'hot' | 'warm' | 'neutral' | 'cooling' | 'cold';
  intentScore: number; // -100 to +100
  error?: string;
}

// ── Thresholds ──────────────────────────────────────────────────────

const FAST_REPLY_HOURS = 4; // Reply within 4 hours = buying signal
const QUICK_OPEN_MINUTES = 30; // Open within 30 minutes = high interest
const MULTI_OPEN_THRESHOLD = 3; // 3+ opens = strong interest / forwarding
const SLOW_RESPONSE_DAYS = 5; // No reply after 5 days of open = cooling
const CLICK_WEIGHT = 2; // Clicks are 2x stronger signal than opens

// ── Signal Detection Functions ──────────────────────────────────────

function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'buyer-intent',
      ...data,
    })
  );
}

interface DraftEngagement {
  draftId: string;
  meetingId: string;
  sentAt: Date | null;
  sentTo: string | null;
  repliedAt: Date | null;
  openedAt: Date | null;
  openCount: number | null;
  clickedAt: Date | null;
  clickCount: number | null;
  subject: string;
}

interface SequenceEngagement {
  sequenceId: string;
  meetingId: string;
  recipientEmail: string;
  status: string;
  pauseReason: string | null;
  totalSteps: number;
  completedSteps: number;
  steps: Array<{
    stepNumber: number;
    status: string;
    sentAt: Date | null;
    openedAt: Date | null;
    clickedAt: Date | null;
    repliedAt: Date | null;
  }>;
}

/**
 * Detect buying signals from engagement data
 */
function detectBuyingSignals(
  draftEngagements: DraftEngagement[],
  sequenceEngagements: SequenceEngagement[],
  recipientEmail: string
): IntentSignal[] {
  const signals: IntentSignal[] = [];

  // 1. Fast reply detection
  for (const d of draftEngagements) {
    if (d.sentAt && d.repliedAt) {
      const replyHours = (d.repliedAt.getTime() - d.sentAt.getTime()) / (1000 * 60 * 60);
      if (replyHours <= FAST_REPLY_HOURS) {
        signals.push({
          category: 'buying',
          signalName: 'fast_reply',
          description: `Replied within ${Math.round(replyHours * 10) / 10} hours to "${d.subject}"`,
          confidence: Math.min(0.95, 0.7 + (FAST_REPLY_HOURS - replyHours) / FAST_REPLY_HOURS * 0.25),
          evidence: `Sent: ${d.sentAt.toISOString()}, Replied: ${d.repliedAt.toISOString()}`,
          recipientEmail,
        });
      }
    }
  }

  // 2. Multi-open detection (possible forwarding to stakeholders)
  for (const d of draftEngagements) {
    if (d.openCount && d.openCount >= MULTI_OPEN_THRESHOLD) {
      signals.push({
        category: 'buying',
        signalName: 'multi_open',
        description: `Email "${d.subject}" opened ${d.openCount} times — likely forwarded to stakeholders`,
        confidence: Math.min(0.9, 0.6 + (d.openCount - MULTI_OPEN_THRESHOLD) * 0.05),
        evidence: `${d.openCount} opens on draft ${d.draftId}`,
        recipientEmail,
      });
    }
  }

  // 3. Quick open after send
  for (const d of draftEngagements) {
    if (d.sentAt && d.openedAt) {
      const openMinutes = (d.openedAt.getTime() - d.sentAt.getTime()) / (1000 * 60);
      if (openMinutes <= QUICK_OPEN_MINUTES) {
        signals.push({
          category: 'buying',
          signalName: 'quick_open',
          description: `Opened "${d.subject}" within ${Math.round(openMinutes)} minutes of delivery`,
          confidence: 0.65,
          evidence: `Opened in ${Math.round(openMinutes)}m`,
          recipientEmail,
        });
      }
    }
  }

  // 4. Link clicks (strong intent)
  for (const d of draftEngagements) {
    if (d.clickCount && d.clickCount > 0) {
      signals.push({
        category: 'buying',
        signalName: 'link_click',
        description: `Clicked ${d.clickCount} link(s) in "${d.subject}"`,
        confidence: Math.min(0.9, 0.7 + d.clickCount * 0.05),
        evidence: `${d.clickCount} clicks on draft ${d.draftId}`,
        recipientEmail,
      });
    }
  }

  // 5. Sequence engagement acceleration (replying to early steps)
  for (const seq of sequenceEngagements) {
    if (seq.pauseReason === 'recipient_replied') {
      const repliedStep = seq.steps.find(s => s.repliedAt);
      if (repliedStep && repliedStep.stepNumber <= 2) {
        signals.push({
          category: 'buying',
          signalName: 'early_sequence_reply',
          description: `Replied to step ${repliedStep.stepNumber} of ${seq.totalSteps}-step sequence`,
          confidence: 0.85,
          evidence: `Sequence ${seq.sequenceId} paused due to reply at step ${repliedStep.stepNumber}`,
          recipientEmail,
        });
      }
    }
  }

  return signals;
}

/**
 * Detect competitive evaluation signals
 */
function detectCompetitiveSignals(
  draftEngagements: DraftEngagement[],
  sequenceEngagements: SequenceEngagement[],
  recipientEmail: string
): IntentSignal[] {
  const signals: IntentSignal[] = [];

  // 1. Delayed engagement burst — no activity for days then sudden opens/clicks
  for (const d of draftEngagements) {
    if (d.sentAt && d.openedAt && d.clickedAt) {
      const daysToOpen = (d.openedAt.getTime() - d.sentAt.getTime()) / (1000 * 60 * 60 * 24);
      const openToClick = (d.clickedAt.getTime() - d.openedAt.getTime()) / (1000 * 60);

      // Opened after 2+ days but clicked quickly after opening
      if (daysToOpen > 2 && openToClick < 60) {
        signals.push({
          category: 'competitive',
          signalName: 'delayed_engagement_burst',
          description: `Opened "${d.subject}" after ${Math.round(daysToOpen)} days, then clicked within ${Math.round(openToClick)}m — possible competitive evaluation`,
          confidence: 0.6,
          evidence: `${Math.round(daysToOpen)}d to open, ${Math.round(openToClick)}m to click`,
          recipientEmail,
        });
      }
    }
  }

  // 2. Re-engagement after sequence — if they come back and engage after a sequence completed/was cancelled
  for (const seq of sequenceEngagements) {
    if (seq.status === 'completed') {
      const lateEngagement = seq.steps.find(s => {
        if (!s.sentAt || !s.openedAt) return false;
        const daysSinceSend = (s.openedAt.getTime() - s.sentAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceSend > 7; // Opened more than a week after send
      });

      if (lateEngagement) {
        signals.push({
          category: 'competitive',
          signalName: 'late_reengagement',
          description: `Re-engaged with completed sequence after extended delay — likely shopping competitors`,
          confidence: 0.55,
          evidence: `Sequence ${seq.sequenceId} completed, late open on step ${lateEngagement.stepNumber}`,
          recipientEmail,
        });
      }
    }
  }

  return signals;
}

/**
 * Detect disengagement signals
 */
function detectDisengagementSignals(
  draftEngagements: DraftEngagement[],
  sequenceEngagements: SequenceEngagement[],
  recipientEmail: string
): IntentSignal[] {
  const signals: IntentSignal[] = [];

  // 1. Opens without reply — looked but didn't respond
  for (const d of draftEngagements) {
    if (d.openedAt && !d.repliedAt && d.sentAt) {
      const daysSinceOpen = (Date.now() - d.openedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceOpen > SLOW_RESPONSE_DAYS) {
        signals.push({
          category: 'disengagement',
          signalName: 'open_no_reply',
          description: `Opened "${d.subject}" ${Math.round(daysSinceOpen)} days ago but hasn't replied`,
          confidence: Math.min(0.85, 0.5 + daysSinceOpen * 0.05),
          evidence: `Opened ${d.openedAt.toISOString()}, no reply after ${Math.round(daysSinceOpen)} days`,
          recipientEmail,
        });
      }
    }
  }

  // 2. Declining engagement across sequence steps
  for (const seq of sequenceEngagements) {
    if (seq.steps.length >= 2) {
      const earlySteps = seq.steps.filter(s => s.stepNumber <= Math.ceil(seq.totalSteps / 2));
      const lateSteps = seq.steps.filter(s => s.stepNumber > Math.ceil(seq.totalSteps / 2));

      const earlyEngagement = earlySteps.filter(s => s.openedAt || s.clickedAt).length / Math.max(earlySteps.length, 1);
      const lateEngagement = lateSteps.filter(s => s.openedAt || s.clickedAt).length / Math.max(lateSteps.length, 1);

      if (earlyEngagement > 0.5 && lateEngagement < 0.2) {
        signals.push({
          category: 'disengagement',
          signalName: 'declining_engagement',
          description: `Engagement dropped from ${Math.round(earlyEngagement * 100)}% (early) to ${Math.round(lateEngagement * 100)}% (late steps)`,
          confidence: 0.7,
          evidence: `Sequence ${seq.sequenceId}: early=${earlyEngagement.toFixed(2)}, late=${lateEngagement.toFixed(2)}`,
          recipientEmail,
        });
      }
    }
  }

  // 3. Full sequence with zero engagement
  for (const seq of sequenceEngagements) {
    if (seq.status === 'completed' && seq.completedSteps >= 2) {
      const anyEngagement = seq.steps.some(s => s.openedAt || s.clickedAt || s.repliedAt);
      if (!anyEngagement) {
        signals.push({
          category: 'disengagement',
          signalName: 'zero_engagement',
          description: `Completed ${seq.completedSteps}-step sequence with zero engagement`,
          confidence: 0.8,
          evidence: `Sequence ${seq.sequenceId}: ${seq.completedSteps} steps sent, 0 opens/clicks/replies`,
          recipientEmail,
        });
      }
    }
  }

  return signals;
}

/**
 * Calculate overall intent score from detected signals
 */
function calculateIntentScore(signals: IntentSignal[]): { score: number; label: BuyerIntentResult['overallIntent'] } {
  let score = 0;

  for (const signal of signals) {
    const weight = signal.confidence;
    switch (signal.category) {
      case 'buying':
        score += weight * 30;
        break;
      case 'competitive':
        // Competitive signals are slightly negative (uncertainty)
        score -= weight * 10;
        break;
      case 'disengagement':
        score -= weight * 25;
        break;
    }
  }

  // Clamp to -100 to +100
  score = Math.max(-100, Math.min(100, Math.round(score)));

  let label: BuyerIntentResult['overallIntent'];
  if (score >= 50) label = 'hot';
  else if (score >= 20) label = 'warm';
  else if (score >= -20) label = 'neutral';
  else if (score >= -50) label = 'cooling';
  else label = 'cold';

  return { score, label };
}

// ── Main Entry Point ────────────────────────────────────────────────

/**
 * Analyze buyer intent for a specific recipient based on their engagement patterns
 */
export async function analyzeBuyerIntent(
  userId: string,
  recipientEmail: string
): Promise<BuyerIntentResult> {
  try {
    log('info', 'Analyzing buyer intent', { userId, recipientEmail });

    // 1. Get draft engagements for this recipient
    const draftRows = await db
      .select({
        draftId: drafts.id,
        meetingId: drafts.meetingId,
        sentAt: drafts.sentAt,
        sentTo: drafts.sentTo,
        repliedAt: drafts.repliedAt,
        openedAt: drafts.openedAt,
        openCount: drafts.openCount,
        clickedAt: drafts.clickedAt,
        clickCount: drafts.clickCount,
        subject: drafts.subject,
      })
      .from(drafts)
      .where(
        and(
          eq(drafts.sentTo, recipientEmail),
          isNotNull(drafts.sentAt)
        )
      )
      .orderBy(desc(drafts.sentAt))
      .limit(20);

    // Find the userId from meeting ownership
    const draftEngagements: DraftEngagement[] = draftRows.map(d => ({
      draftId: d.draftId,
      meetingId: d.meetingId,
      sentAt: d.sentAt,
      sentTo: d.sentTo,
      repliedAt: d.repliedAt,
      openedAt: d.openedAt,
      openCount: d.openCount,
      clickedAt: d.clickedAt,
      clickCount: d.clickCount,
      subject: d.subject,
    }));

    // 2. Get sequence engagements
    const seqRows = await db
      .select({
        sequenceId: emailSequences.id,
        meetingId: emailSequences.meetingId,
        recipientEmail: emailSequences.recipientEmail,
        status: emailSequences.status,
        pauseReason: emailSequences.pauseReason,
        totalSteps: emailSequences.totalSteps,
        completedSteps: emailSequences.completedSteps,
      })
      .from(emailSequences)
      .where(
        and(
          eq(emailSequences.userId, userId),
          eq(emailSequences.recipientEmail, recipientEmail)
        )
      )
      .orderBy(desc(emailSequences.createdAt))
      .limit(10);

    const sequenceEngagements: SequenceEngagement[] = [];
    for (const seq of seqRows) {
      const steps = await db
        .select({
          stepNumber: sequenceSteps.stepNumber,
          status: sequenceSteps.status,
          sentAt: sequenceSteps.sentAt,
          openedAt: sequenceSteps.openedAt,
          clickedAt: sequenceSteps.clickedAt,
          repliedAt: sequenceSteps.repliedAt,
        })
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, seq.sequenceId))
        .orderBy(sequenceSteps.stepNumber);

      sequenceEngagements.push({
        sequenceId: seq.sequenceId,
        meetingId: seq.meetingId,
        recipientEmail: seq.recipientEmail,
        status: seq.status,
        pauseReason: seq.pauseReason,
        totalSteps: seq.totalSteps,
        completedSteps: seq.completedSteps,
        steps,
      });
    }

    // 3. Detect signals in each category
    const buyingSignals = detectBuyingSignals(draftEngagements, sequenceEngagements, recipientEmail);
    const competitiveSignals = detectCompetitiveSignals(draftEngagements, sequenceEngagements, recipientEmail);
    const disengagementSignals = detectDisengagementSignals(draftEngagements, sequenceEngagements, recipientEmail);

    const allSignals = [...buyingSignals, ...competitiveSignals, ...disengagementSignals];

    // 4. Calculate overall intent
    const { score, label } = calculateIntentScore(allSignals);

    log('info', 'Buyer intent analysis complete', {
      userId,
      recipientEmail,
      buyingSignals: buyingSignals.length,
      competitiveSignals: competitiveSignals.length,
      disengagementSignals: disengagementSignals.length,
      intentScore: score,
      overallIntent: label,
    });

    // 5. Write signals to deal context if a deal context exists for this recipient's domain
    await writeToDealContext(userId, recipientEmail, allSignals, draftEngagements);

    return {
      success: true,
      signals: allSignals,
      recipientEmail,
      overallIntent: label,
      intentScore: score,
    };
  } catch (error) {
    log('error', 'Buyer intent analysis failed', {
      userId,
      recipientEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      signals: [],
      recipientEmail,
      overallIntent: 'neutral',
      intentScore: 0,
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

/**
 * Write intent signals to the deal context / signals table
 */
async function writeToDealContext(
  userId: string,
  recipientEmail: string,
  intentSignals: IntentSignal[],
  draftEngagements: DraftEngagement[]
): Promise<void> {
  if (intentSignals.length === 0) return;

  // Resolve the deal context from the recipient's email domain
  const domain = recipientEmail.split('@')[1]?.toLowerCase();
  if (!domain) return;

  const FREE_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'me.com', 'live.com', 'protonmail.com', 'proton.me',
  ]);
  if (FREE_DOMAINS.has(domain)) return;

  try {
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const dealContext = await upsertDealContext({
      userId,
      companyName,
      companyDomain: domain,
    });

    if (!dealContext) return;

    // Get a meetingId from the most recent draft engagement
    const meetingId = draftEngagements[0]?.meetingId;
    if (!meetingId) return;

    // Map intent signals to the existing signal format
    // We store them as 'risk' type for disengagement, 'commitment' for buying, 'objection' for competitive
    const signalRecords: Signal[] = intentSignals.map(s => {
      let signalType: Signal['type'];
      switch (s.category) {
        case 'buying':
          signalType = 'commitment';
          break;
        case 'competitive':
          signalType = 'objection';
          break;
        case 'disengagement':
          signalType = 'risk';
          break;
      }
      return {
        type: signalType,
        value: `[${s.category.toUpperCase()}] ${s.signalName}: ${s.description}`,
        confidence: s.confidence,
        speaker: recipientEmail,
        quote: s.evidence,
      };
    });

    await insertSignals({
      meetingId,
      dealContextId: dealContext.id,
      signals: signalRecords,
    });

    // Recalculate health score
    const ctx = await getDealContext(dealContext.id);
    if (ctx) {
      const health = calculateHealthScore({
        risks: (ctx.risks as string[]) || [],
        nextSteps: (ctx.nextSteps as string[]) || [],
        stakeholders: (ctx.stakeholders as string[]) || [],
        commitments: (ctx.commitments as string[]) || [],
        signalCount: ctx.signalCount,
        meetingCount: ctx.meetingCount,
      });
      await updateHealthScore(dealContext.id, health.score);
    }

    log('info', 'Intent signals written to deal context', {
      dealContextId: dealContext.id,
      signalCount: signalRecords.length,
      recipientEmail,
    });
  } catch (error) {
    log('warn', 'Failed to write intent signals to deal context', {
      recipientEmail,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Analyze buyer intent for all active recipients of a user
 * Used by the cron job to batch-process intent analysis
 */
export async function analyzeAllRecipientIntent(
  userId: string
): Promise<{ processed: number; errors: number }> {
  // Get distinct recipient emails from recent drafts and sequences
  const recentRecipients = await db
    .select({ email: drafts.sentTo })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, userId),
        isNotNull(drafts.sentTo),
        isNotNull(drafts.sentAt),
        gte(drafts.sentAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      )
    )
    .groupBy(drafts.sentTo)
    .limit(50);

  let processed = 0;
  let errors = 0;

  for (const row of recentRecipients) {
    if (!row.email) continue;
    const result = await analyzeBuyerIntent(userId, row.email);
    if (result.success) {
      processed++;
    } else {
      errors++;
    }
  }

  return { processed, errors };
}
