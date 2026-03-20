/**
 * Agent Execution Foundation
 *
 * Shared wrapper for all AI agents. Provides:
 * - Standardized structured logging
 * - Automatic duration tracking
 * - Cost calculation from token usage
 * - Auto-logging to agent_actions table
 * - Consistent error classification
 *
 * Usage:
 *   const result = await runAgent({
 *     name: 'draft-generation',
 *     description: 'Generate follow-up email for Meridian Health call',
 *     userId: '...',
 *     meetingId: '...',
 *     fn: async () => {
 *       const response = await callClaudeAPI({ ... });
 *       return {
 *         data: { subject, body },
 *         tokens: { input: response.inputTokens, output: response.outputTokens },
 *       };
 *     },
 *   });
 */

import { db } from '@/lib/db';
import { agentActions } from '@/lib/db/schema';
import { calculateCost } from '@/lib/claude-api';

// ── Types ────────────────────────────────────────────────────────────

export type AgentName =
  | 'draft-generation'
  | 'signal-extraction'
  | 'next-steps'
  | 'risk-detection'
  | 'crm-auto-populate'
  | 'meeting-memory'
  | 'map-generation'
  | 'sequence-generation'
  | 'sentiment-analysis'
  | 'draft-grading'
  | 'pre-meeting-briefing'
  | 'reply-classification'
  | 'sequence-rewrite'
  | 'pipeline-stage-detection';

export interface AgentTokens {
  input: number;
  output: number;
  cacheCreation?: number;
  cacheRead?: number;
}

export interface AgentResult<T = unknown> {
  data: T;
  tokens?: AgentTokens;
  /** Agent-specific metadata to store in the actions feed */
  metadata?: Record<string, unknown>;
}

export interface RunAgentOptions<T> {
  /** Agent identifier — used in logs and the actions feed */
  name: AgentName;
  /** Human-readable description for the actions feed */
  description: string;
  /** User who triggered this agent */
  userId?: string;
  /** Meeting this agent is processing */
  meetingId?: string;
  /** The agent's execution function */
  fn: () => Promise<AgentResult<T>>;
}

export interface RunAgentOutput<T> {
  success: boolean;
  data?: T;
  durationMs: number;
  costUsd?: number;
  error?: string;
  actionId?: string;
}

// ── Logging ──────────────────────────────────────────────────────────

function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {},
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'agent-core',
      ...data,
    }),
  );
}

// ── Core Runner ──────────────────────────────────────────────────────

/**
 * Execute an agent with automatic logging, cost tracking, and action recording.
 *
 * Does NOT handle retries — each agent owns its own retry logic.
 * This wrapper captures the top-level outcome for the user-facing actions feed.
 */
export async function runAgent<T>(
  options: RunAgentOptions<T>,
): Promise<RunAgentOutput<T>> {
  const { name, description, userId, meetingId, fn } = options;
  const startTime = Date.now();

  log('info', `[AGENT:${name}] started`, {
    agent: name,
    description,
    userId: userId ?? null,
    meetingId: meetingId ?? null,
  });

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;

    // Calculate cost if tokens provided
    let costUsd: number | undefined;
    if (result.tokens) {
      costUsd = calculateCost(
        result.tokens.input,
        result.tokens.output,
        result.tokens.cacheCreation ?? 0,
        result.tokens.cacheRead ?? 0,
      );
    }

    log('info', `[AGENT:${name}] completed`, {
      agent: name,
      durationMs,
      inputTokens: result.tokens?.input ?? 0,
      outputTokens: result.tokens?.output ?? 0,
      costUsd: costUsd ?? 0,
    });

    // Record to agent_actions (fire-and-forget)
    const actionId = await recordAgentAction({
      agentName: name,
      description,
      userId,
      meetingId,
      status: 'success',
      durationMs,
      inputTokens: result.tokens?.input ?? 0,
      outputTokens: result.tokens?.output ?? 0,
      costUsd: costUsd ?? 0,
      metadata: result.metadata ?? null,
      errorMessage: null,
    });

    return {
      success: true,
      data: result.data,
      durationMs,
      costUsd,
      actionId: actionId ?? undefined,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log('error', `[AGENT:${name}] failed`, {
      agent: name,
      durationMs,
      error: errorMessage,
    });

    // Record failure (fire-and-forget)
    const actionId = await recordAgentAction({
      agentName: name,
      description,
      userId,
      meetingId,
      status: 'failed',
      durationMs,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      metadata: null,
      errorMessage,
    });

    return {
      success: false,
      durationMs,
      error: errorMessage,
      actionId: actionId ?? undefined,
    };
  }
}

// ── Action Recording ─────────────────────────────────────────────────

interface RecordActionParams {
  agentName: string;
  description: string;
  userId?: string;
  meetingId?: string;
  status: 'success' | 'failed';
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
}

/**
 * Write a row to agent_actions. Fire-and-forget — never throws.
 * Exported as `recordAgentAction` for agents that manage their own execution
 * (e.g. generate-draft with its own retry loop) but still want to log actions.
 */
export async function recordAgentAction(params: RecordActionParams): Promise<string | null> {
  try {
    const [row] = await db
      .insert(agentActions)
      .values({
        agentName: params.agentName,
        description: params.description,
        userId: params.userId ?? null,
        meetingId: params.meetingId ?? null,
        status: params.status,
        durationMs: params.durationMs,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd: String(params.costUsd),
        metadata: params.metadata,
        errorMessage: params.errorMessage,
      })
      .returning({ id: agentActions.id });

    return row?.id ?? null;
  } catch (err) {
    // Never let action recording break agent execution
    log('warn', 'Failed to record agent action', {
      agent: params.agentName,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
