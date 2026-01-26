/**
 * Raw fetch() implementation for Claude API
 *
 * Uses native fetch with AbortController for reliable timeout handling
 * in Vercel serverless environments where the Anthropic SDK timeout
 * mechanisms don't work properly.
 */

// Model constant
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// API timeout in milliseconds (25 seconds - leave buffer for Vercel)
export const CLAUDE_API_TIMEOUT_MS = 25000;

// Pricing per million tokens
export const CLAUDE_PRICING = {
  inputPerMillion: 3.00,
  outputPerMillion: 15.00,
};

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
 * Calculate cost for a Claude API call
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion;
  return inputCost + outputCost;
}

/**
 * Claude API response types
 */
interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: ClaudeTextBlock[];
  model: string;
  stop_reason: string;
  usage: ClaudeUsage;
}

interface ClaudeErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Call Claude API using EXACT pattern from working test endpoint
 *
 * Uses AbortController with detailed logging between each step
 * to identify where any hang occurs.
 */
export async function callClaudeAPI({
  systemPrompt,
  userPrompt,
  maxTokens = 1024,
  timeoutMs = CLAUDE_API_TIMEOUT_MS,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
}> {
  const startTime = Date.now();

  log('info', 'Starting Claude API request', { timeoutMs, model: CLAUDE_MODEL });

  try {
    // Use EXACT same pattern as working test endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    log('info', 'Calling fetch to Claude API');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    log('info', 'Claude API response received', { status: response.status, elapsed });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'Claude API error', { status: response.status, error: errorText });
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    log('info', 'Parsing Claude API response');
    const data = (await response.json()) as ClaudeResponse;

    log('info', 'Finding text block in response');
    const textBlock = data.content.find((b) => b.type === 'text');

    if (!textBlock) {
      log('error', 'No text content in Claude response', { content: JSON.stringify(data.content) });
      throw new Error('No text content in response');
    }

    log('info', 'Claude API success', {
      latency: Date.now() - startTime,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    });

    return {
      content: textBlock.text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      stopReason: data.stop_reason,
    };
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    const err = error as Error;

    if (err.name === 'AbortError') {
      log('error', 'Request timeout - aborted', { elapsed, timeoutMs });
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    log('error', 'Claude API request failed', { error: err.message, elapsed });
    throw error;
  }
}
