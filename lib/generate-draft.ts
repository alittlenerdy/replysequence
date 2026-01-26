import { callClaudeAPI, CLAUDE_MODEL, calculateCost, log, CLAUDE_API_TIMEOUT_MS } from './claude-api';
import {
  DISCOVERY_CALL_SYSTEM_PROMPT,
  buildDiscoveryCallPrompt,
  estimateTokenCount,
  type DiscoveryCallContext,
} from './prompts/discovery-call';
import { db, drafts } from './db';

// Draft generation configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_OUTPUT_TOKENS = 1024;

/**
 * Result of draft generation
 */
export interface GenerateDraftResult {
  success: boolean;
  draftId?: string;
  subject?: string;
  body?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  generationDurationMs?: number;
  error?: string;
}

/**
 * Input for draft generation
 */
export interface GenerateDraftInput {
  meetingId: string;
  transcriptId: string;
  context: DiscoveryCallContext;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse the generated email into subject and body
 */
function parseEmailResponse(content: string): { subject: string; body: string } {
  const lines = content.trim().split('\n');
  let subject = '';
  let bodyStartIndex = 0;

  // Find subject line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('subject:')) {
      subject = line.substring('subject:'.length).trim();
      bodyStartIndex = i + 1;
      break;
    }
  }

  // Skip blank lines after subject
  while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === '') {
    bodyStartIndex++;
  }

  const body = lines.slice(bodyStartIndex).join('\n').trim();

  return { subject, body };
}

