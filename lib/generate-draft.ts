/**
 * Draft Generation with Optimized Prompts
 *
 * Key improvements:
 * - Meeting type detection for context-aware prompts
 * - Structured action items with owner/deadline
 * - Quality scoring with issue detection
 * - Hook-driven subject lines
 * - Greeting → Context → Value → CTA structure
 */

import { callClaudeAPI, CLAUDE_MODEL, calculateCost, log, CLAUDE_API_TIMEOUT_MS } from './claude-api';
import {
  OPTIMIZED_SYSTEM_PROMPT,
  buildOptimizedPrompt,
  parseOptimizedResponse,
  formatActionItemsForEmail,
  estimateTokenCount,
  type FollowUpContext,
  type ParsedDraftResponse,
} from './prompts/optimized-followup';
import { detectMeetingType, extractParticipants } from './meeting-type-detector';
import { scoreDraft, type QualityScore } from './quality-scorer';
import { db, drafts } from './db';
import type { ActionItem } from './db/schema';

// Draft generation configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_OUTPUT_TOKENS = 2048; // Reduced from 4096 for faster, punchier drafts

/**
 * Result of draft generation
 */
export interface GenerateDraftResult {
  success: boolean;
  draftId?: string;
  subject?: string;
  body?: string;
  actionItems?: ActionItem[];
  meetingType?: string;
  toneUsed?: string;
  qualityScore?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  generationDurationMs?: number;
  error?: string;
}

/**
 * Input for draft generation (backwards compatible)
 */
export interface GenerateDraftInput {
  meetingId: string;
  transcriptId: string;
  context: {
    meetingTopic: string;
    meetingDate: string;
    hostName: string;
    hostEmail?: string;
    transcript: string;
    senderName?: string;
    companyName?: string;
    recipientName?: string;
    additionalContext?: string;
  };
}

