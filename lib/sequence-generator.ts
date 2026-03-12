/**
 * Follow-Up Sequence Generator
 *
 * Given a meeting context (topic, summary, action items, recipient),
 * generates a multi-step email sequence via Claude:
 *   Step 1: 48-hour check-in
 *   Step 2: 1-week value nudge
 *   Step 3: 2-week breakup / next-steps reminder
 *
 * The initial draft (step 0) is the existing draft already sent.
 * This generator creates the follow-up steps only.
 */

import { callClaudeAPI, CLAUDE_MODEL, calculateCost, log } from './claude-api';
import { db, emailSequences, sequenceSteps } from './db';
import type { SequenceStepStatus } from './db/schema';

// Step definitions with default delays
const SEQUENCE_STEPS = [
  { stepNumber: 1, stepType: 'check_in', delayHours: 48, label: '48-hour check-in' },
  { stepNumber: 2, stepType: 'value_nudge', delayHours: 168, label: '1-week value nudge' },
  { stepNumber: 3, stepType: 'breakup', delayHours: 336, label: '2-week closing nudge' },
] as const;

interface SequenceContext {
  meetingTopic: string;
  meetingSummary: string;
  actionItems: string[];
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  initialSubject: string;
  initialBody: string;
}

interface GeneratedStep {
  stepNumber: number;
  stepType: string;
  subject: string;
  body: string;
  delayHours: number;
}

interface GenerateSequenceResult {
  success: boolean;
  sequenceId?: string;
  steps?: GeneratedStep[];
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  error?: string;
}

const SYSTEM_PROMPT = `You are a sales follow-up email assistant. You write concise, professional follow-up emails that feel human — not templated or pushy.

Rules:
- Keep each email under 150 words
- Reference specific details from the meeting (names, decisions, action items)
- Each step should have a different angle — don't repeat the same message
- Use the recipient's first name
- Include a clear, low-friction CTA (question, not demand)
- Never use "just following up" or "touching base" — be specific about value
- Match the tone of the initial email that was already sent
- Subject lines should be short (under 50 chars), may reference the thread`;

function buildPrompt(ctx: SequenceContext): string {
  const actionItemsList = ctx.actionItems.length > 0
    ? ctx.actionItems.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
    : '  (none captured)';

  return `Generate a 3-step follow-up email sequence for this meeting.

MEETING CONTEXT:
- Topic: ${ctx.meetingTopic}
- Summary: ${ctx.meetingSummary}
- Action Items:
${actionItemsList}
- Recipient: ${ctx.recipientName} <${ctx.recipientEmail}>
- Sender: ${ctx.senderName}

INITIAL EMAIL ALREADY SENT:
Subject: ${ctx.initialSubject}
Body: ${ctx.initialBody}

Generate exactly 3 follow-up emails in this JSON format:
\`\`\`json
[
  {
    "stepNumber": 1,
    "stepType": "check_in",
    "subject": "...",
    "body": "...",
    "delayHours": 48
  },
  {
    "stepNumber": 2,
    "stepType": "value_nudge",
    "subject": "...",
    "body": "...",
    "delayHours": 168
  },
  {
    "stepNumber": 3,
    "stepType": "breakup",
    "subject": "...",
    "body": "...",
    "delayHours": 336
  }
]
\`\`\`

Step 1 (48h check-in): Reference a specific action item or decision. Ask if they need anything.
Step 2 (1-week nudge): Provide additional value — a relevant insight, resource, or next-step suggestion.
Step 3 (2-week closing): Friendly close-the-loop message. Give them an easy out while leaving the door open.

Return ONLY the JSON array, no other text.`;
}

function parseSequenceResponse(content: string): GeneratedStep[] | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((step: Record<string, unknown>, i: number) => ({
      stepNumber: (step.stepNumber as number) || i + 1,
      stepType: (step.stepType as string) || SEQUENCE_STEPS[i]?.stepType || 'follow_up',
      subject: String(step.subject || ''),
      body: String(step.body || ''),
      delayHours: (step.delayHours as number) || SEQUENCE_STEPS[i]?.delayHours || 48 * (i + 1),
    }));
  } catch {
    return null;
  }
}

/**
 * Generate a follow-up sequence for a meeting and persist it.
 */
export async function generateSequence({
  userId,
  meetingId,
  draftId,
  context,
}: {
  userId: string;
  meetingId: string;
  draftId?: string;
  context: SequenceContext;
}): Promise<GenerateSequenceResult> {
  try {
    log('info', 'Generating follow-up sequence', { meetingId, recipientEmail: context.recipientEmail });

    const result = await callClaudeAPI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPrompt(context),
      maxTokens: 2048,
    });

    const steps = parseSequenceResponse(result.content);
    if (!steps || steps.length === 0) {
      log('error', 'Failed to parse sequence response', { content: result.content.substring(0, 500) });
      return { success: false, error: 'Failed to parse Claude response' };
    }

    const costUsd = calculateCost(result.inputTokens, result.outputTokens, 0, 0);

    // Insert sequence + steps in a transaction
    const [sequence] = await db.insert(emailSequences).values({
      userId,
      meetingId,
      draftId: draftId || null,
      recipientEmail: context.recipientEmail,
      recipientName: context.recipientName,
      status: 'active',
      totalSteps: steps.length,
      completedSteps: 0,
      meetingTopic: context.meetingTopic,
      meetingSummary: context.meetingSummary,
      actionItems: context.actionItems,
    }).returning({ id: emailSequences.id });

    const sequenceId = sequence.id;

    // Insert all steps
    await db.insert(sequenceSteps).values(
      steps.map((step) => ({
        sequenceId,
        stepNumber: step.stepNumber,
        stepType: step.stepType,
        subject: step.subject,
        body: step.body,
        delayHours: step.delayHours,
        status: 'pending' as SequenceStepStatus,
      }))
    );

    log('info', 'Follow-up sequence created', {
      sequenceId,
      meetingId,
      stepCount: steps.length,
      costUsd: costUsd.toFixed(6),
    });

    return {
      success: true,
      sequenceId,
      steps,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd,
    };
  } catch (error) {
    log('error', 'Sequence generation failed', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
