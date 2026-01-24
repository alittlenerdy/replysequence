import { getClaudeClient, CLAUDE_MODEL, calculateCost, log } from './claude-client';
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
  latencyMs?: number;
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
 *
 * @param input - Meeting and transcript context
 * @returns Draft generation result with content and metadata
 */
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const startTime = Date.now();
  const { meetingId, transcriptId, context } = input;

  // Build the prompt
  const userPrompt = buildDiscoveryCallPrompt(context);
  const estimatedInputTokens = estimateTokenCount(DISCOVERY_CALL_SYSTEM_PROMPT + userPrompt);

  log('info', 'Starting draft generation', {
    meetingId,
    transcriptId,
    estimatedInputTokens,
    meetingTopic: context.meetingTopic,
  });

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry loop with exponential backoff
  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      const client = getClaudeClient();

      log('info', 'Calling Claude API', {
        attempt,
        model: CLAUDE_MODEL,
        meetingId,
      });

      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: DISCOVERY_CALL_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const latencyMs = Date.now() - startTime;

      // Extract usage stats
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const costUsd = calculateCost(inputTokens, outputTokens);

      // Extract content
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      const { subject, body } = parseEmailResponse(textContent.text);

      log('info', 'Draft generated successfully', {
        meetingId,
        transcriptId,
        inputTokens,
        outputTokens,
        costUsd: costUsd.toFixed(6),
        latencyMs,
        subjectLength: subject.length,
        bodyLength: body.length,
      });

      // Store draft in database
      const [draft] = await db
        .insert(drafts)
        .values({
          meetingId,
          transcriptId,
          promptType: 'discovery_call',
          subject,
          body,
          fullResponse: textContent.text,
          model: CLAUDE_MODEL,
          inputTokens,
          outputTokens,
          costUsd: costUsd.toFixed(6),
          latencyMs,
          status: 'generated',
        })
        .returning();

      log('info', 'Draft stored in database', {
        draftId: draft.id,
        meetingId,
        costUsd: costUsd.toFixed(6),
      });

      return {
        success: true,
        draftId: draft.id,
        subject,
        body,
        inputTokens,
        outputTokens,
        costUsd,
        latencyMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      log('warn', 'Draft generation attempt failed', {
        meetingId,
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
      });

      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt >= MAX_RETRIES) {
        break;
      }

      // Exponential backoff
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      log('info', 'Retrying after delay', {
        meetingId,
        attempt,
        delayMs,
      });

      await sleep(delayMs);
    }
  }

  // All retries exhausted
  const latencyMs = Date.now() - startTime;
  const errorMessage = lastError?.message || 'Unknown error';

  log('error', 'Draft generation failed after all retries', {
    meetingId,
    transcriptId,
    attempts: attempt,
    error: errorMessage,
    latencyMs,
  });

  // Store failed draft attempt in database
  try {
    const [draft] = await db
      .insert(drafts)
      .values({
        meetingId,
        transcriptId,
        promptType: 'discovery_call',
        model: CLAUDE_MODEL,
        status: 'failed',
        errorMessage,
        latencyMs,
      })
      .returning();

    return {
      success: false,
      draftId: draft.id,
      latencyMs,
      error: errorMessage,
    };
  } catch (dbError) {
    log('error', 'Failed to store failed draft in database', {
      meetingId,
      error: dbError instanceof Error ? dbError.message : 'Unknown error',
    });

    return {
      success: false,
      latencyMs,
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

  // Not retryable: auth errors, validation errors
  if (message.includes('authentication') || message.includes('invalid_api_key')) {
    return false;
  }
  if (message.includes('invalid_request') || message.includes('validation')) {
    return false;
  }

  // Retryable: rate limits, timeouts, server errors
  if (message.includes('rate_limit') || message.includes('rate limit')) {
    return true;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return true;
  }
  if (message.includes('server_error') || message.includes('500')) {
    return true;
  }
  if (message.includes('overloaded') || message.includes('503')) {
    return true;
  }

  // Default to retryable for unknown errors
  return true;
}
