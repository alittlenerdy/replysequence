/**
 * Shared Slack notification helper for cron agents.
 * Posts structured alerts to SLACK_WEBHOOK_URL for centralized monitoring.
 *
 * All agents use the same webhook — messages are differentiated by agent name and color.
 */

const AGENT_COLORS: Record<string, string> = {
  'Token Health': '#3b82f6',      // blue
  'Webhook Health': '#ef4444',    // red
  'Conversion Nudge': '#8b5cf6',  // purple
  'Waitlist Nudge': '#f59e0b',    // amber
  'Blog Agent': '#10b981',        // green
};

interface AgentSlackParams {
  agent: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  details?: Record<string, string | number | boolean | null>;
  durationMs?: number;
}

/**
 * Post an agent status update to Slack via incoming webhook.
 * Silently skips if SLACK_WEBHOOK_URL is not configured.
 */
export async function notifyAgentSlack({
  agent,
  status,
  summary,
  details,
  durationMs,
}: AgentSlackParams): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const icon = status === 'error' ? ':red_circle:' : status === 'warning' ? ':large_yellow_circle:' : ':white_check_mark:';
  const color = status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : (AGENT_COLORS[agent] || '#6b7280');

  const fields: { title: string; value: string; short: boolean }[] = [];

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      if (value === null || value === undefined) continue;
      fields.push({
        title: key,
        value: String(value),
        short: String(value).length < 30,
      });
    }
  }

  if (durationMs !== undefined) {
    fields.push({
      title: 'Duration',
      value: durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`,
      short: true,
    });
  }

  const payload = {
    text: `${icon} *${agent}*: ${summary}`,
    attachments: [
      {
        color,
        fields: fields.length > 0 ? fields : undefined,
        footer: `ReplySequence Agent Monitor`,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Slack agent notification failed',
        agent,
        status: res.status,
      }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Slack agent notification error',
      agent,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}
