import Anthropic from '@anthropic-ai/sdk';

// Singleton Claude client instance
let claudeClient: Anthropic | null = null;

// API timeout in milliseconds (20 seconds for Vercel serverless)
export const CLAUDE_API_TIMEOUT_MS = 20 * 1000;

/**
 * Get Claude API client with lazy initialization.
 * Uses ANTHROPIC_API_KEY from environment.
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Log API key status for debugging
    log('info', 'Checking ANTHROPIC_API_KEY', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'missing',
    });

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

// Model constants - using claude-sonnet-4-20250514 (latest Sonnet)
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// Pricing per million tokens (as of 2025)
// Claude Sonnet 4.5 pricing
export const CLAUDE_PRICING = {
  inputPerMillion: 3.00,  // $3 per million input tokens
  outputPerMillion: 15.00, // $15 per million output tokens
};

/**
 * Calculate cost for a Claude API call
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion;
  return inputCost + outputCost;
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
