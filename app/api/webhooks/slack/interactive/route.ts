import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const GITHUB_REPO = 'alittlenerdy/replysequence';
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

function verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
  if (!SLACK_SIGNING_SECRET) return false;

  // Reject requests older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}

async function githubApi(endpoint: string, method: string = 'GET', body?: Record<string, unknown>) {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT not configured');

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${error}`);
  }

  return response.json();
}

async function updateSlackMessage(
  responseUrl: string,
  originalBlocks: Record<string, unknown>[],
  action: 'approved' | 'rejected',
  user: string
) {
  // Replace the actions block with a result context block
  const updatedBlocks = originalBlocks.map((block: Record<string, unknown>) => {
    if (block.type === 'actions') {
      const emoji = action === 'approved' ? ':white_check_mark:' : ':x:';
      const text = action === 'approved'
        ? `${emoji} *Approved and merged* by ${user}`
        : `${emoji} *Rejected and closed* by ${user}`;
      return {
        type: 'context',
        elements: [{ type: 'mrkdwn', text }],
      };
    }
    return block;
  });

  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      replace_original: true,
      blocks: updatedBlocks,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';

    // Verify request is from Slack
    if (SLACK_SIGNING_SECRET && !verifySlackRequest(rawBody, timestamp, signature)) {
      console.log(JSON.stringify({ level: 'warn', message: 'Invalid Slack signature' }));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Slack sends interactive payloads as URL-encoded form data
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get('payload');
    if (!payloadStr) {
      return NextResponse.json({ error: 'No payload' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    const action = payload.actions?.[0];
    if (!action) {
      return NextResponse.json({ error: 'No action' }, { status: 400 });
    }

    const actionId = action.action_id;
    const prNumber = action.value;
    const userName = payload.user?.name || payload.user?.username || 'someone';
    const responseUrl = payload.response_url;

    console.log(JSON.stringify({
      level: 'info',
      message: 'Slack interactive action received',
      actionId,
      prNumber,
      user: userName,
    }));

    // Only handle approve/reject actions (preview/view PR are link buttons, handled by Slack)
    if (actionId === 'blog_approve' && prNumber) {
      // Merge the PR
      await githubApi(`/pulls/${prNumber}/merge`, 'PUT', {
        merge_method: 'squash',
        commit_title: `blog: merge blog post PR #${prNumber}`,
      });

      console.log(JSON.stringify({ level: 'info', message: 'Blog PR merged', prNumber }));

      // Update Slack message
      if (responseUrl) {
        await updateSlackMessage(responseUrl, payload.message?.blocks || [], 'approved', userName);
      }

      return NextResponse.json({ ok: true });
    }

    if (actionId === 'blog_reject' && prNumber) {
      // Close the PR
      await githubApi(`/pulls/${prNumber}`, 'PATCH', { state: 'closed' });

      // Delete the branch
      try {
        const pr = await githubApi(`/pulls/${prNumber}`);
        if (pr.head?.ref) {
          await githubApi(`/git/refs/heads/${pr.head.ref}`, 'DELETE');
        }
      } catch {
        // Branch deletion is best-effort
      }

      console.log(JSON.stringify({ level: 'info', message: 'Blog PR rejected and closed', prNumber }));

      // Update Slack message
      if (responseUrl) {
        await updateSlackMessage(responseUrl, payload.message?.blocks || [], 'rejected', userName);
      }

      return NextResponse.json({ ok: true });
    }

    // For link buttons (preview, view PR), Slack handles them client-side
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Slack interactive webhook failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
