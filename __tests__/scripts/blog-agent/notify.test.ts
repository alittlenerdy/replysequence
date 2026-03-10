import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifySlack } from '@/scripts/blog-agent/notify';

describe('notify', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips notification when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    global.fetch = vi.fn();
    await notifySlack({ title: 'Test', excerpt: 'Test', tags: ['test'], prUrl: 'https://github.com/pr/1', branch: 'blog/test' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends Block Kit message to correct channel', async () => {
    process.env.SLACK_BOT_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    });

    await notifySlack({
      title: 'Why Sales Teams Waste Hours',
      excerpt: 'A deep dive into follow-up friction.',
      tags: ['sales', 'automation'],
      prUrl: 'https://github.com/alittlenerdy/replysequence/pull/42',
      branch: 'blog/2026-03-10-why-sales-teams-waste-hours',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.channel).toBe('C0ALL6NQSLQ');
    expect(body.blocks).toHaveLength(4);
    expect(body.blocks[0].type).toBe('header');
    // First two buttons are approve/reject (no url), third is preview, fourth is view PR
    expect(body.blocks[3].elements[0].action_id).toBe('blog_approve');
    expect(body.blocks[3].elements[1].action_id).toBe('blog_reject');
    expect(body.blocks[3].elements[3].url).toContain('pull/42');
  });

  it('handles Slack API errors gracefully', async () => {
    process.env.SLACK_BOT_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: false, error: 'channel_not_found' }),
    });

    await expect(
      notifySlack({ title: 'Test', excerpt: 'Test', tags: ['test'], prUrl: 'https://github.com/pr/1', branch: 'blog/test' })
    ).resolves.toBeUndefined();
  });
});
