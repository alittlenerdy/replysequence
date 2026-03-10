/**
 * Anthropic SDK streaming implementation for Claude API
 *
 * Uses Anthropic SDK with streaming for reliable handling in Vercel
 * serverless environments. Streaming keeps the connection alive and
 * prevents timeout issues.
 */

import Anthropic from '@anthropic-ai/sdk';

// Model constant
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// API timeout in milliseconds (20 seconds for Vercel)
export const CLAUDE_API_TIMEOUT_MS = 20 * 1000;

// Pricing per million tokens (Sonnet 4)
export const CLAUDE_PRICING = {
  inputPerMillion: 3.00,
  outputPerMillion: 15.00,
  cacheWritePerMillion: 3.75,  // 25% premium on first cache write
  cacheReadPerMillion: 0.30,   // 90% discount on cache hits
};

// Singleton Anthropic client
let claudeClient: Anthropic | null = null;

/**
 * Get or create Claude client with timeout and retry settings.
 * Uses ANTHROPIC_API_KEY from environment.
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      log('error', 'ANTHROPIC_API_KEY environment variable is not set');
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    claudeClient = new Anthropic({
      apiKey,
      timeout: CLAUDE_API_TIMEOUT_MS,
      maxRetries: 2,
    });

    log('info', 'Claude client initialized', {
      timeout: CLAUDE_API_TIMEOUT_MS,
      maxRetries: 2,
    });
  }
  return claudeClient;
}

/**
 * Logger helper for structured JSON logging
 */
export function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );
}

/**
 * Calculate cost for a Claude API call, with prompt caching support.
 * When cache tokens are provided, they're priced at the discounted cache rates
 * instead of the standard input rate.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
): number {
  // Non-cached input tokens (subtract cached portions)
  const standardInputTokens = Math.max(0, inputTokens - cacheCreationTokens - cacheReadTokens);
  const inputCost = (standardInputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * CLAUDE_PRICING.cacheWritePerMillion;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * CLAUDE_PRICING.cacheReadPerMillion;
  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Call Claude API using Anthropic SDK streaming
 *
 * Uses streaming to keep connection alive and prevent timeout issues
 * in Vercel serverless environments.
 */
export async function callClaudeAPI({
  systemPrompt,
  userPrompt,
  maxTokens = 1024,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  stopReason: string;
}> {
  const startTime = Date.now();

  log('info', 'Claude API streaming request', {
    model: CLAUDE_MODEL,
    systemPromptLength: systemPrompt?.length || 0,
    userPromptLength: userPrompt?.length || 0,
    maxTokens,
  });

  try {
    const client = getClaudeClient();

    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const finalMessage = await stream.finalMessage();

    const elapsed = Date.now() - startTime;

    // Extract text content
    const textBlock = finalMessage.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      log('error', 'No text content in Claude response', {
        contentBlocks: finalMessage.content.length,
      });
      throw new Error('No text content in response');
    }

    const usage = finalMessage.usage;
    const cacheCreationTokens = (usage as unknown as Record<string, number>).cache_creation_input_tokens || 0;
    const cacheReadTokens = (usage as unknown as Record<string, number>).cache_read_input_tokens || 0;

    log('info', 'Claude API streaming success', {
      latency: elapsed,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationTokens,
      cacheReadTokens,
      contentLength: textBlock.text.length,
      stopReason: finalMessage.stop_reason,
    });

    return {
      content: textBlock.text,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationTokens,
      cacheReadTokens,
      stopReason: finalMessage.stop_reason || 'end_turn',
    };
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    const err = error as Error;

    log('error', 'Claude API streaming failed', {
      error: err.message,
      errorName: err.name,
      elapsed,
    });
    throw error;
  }
}
