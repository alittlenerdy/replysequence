/**
 * Draft Grading Agent (Phase 1 - Prototype)
 *
 * Uses Claude Haiku to grade drafts on 4 dimensions:
 * 1. Tone - Professional but warm, matches conversation energy
 * 2. Completeness - All action items captured, questions addressed
 * 3. Personalization - Uses names, references specifics, not templated
 * 4. Accuracy - No hallucinations, correct dates/numbers
 *
 * Cost: ~$0.001 per grading
 * Time: ~2 seconds per draft
 */

import Anthropic from '@anthropic-ai/sdk';
import { log } from './claude-api';

// Haiku model for cost-effective grading
export const HAIKU_MODEL = 'claude-haiku-4-20250514';

// Haiku pricing per million tokens
export const HAIKU_PRICING = {
  inputPerMillion: 0.80,
  outputPerMillion: 4.00,
};

// Grading result interface
export interface DraftGradingResult {
  success: boolean;
  // Individual dimension scores (0-100)
  toneScore: number;
  completenessScore: number;
  personalizationScore: number;
  accuracyScore: number;
  // Overall score (average of dimensions)
  overallScore: number;
  // Detailed reasoning from the grader
  gradingNotes: string;
  // Cost tracking
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  gradingDurationMs?: number;
  error?: string;
}

// Grading input interface
export interface GradeDraftInput {
  draftId: string;
  subject: string;
  body: string;
  transcript: string;
  meetingTopic?: string;
  meetingDate?: string;
}

// Singleton Haiku client (separate from main Claude client)
let haikuClient: Anthropic | null = null;

function getHaikuClient(): Anthropic {
  if (!haikuClient) {
    haikuClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 15 * 1000, // 15 seconds for Haiku (faster than Sonnet)
      maxRetries: 2,
    });
    log('info', 'Haiku grading client initialized');
  }
  return haikuClient;
}

// System prompt for the grading agent
const GRADING_SYSTEM_PROMPT = `You are an email quality grading expert. Your job is to evaluate follow-up emails generated from meeting transcripts.

You must grade each email on exactly 4 dimensions, scoring each from 0-100:

1. TONE (0-100)
   - 90-100: Professional yet warm, perfectly matches the conversation's energy
   - 70-89: Generally appropriate tone with minor adjustments needed
   - 50-69: Somewhat off - too formal, too casual, or inconsistent
   - 0-49: Significantly mismatched tone for the context

2. COMPLETENESS (0-100)
   - 90-100: All action items captured, all questions addressed, nothing missed
   - 70-89: Most items captured, one or two minor points missed
   - 50-69: Several items missing or incompletely addressed
   - 0-49: Major gaps, important items not mentioned

3. PERSONALIZATION (0-100)
   - 90-100: Uses names, references specific conversation details, feels tailored
   - 70-89: Some personalization, but could be more specific
   - 50-69: Generic with minimal personal touches
   - 0-49: Could be a template sent to anyone

4. ACCURACY (0-100)
   - 90-100: All facts correct, no hallucinations, dates/numbers accurate
   - 70-89: Minor inaccuracies that don't affect meaning
   - 50-69: Some incorrect or made-up details
   - 0-49: Significant hallucinations or factual errors

IMPORTANT: You MUST respond with ONLY valid JSON in this exact format:
{
  "tone_score": <number 0-100>,
  "completeness_score": <number 0-100>,
  "personalization_score": <number 0-100>,
  "accuracy_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "reasoning": "<2-3 sentences explaining the key factors>"
}

Do not include any text before or after the JSON.`;

/**
 * Grade a draft email using Claude Haiku
 */
