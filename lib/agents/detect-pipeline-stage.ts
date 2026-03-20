/**
 * Pipeline Stage Auto-Detection Agent
 *
 * Classifies which pipeline stage a deal is in based on meeting transcript
 * content. Uses Claude Haiku for fast, cheap classification.
 *
 * Stages (ordered by progression):
 *   discovery -> qualification -> demo -> proposal -> negotiation ->
 *   verbal_commit -> closed_won | closed_lost
 */

import { db } from '@/lib/db';
import { dealContexts, meetings, transcripts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getClaudeClient, log } from '@/lib/claude-api';
import { runAgent } from './core';
import type { DealStage } from '@/lib/db/schema';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export const PIPELINE_STAGES: DealStage[] = [
  'discovery',
  'qualification',
  'demo',
  'proposal',
  'negotiation',
  'verbal_commit',
  'closed_won',
  'closed_lost',
];

export interface PipelineStageResult {
  stage: DealStage;
  confidence: number;
  signals: string[];
  previousStage: DealStage | null;
}

/**
 * Detect the pipeline stage for a meeting based on its transcript and summary.
 *
 * Fetches the transcript + summary from the database, runs classification
 * via Claude Haiku, and optionally updates the deal context record.
 */
export async function detectPipelineStage(
  meetingId: string,
  userId: string,
  options?: { updateDealContext?: boolean },
): Promise<PipelineStageResult | null> {
  const result = await runAgent<PipelineStageResult | null>({
    name: 'pipeline-stage-detection',
    description: `Detect pipeline stage for meeting ${meetingId.slice(0, 8)}`,
    userId,
    meetingId,
    fn: async () => {
      // Fetch meeting with summary and key decisions
      const [meeting] = await db
        .select({
          id: meetings.id,
          summary: meetings.summary,
          keyDecisions: meetings.keyDecisions,
          keyTopics: meetings.keyTopics,
        })
        .from(meetings)
        .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
        .limit(1);

      if (!meeting) {
        throw new Error('Meeting not found or access denied');
      }

      // Fetch transcript excerpt for richer context
      const [transcript] = await db
        .select({ content: transcripts.content })
        .from(transcripts)
        .where(eq(transcripts.meetingId, meetingId))
        .limit(1);

      const transcriptExcerpt = transcript?.content?.slice(0, 3000) || '';
      const summary = meeting.summary || '';
      const keyDecisions = Array.isArray(meeting.keyDecisions)
        ? (meeting.keyDecisions as unknown as Array<{ decision: string }>).map(d => typeof d === 'string' ? d : d.decision).join('\n- ')
        : '';
      const keyTopics = Array.isArray(meeting.keyTopics)
        ? (meeting.keyTopics as unknown as Array<{ topic: string }>).map(t => typeof t === 'string' ? t : t.topic).join(', ')
        : '';

      if (!summary && !transcriptExcerpt) {
        throw new Error('No summary or transcript available for stage detection');
      }

      // Look up existing deal context for prior stage
      const dealContext = await db
        .select({ id: dealContexts.id, dealStage: dealContexts.dealStage })
        .from(dealContexts)
        .where(eq(dealContexts.lastMeetingId, meetingId))
        .limit(1);

      const previousStage = (dealContext[0]?.dealStage as DealStage) || null;

      // Call Haiku for classification
      const client = getClaudeClient();

      const systemPrompt = `You are a B2B sales pipeline stage classifier. Analyze the meeting content and classify it into exactly one pipeline stage.

Stages (in order of deal progression):
- discovery: Initial exploration of needs, pain points, use cases. Buyer is learning about the product.
- qualification: Assessing fit, budget, authority, timeline (BANT). Deeper questions about requirements.
- demo: Product demonstration, walkthrough, proof of concept, or technical evaluation.
- proposal: Pricing discussed, proposal sent or reviewed, SOW/contract mentioned.
- negotiation: Terms being negotiated, procurement involved, legal review, redlines, discounts discussed.
- verbal_commit: Verbal agreement to proceed, pending paperwork/signatures.
- closed_won: Deal signed, contract executed, payment confirmed.
- closed_lost: Deal lost, went with competitor, budget cut, project cancelled, or ghosted.

Key signals to look for:
- Discovery: "tell me about", "what challenges", "how does your team currently"
- Qualification: "budget", "timeline", "decision maker", "stakeholders involved"
- Demo: "let me show you", "walkthrough", "screen share", "proof of concept", "pilot"
- Proposal: "pricing", "proposal", "quote", "SOW", "contract draft"
- Negotiation: "terms", "discount", "procurement", "legal review", "redline"
- Verbal commit: "we're going with you", "ready to sign", "just need to get approval"
- Closed won: "signed", "executed", "payment processed", "welcome aboard"
- Closed lost: "went another direction", "budget cut", "project on hold", "not a fit"

Respond with ONLY valid JSON in this exact format:
{"stage":"<stage>","confidence":<0.0-1.0>,"signals":["<signal snippet 1>","<signal snippet 2>","<signal snippet 3>"]}

Include 2-5 signal snippets — short excerpts or paraphrases that justify your classification.`;

      const userPrompt = `Meeting summary:
${summary}

${keyTopics ? `Key topics: ${keyTopics}` : ''}
${keyDecisions ? `Key decisions:\n- ${keyDecisions}` : ''}

${transcriptExcerpt ? `Transcript excerpt:\n${transcriptExcerpt}` : ''}

${previousStage ? `Previous stage for this deal: ${previousStage}` : 'No prior stage recorded.'}`;

      const stream = client.messages.stream({
        model: HAIKU_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const finalMessage = await stream.finalMessage();

      const textBlock = finalMessage.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in stage detection response');
      }

      const usage = finalMessage.usage;

      // Parse JSON response
      let parsed: { stage: string; confidence: number; signals: string[] };
      try {
        parsed = JSON.parse(textBlock.text.trim());
      } catch {
        log('error', 'Failed to parse pipeline stage JSON', { raw: textBlock.text });
        throw new Error('Invalid stage detection response format');
      }

      // Validate stage
      const stage = PIPELINE_STAGES.includes(parsed.stage as DealStage)
        ? (parsed.stage as DealStage)
        : 'discovery';

      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));
      const signals = Array.isArray(parsed.signals)
        ? parsed.signals.map((s) => String(s).slice(0, 200)).slice(0, 5)
        : [];

      const detection: PipelineStageResult = {
        stage,
        confidence,
        signals,
        previousStage,
      };

      // Optionally update deal context
      if (options?.updateDealContext !== false && dealContext[0]) {
        await db
          .update(dealContexts)
          .set({
            dealStage: stage,
            updatedAt: new Date(),
          })
          .where(eq(dealContexts.id, dealContext[0].id));

        log('info', 'Deal context stage updated', {
          dealContextId: dealContext[0].id,
          previousStage,
          newStage: stage,
          confidence,
        });
      }

      log('info', 'Pipeline stage detected', {
        meetingId,
        stage,
        confidence,
        signalCount: signals.length,
      });

      return {
        data: detection,
        tokens: {
          input: usage.input_tokens,
          output: usage.output_tokens,
        },
        metadata: {
          meetingId,
          stage,
          confidence,
          previousStage,
        },
      };
    },
  });

  return result.data ?? null;
}
