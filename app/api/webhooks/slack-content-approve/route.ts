/**
 * Slack Interactive Webhook: Content Approval
 *
 * Handles "Approve & Post" / "Skip" button clicks from the daily content pipeline.
 * On approve: creates a Typefully draft and schedules it to the next free slot.
 * On skip: acknowledges and updates the Slack message.
 *
 * Slack sends interactive payloads as application/x-www-form-urlencoded with a `payload` field.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDraftWithImage } from '@/lib/typefully';

export const dynamic = 'force-dynamic';

function log(level: string, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[CONTENT-APPROVE]', message, ...data }));
}

export async function POST(request: NextRequest) {
  // Slack sends as form-encoded with a `payload` JSON field
  const formData = await request.formData();
  const payloadStr = formData.get('payload');

  if (!payloadStr || typeof payloadStr !== 'string') {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
  }

  let payload: {
    type: string;
    actions: { action_id: string; value: string }[];
    response_url: string;
    user: { id: string; username: string };
  };

  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (payload.type !== 'block_actions' || !payload.actions?.length) {
    return NextResponse.json({ ok: true });
  }

  const action = payload.actions[0];
  const responseUrl = payload.response_url;

  if (action.action_id === 'content_approve') {
    // Parse the approval data
    let data: {
      socialSetId: number;
      xText: string;
      linkedInText: string | null;
      mediaId: string | null;
      title: string;
    };

    try {
      data = JSON.parse(action.value);
    } catch {
      await respondToSlack(responseUrl, ':x: Failed to parse approval data');
      return NextResponse.json({ ok: true });
    }

    try {
      // Create Typefully draft and schedule immediately
      const draft = await createDraftWithImage(data.socialSetId, {
        title: `[Approved] ${data.title}`,
        xText: data.xText,
        linkedInText: data.linkedInText || undefined,
        mediaId: data.mediaId || '',
        scratchpadText: undefined,
      });

      // Schedule it to next free slot
      const typefullyKey = process.env.TYPEFULLY_API_KEY;
      if (typefullyKey) {
        await fetch(`https://api.typefully.com/v2/social-sets/${data.socialSetId}/drafts/${draft.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${typefullyKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publish_at: 'next-free-slot' }),
        });
      }

      log('info', 'Content approved and scheduled', {
        title: data.title,
        draftId: draft.id,
        approvedBy: payload.user.username,
      });

      await respondToSlack(responseUrl,
        `:white_check_mark: *Approved!* "${data.title}" scheduled to next slot in Typefully.\n_Approved by @${payload.user.username}_`
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log('error', 'Approval failed', { error: errMsg, title: data.title });
      await respondToSlack(responseUrl, `:x: Failed to create Typefully draft: ${errMsg}`);
    }
  } else if (action.action_id === 'content_skip') {
    log('info', 'Content skipped', { title: action.value, skippedBy: payload.user.username });
    await respondToSlack(responseUrl,
      `:fast_forward: Skipped "${action.value}"\n_Skipped by @${payload.user.username}_`
    );
  }

  return NextResponse.json({ ok: true });
}

async function respondToSlack(responseUrl: string, text: string) {
  try {
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replace_original: true,
        text,
      }),
    });
  } catch {
    // Best-effort
  }
}
