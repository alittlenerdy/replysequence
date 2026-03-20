/**
 * Reply Intent Classifier
 *
 * Classifies incoming email replies by intent using Claude Haiku.
 * Helps users understand whether a reply signals interest, objection,
 * unsubscribe request, etc. — powering smarter follow-up decisions.
 */

import { db } from '@/lib/db';
import { drafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getClaudeClient, log } from '@/lib/claude-api';
import { runAgent } from './core';
import type { ReplyIntent } from '@/lib/db/schema';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const VALID_INTENTS: ReplyIntent[] = [
  'interested',
  'meeting_requested',
  'more_info',
  'not_now',
  'objection',
  'unsubscribe',
  'auto_reply',
  'other',
];

export interface ReplyClassification {
  intent: ReplyIntent;
  confidence: number;
  summary: string;
}

/**
 * Classify the intent of an email reply using Claude Haiku.
 *
 * Analyzes the reply body in the context of the original email to determine
 * the recipient's intent (interested, objection, unsubscribe, etc.).
 *
 * After classification, the draft record is updated with the result.
 */
export async function classifyReplyIntent(
  draftId: string,
  replyBody: string,
  originalSubject: string,
  originalBody: string,
): Promise<ReplyClassification | null> {
  const result = await runAgent<ReplyClassification | null>({
    name: 'reply-classification',
    description: `Classify reply intent for draft ${draftId.slice(0, 8)}`,
    fn: async () => {
      const client = getClaudeClient();

      const systemPrompt = `You are an email reply intent classifier. Analyze the reply email and classify it into exactly one intent category.

Categories:
- interested: Positive response, wants to continue the conversation
- meeting_requested: Explicitly wants to schedule a meeting or call
- more_info: Asking questions or requesting additional details
- not_now: Timing issue, asks to check back later or not ready yet
- objection: Pushback on price, fit, need, or relevance
- unsubscribe: Wants to stop receiving emails or be removed from list
- auto_reply: Out of office, vacation responder, or automated message
- other: Does not fit any of the above categories

Respond with ONLY valid JSON in this exact format:
{"intent":"<category>","confidence":<0.0-1.0>,"summary":"<one sentence explaining the classification>"}`;

      // Strip HTML from original body for context
      const plainOriginalBody = originalBody.replace(/<[^>]*>/g, '').slice(0, 1000);

      const userPrompt = `Original email subject: ${originalSubject}
Original email body (excerpt): ${plainOriginalBody}

Reply received:
${replyBody.slice(0, 2000)}`;

      const stream = client.messages.stream({
        model: HAIKU_MODEL,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const finalMessage = await stream.finalMessage();

      const textBlock = finalMessage.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in classification response');
      }

      const usage = finalMessage.usage;
      const inputTokens = usage.input_tokens;
      const outputTokens = usage.output_tokens;

      // Parse the JSON response
      let parsed: { intent: string; confidence: number; summary: string };
      try {
        parsed = JSON.parse(textBlock.text.trim());
      } catch {
        log('error', 'Failed to parse classification JSON', { raw: textBlock.text });
        throw new Error('Invalid classification response format');
      }

      // Validate intent
      const intent = VALID_INTENTS.includes(parsed.intent as ReplyIntent)
        ? (parsed.intent as ReplyIntent)
        : 'other';

      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));
      const summary = (parsed.summary || 'Unable to determine intent').slice(0, 500);

      const classification: ReplyClassification = { intent, confidence, summary };

      // Update draft record with classification
      await db
        .update(drafts)
        .set({
          replyIntent: classification.intent,
          replyIntentConfidence: String(classification.confidence),
          replyIntentSummary: classification.summary,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, draftId));

      log('info', 'Reply intent classified', {
        draftId,
        intent: classification.intent,
        confidence: classification.confidence,
      });

      return {
        data: classification,
        tokens: { input: inputTokens, output: outputTokens },
        metadata: {
          draftId,
          intent: classification.intent,
          confidence: classification.confidence,
        },
      };
    },
  });

  return result.data ?? null;
}
