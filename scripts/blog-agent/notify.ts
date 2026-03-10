const SLACK_CHANNEL_ID = 'C0ALL6NQSLQ'; // #blog-drafts

export async function notifySlack(params: {
  title: string;
  excerpt: string;
  tags: string[];
  prUrl: string;
  branch: string;
}): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.log(JSON.stringify({ level: 'warn', message: 'SLACK_BOT_TOKEN not set, skipping Slack notification' }));
    return;
  }

  // Extract PR number from URL (e.g., "https://github.com/alittlenerdy/replysequence/pull/7" → "7")
  const prNumber = params.prUrl.split('/').pop() || '';

  // Vercel preview URL pattern for the branch
  const branchSlug = params.branch.replace(/\//g, '-').substring(0, 60);
  const previewUrl = `https://replysequence-git-${branchSlug}-littleghosts.vercel.app`;

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
      block_id: `blog_pr_${prNumber}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Approve & Merge' },
          style: 'primary',
          action_id: 'blog_approve',
          value: prNumber,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Reject' },
          style: 'danger',
          action_id: 'blog_reject',
          value: prNumber,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Preview Site' },
          url: previewUrl,
          action_id: 'blog_preview',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View PR' },
          url: params.prUrl,
          action_id: 'blog_view_pr',
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
