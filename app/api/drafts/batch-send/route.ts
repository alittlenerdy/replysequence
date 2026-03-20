import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';
import { db, users } from '@/lib/db';
import { drafts, meetings } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const MAX_BATCH_SIZE = 10;

const batchSendSchema = z.object({
  draftIds: z
    .array(z.string().uuid())
    .min(1, 'At least one draft is required')
    .max(MAX_BATCH_SIZE, `Maximum ${MAX_BATCH_SIZE} drafts per batch`),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, batchSendSchema);
    if ('error' in parsed) return parsed.error;
    const { draftIds } = parsed.data;

    // Get DB user
    const [dbUser] = await db
      .select({ id: users.id, emailSendingPaused: users.emailSendingPaused })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.emailSendingPaused) {
      return NextResponse.json(
        { error: 'Email sending is paused for your account due to multiple spam complaints. Please contact support to resolve this.' },
        { status: 403 }
      );
    }

    // Verify ownership of all drafts and get recipient emails
    const ownedDrafts = await db
      .select({
        id: drafts.id,
        status: drafts.status,
        meetingHostEmail: meetings.hostEmail,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(
        and(
          inArray(drafts.id, draftIds),
          eq(meetings.userId, dbUser.id)
        )
      );

    if (ownedDrafts.length === 0) {
      return NextResponse.json({ error: 'No valid drafts found' }, { status: 404 });
    }

    // Filter to only unsent drafts with valid recipients
    const sendable = ownedDrafts.filter(
      (d) => d.status !== 'sent' && d.meetingHostEmail
    );

    if (sendable.length === 0) {
      return NextResponse.json(
        { error: 'No sendable drafts found. Drafts may already be sent or missing recipients.' },
        { status: 400 }
      );
    }

    // Send each draft sequentially with 1-second delays, reusing the existing send endpoint
    const results: Array<{
      draftId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (let i = 0; i < sendable.length; i++) {
      const draft = sendable[i];

      try {
        // Call the existing send endpoint internally via fetch
        const origin = request.headers.get('origin') || request.headers.get('host') || '';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;

        const sendRes = await fetch(`${baseUrl}/api/drafts/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward auth cookies so the send endpoint can authenticate
            cookie: request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            draftId: draft.id,
            recipientEmail: draft.meetingHostEmail,
          }),
        });

        const sendData = await sendRes.json().catch(() => ({}));

        if (sendRes.ok) {
          results.push({ draftId: draft.id, success: true });
        } else {
          results.push({
            draftId: draft.id,
            success: false,
            error: sendData.error || 'Send failed',
          });
        }
      } catch (err) {
        results.push({
          draftId: draft.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      // 1-second delay between sends to avoid rate limits (skip after last)
      if (i < sendable.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(JSON.stringify({
      level: 'info',
      message: 'Batch send completed',
      userId: dbUser.id,
      requested: draftIds.length,
      sendable: sendable.length,
      success: successCount,
      failed: failCount,
    }));

    return NextResponse.json({
      success: true,
      results,
      summary: {
        requested: draftIds.length,
        sent: successCount,
        failed: failCount,
        skipped: draftIds.length - sendable.length,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'drafts-batch-send' },
    });

    console.error('Batch send failed:', error);
    return NextResponse.json(
      { error: 'Batch send failed' },
      { status: 500 }
    );
  }
}