// Re-export for backwards compatibility
export { estimateTokenCount };
export type DiscoveryCallContext = GenerateDraftInput['context'];
export { OPTIMIZED_SYSTEM_PROMPT as DISCOVERY_CALL_SYSTEM_PROMPT };
export function buildDiscoveryCallPrompt(context: DiscoveryCallContext): string {
  return buildOptimizedPrompt(context as FollowUpContext);
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a follow-up email draft using Claude API with optimized prompts.
 *
 * Features:
 * - Meeting type detection
 * - Context-aware prompts
 * - Structured action items
 * - Quality scoring
 * - Retry logic with exponential backoff
 * - Cost tracking
 *
 * @param input - Meeting and transcript context
 * @returns Draft generation result with content and metadata
 */
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const startTime = Date.now();
  const { meetingId, transcriptId, context } = input;

  log('info', 'Starting optimized draft generation', {
    meetingId,
    transcriptId,
    meetingTopic: context.meetingTopic,
    transcriptLength: context.transcript?.length || 0,
  });

  // Verify we have transcript content
  if (!context.transcript || context.transcript.length === 0) {
    log('error', 'Draft generation failed - no transcript content', {
      meetingId,
      transcriptId,
    });
    return {
      success: false,
      error: 'No transcript content provided',
      generationDurationMs: Date.now() - startTime,
    };
  }

  // Detect meeting type and tone
  const detectionResult = detectMeetingType(context.transcript, context.meetingTopic);
  const participants = extractParticipants(context.transcript);

  log('info', 'Meeting context detected', {
    meetingId,
    meetingType: detectionResult.meetingType,
    confidence: detectionResult.confidence,
    tone: detectionResult.tone,
    participantCount: participants.length,
    signals: detectionResult.signals,
  });

  // Build optimized context
  const optimizedContext: FollowUpContext = {
    meetingTopic: context.meetingTopic,
    meetingDate: context.meetingDate,
    hostName: context.hostName,
    hostEmail: context.hostEmail || '',
    transcript: context.transcript,
    meetingType: detectionResult.meetingType,
    detectedTone: detectionResult.tone,
    keyParticipants: participants,
    senderName: context.senderName,
    companyName: context.companyName,
    recipientName: context.recipientName || participants[0], // Default to first participant
    additionalContext: context.additionalContext,
  };

  // Build the prompt
  let userPrompt: string;
  let estimatedInputTokens: number;

  try {
    userPrompt = buildOptimizedPrompt(optimizedContext);
    estimatedInputTokens = estimateTokenCount(OPTIMIZED_SYSTEM_PROMPT + userPrompt);

    log('info', 'Optimized prompt built', {
      meetingId,
      estimatedInputTokens,
      promptLength: userPrompt.length,
      meetingType: detectionResult.meetingType,
    });
  } catch (promptError) {
    const errorMessage = promptError instanceof Error ? promptError.message : 'Unknown prompt error';
    log('error', 'Failed to build prompt', {
      meetingId,
      error: errorMessage,
    });
    return {
      success: false,
      error: `Failed to build prompt: ${errorMessage}`,
      generationDurationMs: Date.now() - startTime,
    };
  }

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry loop with exponential backoff
  while (attempt < MAX_RETRIES) {
    attempt++;
    const attemptStartTime = Date.now();

    try {
      log('info', 'Calling Claude API with optimized prompt', {
        attempt,
        model: CLAUDE_MODEL,
        meetingId,
        maxTokens: MAX_OUTPUT_TOKENS,
        meetingType: detectionResult.meetingType,
      });

      const response = await callClaudeAPI({
        systemPrompt: OPTIMIZED_SYSTEM_PROMPT,
        userPrompt,
        maxTokens: MAX_OUTPUT_TOKENS,
        timeoutMs: CLAUDE_API_TIMEOUT_MS,
      });

      const apiLatencyMs = Date.now() - attemptStartTime;

      log('info', 'Claude API response received', {
        meetingId,
        attempt,
        apiLatencyMs,
        stopReason: response.stopReason,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      });

      // Parse the structured response
      const parsed = parseOptimizedResponse(response.content);

      log('info', 'Response parsed successfully', {
        meetingId,
        hasSubject: !!parsed.subject,
        subjectLength: parsed.subject.length,
        bodyLength: parsed.body.length,
        actionItemCount: parsed.actionItems.length,
        meetingTypeDetected: parsed.meetingTypeDetected,
        toneUsed: parsed.toneUsed,
      });

      // Score the draft quality
      const qualityResult = scoreDraft(parsed, context.transcript);

      log('info', 'Draft quality scored', {
        meetingId,
        overallScore: qualityResult.overall,
        breakdown: qualityResult.breakdown,
        issueCount: qualityResult.issues.length,
      });

      // Calculate costs
      const inputTokens = response.inputTokens;
      const outputTokens = response.outputTokens;
      const costUsd = calculateCost(inputTokens, outputTokens);
      const totalDurationMs = Date.now() - startTime;

      // Append action items to body if they exist
      let finalBody = parsed.body;
      if (parsed.actionItems.length > 0) {
        finalBody += formatActionItemsForEmail(parsed.actionItems);
      }

      // Store draft in database
      const [draft] = await db
        .insert(drafts)
        .values({
          meetingId,
          transcriptId,
          subject: parsed.subject,
          body: finalBody,
          model: CLAUDE_MODEL,
          inputTokens,
          outputTokens,
          costUsd: costUsd.toFixed(6),
          generationStartedAt: new Date(startTime),
          generationCompletedAt: new Date(),
          generationDurationMs: totalDurationMs,
          qualityScore: qualityResult.overall,
          meetingType: parsed.meetingTypeDetected,
          toneUsed: parsed.toneUsed,
          actionItems: parsed.actionItems,
          keyPointsReferenced: parsed.keyPointsReferenced,
          status: 'generated',
        })
        .returning();

      log('info', 'Draft generated and saved with quality scoring', {
        draftId: draft.id,
        meetingId,
        transcriptId,
        cost: costUsd.toFixed(6),
        inputTokens,
        outputTokens,
        generationDurationMs: totalDurationMs,
        qualityScore: qualityResult.overall,
        meetingType: parsed.meetingTypeDetected,
        toneUsed: parsed.toneUsed,
        actionItemCount: parsed.actionItems.length,
        subject: parsed.subject.substring(0, 60),
      });

      return {
        success: true,
        draftId: draft.id,
        subject: parsed.subject,
        body: finalBody,
        actionItems: parsed.actionItems,
        meetingType: parsed.meetingTypeDetected,
        toneUsed: parsed.toneUsed,
        qualityScore: qualityResult.overall,
        inputTokens,
        outputTokens,
        costUsd,
        generationDurationMs: totalDurationMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const attemptLatencyMs = Date.now() - attemptStartTime;

      const errorDetails: Record<string, unknown> = {
        meetingId,
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
        errorName: lastError.name,
        attemptLatencyMs,
      };

      const errorCode = (lastError as NodeJS.ErrnoException).code;
      if (lastError.message.includes('timeout') || lastError.name === 'TimeoutError' || errorCode === 'ETIMEDOUT') {
        errorDetails.errorType = 'timeout';
        log('error', 'Claude API timed out', errorDetails);
      } else if (lastError.message.includes('rate') || lastError.message.includes('429')) {
        errorDetails.errorType = 'rate_limit';
        log('warn', 'Claude API rate limited', errorDetails);
      } else {
        errorDetails.errorType = 'unknown';
        log('error', 'Claude API error', errorDetails);
      }

      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt >= MAX_RETRIES) {
        break;
      }

      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      log('info', 'Retrying after delay', { meetingId, attempt, delayMs });
      await sleep(delayMs);
    }
  }

  // All retries exhausted - store failed draft
  const generationDurationMs = Date.now() - startTime;
  const errorMessage = lastError?.message || 'Unknown error';

  log('error', 'Draft generation failed', {
    meetingId,
    transcriptId,
    attempts: attempt,
    error: errorMessage,
    generationDurationMs,
  });

  try {
    const [draft] = await db
      .insert(drafts)
      .values({
        meetingId,
        transcriptId,
        subject: '',
        body: '',
        model: CLAUDE_MODEL,
        status: 'failed',
        errorMessage,
        generationStartedAt: new Date(startTime),
        generationCompletedAt: new Date(),
        generationDurationMs,
        retryCount: attempt,
        meetingType: detectionResult.meetingType,
      })
      .returning();

    return {
      success: false,
      draftId: draft.id,
      meetingType: detectionResult.meetingType,
      generationDurationMs,
      error: errorMessage,
    };
  } catch (dbError) {
    log('error', 'Failed to store failed draft', {
      meetingId,
      error: dbError instanceof Error ? dbError.message : 'Unknown error',
    });

    return {
      success: false,
      generationDurationMs,
      error: errorMessage,
    };
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Not retryable
  if (message.includes('authentication') || message.includes('401')) return false;
  if (message.includes('invalid_request') || message.includes('400')) return false;

  // Retryable
  if (message.includes('rate') || message.includes('429')) return true;
  if (message.includes('timeout') || name.includes('timeout')) return true;
  if (message.includes('500') || message.includes('503') || message.includes('529')) return true;
  if (message.includes('network') || message.includes('econnreset')) return true;

  return true; // Default to retryable
}
