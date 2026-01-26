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

  log('info', 'Step 15A: callClaudeAPI entry', {
    timeoutMs,
    model: CLAUDE_MODEL,
    systemPromptLength: systemPrompt?.length || 0,
    userPromptLength: userPrompt?.length || 0,
    maxTokens,
  });

  try {
    log('info', 'Step 15B: Creating AbortController');
    const controller = new AbortController();

    log('info', 'Step 15C: Setting up timeout');
    const timeoutId = setTimeout(() => {
      log('warn', 'Step 15-TIMEOUT: AbortController.abort() called', { timeoutMs });
      controller.abort();
    }, timeoutMs);

    log('info', 'Step 15D: Building request body');
    const requestBody = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };

    log('info', 'Step 15E: JSON.stringify request body');
    const bodyString = JSON.stringify(requestBody);
    log('info', 'Step 15F: Request body serialized', { bodyLength: bodyString.length });

    log('info', 'Step 15G: Calling fetch to Claude API');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: bodyString,
      signal: controller.signal,
    });

    log('info', 'Step 15H: Fetch completed, clearing timeout');
    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    log('info', 'Step 15I: Response received', { status: response.status, elapsed });

    if (!response.ok) {
      log('info', 'Step 15J: Response not OK, reading error text');
      const errorText = await response.text();
      log('error', 'Step 15J-ERROR: Claude API error', { status: response.status, error: errorText });
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    log('info', 'Step 15K: Parsing response JSON');
    const data = (await response.json()) as ClaudeResponse;

    log('info', 'Step 15L: Finding text block', { contentBlocks: data.content?.length || 0 });
    const textBlock = data.content.find((b) => b.type === 'text');

    if (!textBlock) {
      log('error', 'Step 15L-ERROR: No text content in response', { content: JSON.stringify(data.content) });
      throw new Error('No text content in response');
    }

    log('info', 'Step 15M: Claude API success', {
      latency: Date.now() - startTime,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      contentLength: textBlock.text.length,
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
      log('error', 'Step 15-ABORT: Request aborted by timeout', { elapsed, timeoutMs });
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    log('error', 'Step 15-CRASH: Claude API request failed', {
      error: err.message,
      errorName: err.name,
      elapsed,
      stack: err.stack?.substring(0, 300),
    });
    throw error;
  }
}
