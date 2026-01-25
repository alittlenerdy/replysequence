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
    log('error', 'ANTHROPIC_API_KEY environment variable is not set');
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  log('info', 'Calling Claude API via fetch', {
    model: CLAUDE_MODEL,
    maxTokens,
    timeoutMs,
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
  });

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const startTime = Date.now();

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
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startTime;

    // Clear the timeout since request completed
    clearTimeout(timeoutId);

    log('info', 'Claude API response received', {
      status: response.status,
      statusText: response.statusText,
      latencyMs,
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

      log('error', 'Claude API error response', {
        status: response.status,
        error: errorMessage,
      });

      throw new Error(`Claude API error (${response.status}): ${errorMessage}`);
    }

    const data = (await response.json()) as ClaudeResponse;

    log('info', 'Claude API response parsed', {
      stopReason: data.stop_reason,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      contentBlocks: data.content.length,
    });

    // Extract text content
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
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      log('error', 'Claude API request timed out', {
        timeoutMs,
      });
      throw new Error(`Claude API request timed out after ${timeoutMs}ms`);
    }

    // Re-throw other errors
    throw error;
  }
}
