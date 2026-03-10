const SLACK_CHANNEL_ID = 'C0ALL6NQSLQ'; // #blog-drafts

export async function notifySlack(params: {
  title: string;
  excerpt: string;
  tags: string[];
  prUrl: string;
}): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.log(JSON.stringify({ level: 'warn', message: 'SLACK_BOT_TOKEN not set, skipping Slack notification' }));
    return;
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Blog Draft Ready for Review' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${params.title}*\n\n${params.excerpt}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Tags: ${params.tags.map((t) => `\`${t}\``).join(' ')}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Review PR' },
          url: params.prUrl,
          style: 'primary',
        },
      ],
    },
  ];

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL_ID,
        blocks,
        text: `New blog draft: ${params.title}`, // fallback
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.log(JSON.stringify({ level: 'error', message: 'Slack notification failed', error: data.error }));
    } else {
      console.log(JSON.stringify({ level: 'info', message: 'Slack notification sent', channel: SLACK_CHANNEL_ID }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Slack notification failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}