/**
 * Generate a follow-up email draft using Claude API.
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Cost tracking
 * - Latency logging
 * - Automatic DB storage
 * - Timeout handling (25s)
 *
 * @param input - Meeting and transcript context
 * @returns Draft generation result with content and metadata
 */
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const startTime = Date.now();
  const { meetingId, transcriptId, context } = input;

  log('info', 'Starting draft generation', {
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

  // Build the prompt
  let userPrompt: string;
  let estimatedInputTokens: number;

  try {
    userPrompt = buildDiscoveryCallPrompt(context);
    estimatedInputTokens = estimateTokenCount(DISCOVERY_CALL_SYSTEM_PROMPT + userPrompt);

    log('info', 'Prompt built successfully', {
      meetingId,
      estimatedInputTokens,
      promptLength: userPrompt.length,
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
      log('info', 'Calling Claude API via fetch', {
        attempt,
        model: CLAUDE_MODEL,
        meetingId,
        maxTokens: MAX_OUTPUT_TOKENS,
        timeoutMs: CLAUDE_API_TIMEOUT_MS,
      });

      // Use raw fetch() with AbortController for reliable timeout in serverless
      const response = await callClaudeAPI({
        systemPrompt: DISCOVERY_CALL_SYSTEM_PROMPT,
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

      // Extract usage stats
      const inputTokens = response.inputTokens;
      const outputTokens = response.outputTokens;
      const costUsd = calculateCost(inputTokens, outputTokens);

      log('info', 'Token usage calculated', {
        meetingId,
        inputTokens,
        outputTokens,
        costUsd: costUsd.toFixed(6),
      });

      log('info', 'Response content extracted', {
        meetingId,
        contentLength: response.content.length,
      });

      const { subject, body } = parseEmailResponse(response.content);

      log('info', 'Email parsed from response', {
        meetingId,
        hasSubject: !!subject,
        subjectLength: subject.length,
        bodyLength: body.length,
      });

      // Store draft in database
      log('info', 'Saving draft to database', {
        meetingId,
        transcriptId,
      });

      const generationCompletedAt = new Date();
      const totalDurationMs = Date.now() - startTime;

      const [draft] = await db
        .insert(drafts)
        .values({
          meetingId,
          transcriptId,
          subject,
          body,
          model: CLAUDE_MODEL,
          inputTokens,
          outputTokens,
          costUsd: costUsd.toFixed(6),
          generationStartedAt: new Date(startTime),
          generationCompletedAt,
          generationDurationMs: totalDurationMs,
          status: 'generated',
        })
        .returning();

      // This is the success log the user is looking for
      log('info', 'Draft generated and saved', {
        draftId: draft.id,
        meetingId,
        transcriptId,
        cost: costUsd.toFixed(6),
        inputTokens,
        outputTokens,
        generationDurationMs: totalDurationMs,
        subject: subject.substring(0, 50) + (subject.length > 50 ? '...' : ''),
      });

      return {
        success: true,
        draftId: draft.id,
        subject,
        body,
        inputTokens,
        outputTokens,
        costUsd,
        generationDurationMs: totalDurationMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const attemptLatencyMs = Date.now() - attemptStartTime;

      // Detailed error logging
      const errorDetails: Record<string, unknown> = {
        meetingId,
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
        errorName: lastError.name,
        attemptLatencyMs,
      };

      // Check for specific error types
      const errorCode = (lastError as NodeJS.ErrnoException).code;
      if (lastError.message.includes('timeout') || lastError.name === 'TimeoutError' || errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKETTIMEDOUT') {
        errorDetails.errorType = 'timeout';
        errorDetails.timeoutMs = CLAUDE_API_TIMEOUT_MS;
        errorDetails.errorCode = errorCode;
        log('error', 'Claude API timed out after 30 seconds', errorDetails);
      } else if (lastError.message.includes('rate') || lastError.message.includes('429')) {
        errorDetails.errorType = 'rate_limit';
        log('warn', 'Claude API rate limited', errorDetails);
      } else if (lastError.message.includes('authentication') || lastError.message.includes('401')) {
        errorDetails.errorType = 'authentication';
        log('error', 'Claude API authentication failed', errorDetails);
      } else if (lastError.message.includes('invalid') || lastError.message.includes('400')) {
        errorDetails.errorType = 'invalid_request';
        log('error', 'Claude API invalid request', errorDetails);
      } else {
        errorDetails.errorType = 'unknown';
        errorDetails.errorStack = lastError.stack?.substring(0, 500);
        log('error', 'Claude API error', errorDetails);
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);

      if (!isRetryable) {
        log('error', 'Non-retryable error, stopping attempts', {
          meetingId,
          attempt,
          error: lastError.message,
        });
        break;
      }

      if (attempt >= MAX_RETRIES) {
        log('error', 'Max retries reached', {
          meetingId,
          attempts: attempt,
          error: lastError.message,
        });
        break;
      }

      // Exponential backoff
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      log('info', 'Retrying after delay', {
        meetingId,
        attempt,
        nextAttempt: attempt + 1,
        delayMs,
      });

      await sleep(delayMs);
    }
  }

  // All retries exhausted
  const generationDurationMs = Date.now() - startTime;
  const errorMessage = lastError?.message || 'Unknown error';

  log('error', 'Draft generation failed', {
    meetingId,
    transcriptId,
    attempts: attempt,
    error: errorMessage,
    generationDurationMs,
  });

  // Store failed draft attempt in database
  try {
    log('info', 'Saving failed draft record', {
      meetingId,
      transcriptId,
      error: errorMessage,
    });

    const [draft] = await db
      .insert(drafts)
      .values({
        meetingId,
        transcriptId,
        subject: '', // Required field - empty for failed drafts
        body: '', // Required field - empty for failed drafts
        model: CLAUDE_MODEL,
        status: 'failed',
        errorMessage,
        generationStartedAt: new Date(startTime),
        generationCompletedAt: new Date(),
        generationDurationMs,
        retryCount: attempt,
      })
      .returning();

    log('info', 'Failed draft record saved', {
      draftId: draft.id,
      meetingId,
    });

    return {
      success: false,
      draftId: draft.id,
      generationDurationMs,
      error: errorMessage,
    };
  } catch (dbError) {
    const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
    log('error', 'Failed to store failed draft in database', {
      meetingId,
      transcriptId,
      originalError: errorMessage,
      dbError: dbErrorMessage,
    });

    return {
      success: false,
      generationDurationMs,
      error: errorMessage,
    };
  }
}

/**
 * Check if an error is retryable.
 * Rate limits, timeouts, and server errors are retryable.
 * Authentication and validation errors are not.
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Not retryable: auth errors, validation errors
  if (message.includes('authentication') || message.includes('invalid_api_key') || message.includes('401')) {
    return false;
  }
  if (message.includes('invalid_request') || message.includes('validation') || message.includes('400')) {
    return false;
  }

  // Retryable: rate limits, timeouts, server errors
  if (message.includes('rate_limit') || message.includes('rate limit') || message.includes('429')) {
    return true;
  }
  if (message.includes('timeout') || message.includes('timed out') || name.includes('timeout')) {
    return true;
  }
  if (message.includes('server_error') || message.includes('500') || message.includes('503')) {
    return true;
  }
  if (message.includes('overloaded') || message.includes('529')) {
    return true;
  }
  if (message.includes('network') || message.includes('econnreset') || message.includes('enotfound')) {
    return true;
  }

  // Default to retryable for unknown errors
  return true;
}
