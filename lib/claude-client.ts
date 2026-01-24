import Anthropic from '@anthropic-ai/sdk';

// Singleton Claude client instance
let claudeClient: Anthropic | null = null;

/**
 * Get Claude API client with lazy initialization.
 * Uses ANTHROPIC_API_KEY from environment.
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    claudeClient = new Anthropic({
      apiKey,
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Claude client initialized',
    }));
  }

  return claudeClient;
}

// Model constants
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

// Pricing per million tokens (as of 2025)
// Claude Sonnet pricing
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
