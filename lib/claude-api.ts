/**
 * Raw fetch() implementation for Claude API
 *
 * Uses native fetch with AbortController for reliable timeout handling
 * in Vercel serverless environments where the Anthropic SDK timeout
 * mechanisms don't work properly.
 */

// Model constant
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// API timeout in milliseconds (30 seconds)
export const CLAUDE_API_TIMEOUT_MS = 30000;

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
 * Call Claude API using raw fetch() with AbortController timeout
 *
 * setTimeout WILL fire even if fetch hangs because it runs on a
 * different part of the event loop (timers phase vs poll phase).
 */
export async function callClaudeAPI(params: {
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
  const {
    systemPrompt,
    userPrompt,
    maxTokens = 1024,
    timeoutMs = CLAUDE_API_TIMEOUT_MS,
  } = params;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    log('error', 'ANTHROPIC_API_KEY is not set');
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const startTime = Date.now();

  log('info', 'Claude API: Starting', {
    model: CLAUDE_MODEL,
    maxTokens,
    timeoutMs,
    promptLengths: { system: systemPrompt.length, user: userPrompt.length },
  });

  // Create AbortController for timeout
  const controller = new AbortController();

  // Force abort after timeout - setTimeout WILL fire even if fetch hangs
  const timeoutId = setTimeout(() => {
    const elapsed = Date.now() - startTime;
    log('error', 'Claude API: TIMEOUT - forcing abort', { timeoutMs, elapsed });
    controller.abort();
  }, timeoutMs);

  try {
    log('info', 'Claude API: Calling fetch()');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    // Clear timeout - fetch completed
    clearTimeout(timeoutId);

    const fetchMs = Date.now() - startTime;
    log('info', 'Claude API: Fetch returned', {
      status: response.status,
      fetchMs,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorBody) as ClaudeErrorResponse;
        errorMessage = errorJson.error?.message || errorBody;
      } catch {
        errorMessage = errorBody;
      }
      log('error', 'Claude API: HTTP error', { status: response.status, error: errorMessage });
      throw new Error(`Claude API error (${response.status}): ${errorMessage}`);
    }

    log('info', 'Claude API: Parsing response JSON');
    const data = (await response.json()) as ClaudeResponse;

    const totalMs = Date.now() - startTime;
    log('info', 'Claude API: Success', {
      stopReason: data.stop_reason,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      totalMs,
    });

    const textBlock = data.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new Error('No text content in Claude response');
    }

    return {
      content: textBlock.text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      stopReason: data.stop_reason,
    };
  } catch (error) {
    // Always clear timeout on any exit
    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;

    // Handle abort (timeout triggered)
    if (error instanceof Error && error.name === 'AbortError') {
      log('error', 'Claude API: AbortError caught', { elapsed, timeoutMs });
      throw new Error(`Claude API timeout after ${timeoutMs}ms (elapsed: ${elapsed}ms)`);
    }

    // Log and re-throw other errors
    log('error', 'Claude API: Error', {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'unknown',
      elapsed,
    });
    throw error;
  }
}