export async function gradeDraft(input: GradeDraftInput): Promise<DraftGradingResult> {
  const startTime = Date.now();
  const { draftId, subject, body, transcript, meetingTopic, meetingDate } = input;

  log('info', 'Starting draft grading with Haiku', {
    draftId,
    subjectLength: subject.length,
    bodyLength: body.length,
    transcriptLength: transcript.length,
  });

  // Truncate transcript if too long (Haiku has smaller context window)
  const truncatedTranscript = transcript.length > 8000
    ? transcript.substring(0, 8000) + '... [transcript truncated for grading]'
    : transcript;

  // Build the user prompt
  const userPrompt = `Grade this follow-up email based on the meeting transcript.

MEETING INFO:
- Topic: ${meetingTopic || 'Not specified'}
- Date: ${meetingDate || 'Not specified'}

TRANSCRIPT:
${truncatedTranscript}

EMAIL TO GRADE:
Subject: ${subject}

${body}

Now grade this email on the 4 dimensions (tone, completeness, personalization, accuracy). Return ONLY the JSON response.`;

  try {
    const client = getHaikuClient();

    const message = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500, // Small response needed
      system: GRADING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const gradingDurationMs = Date.now() - startTime;

    // Extract text content
    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in grading response');
    }

    const responseText = textBlock.text.trim();

    // Parse JSON response
    let parsed: {
      tone_score: number;
      completeness_score: number;
      personalization_score: number;
      accuracy_score: number;
      overall_score: number;
      reasoning: string;
    };

    try {
      // Try to extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      log('error', 'Failed to parse grading response', {
        draftId,
        responseText: responseText.substring(0, 200),
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error(`Failed to parse grading response: ${responseText.substring(0, 100)}`);
    }

    // Validate scores are in range
    const validateScore = (score: number, name: string): number => {
      if (typeof score !== 'number' || isNaN(score)) {
        log('warn', `Invalid ${name} score, defaulting to 50`, { draftId, score });
        return 50;
      }
      return Math.max(0, Math.min(100, Math.round(score)));
    };

    const toneScore = validateScore(parsed.tone_score, 'tone');
    const completenessScore = validateScore(parsed.completeness_score, 'completeness');
    const personalizationScore = validateScore(parsed.personalization_score, 'personalization');
    const accuracyScore = validateScore(parsed.accuracy_score, 'accuracy');

    // Calculate overall (average of 4 dimensions)
    const overallScore = Math.round((toneScore + completenessScore + personalizationScore + accuracyScore) / 4);

    // Calculate cost
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const costUsd = (inputTokens / 1_000_000) * HAIKU_PRICING.inputPerMillion +
                    (outputTokens / 1_000_000) * HAIKU_PRICING.outputPerMillion;

    const result: DraftGradingResult = {
      success: true,
      toneScore,
      completenessScore,
      personalizationScore,
      accuracyScore,
      overallScore,
      gradingNotes: parsed.reasoning || 'No reasoning provided',
      inputTokens,
      outputTokens,
      costUsd,
      gradingDurationMs,
    };

    // Console.log scores for verification (as requested in task)
    console.log(JSON.stringify({
      level: 'info',
      message: '=== DRAFT GRADING COMPLETE ===',
      draftId,
      scores: {
        tone: toneScore,
        completeness: completenessScore,
        personalization: personalizationScore,
        accuracy: accuracyScore,
        overall: overallScore,
      },
      notes: parsed.reasoning,
      cost: `$${costUsd.toFixed(6)}`,
      durationMs: gradingDurationMs,
    }));

    return result;
  } catch (error) {
    const gradingDurationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', 'Draft grading failed', {
      draftId,
      error: errorMessage,
      gradingDurationMs,
    });

    return {
      success: false,
      toneScore: 0,
      completenessScore: 0,
      personalizationScore: 0,
      accuracyScore: 0,
      overallScore: 0,
      gradingNotes: `Grading failed: ${errorMessage}`,
      gradingDurationMs,
      error: errorMessage,
    };
  }
}

/**
 * Calculate Haiku API cost
 */
export function calculateHaikuCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * HAIKU_PRICING.outputPerMillion;
  return inputCost + outputCost;
}
