/**
 * Admin API for Resend — internal route for email operations.
 *
 * Auth: requires CRON_SECRET in Authorization header (same pattern as cron jobs).
 * This allows CLI/agent access without requiring Clerk session.
 *
 * GET  — list recent emails, check domain status
 * POST — send a test email or notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { db } from '@/lib/db';
import { drafts, emailEvents } from '@/lib/db/schema';
import { sql, count } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/admin/resend?action=status|domains|recent-sends|email-stats
 */
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action') || 'status';

  switch (action) {
    case 'status': {
      // Quick health check — verify API key works
      try {
        const { data, error } = await resend.domains.list();
        if (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Resend API error',
            error: error.message,
          });
        }

        const domains = data?.data?.map(d => ({
          id: d.id,
          name: d.name,
          status: d.status,
          region: d.region,
          createdAt: d.created_at,
        })) || [];

        return NextResponse.json({
          status: 'ok',
          apiKeyConfigured: true,
          webhookSecretConfigured: !!process.env.RESEND_WEBHOOK_SECRET,
          fromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
          domains,
        });
      } catch (err) {
        return NextResponse.json({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    case 'domains': {
      try {
        const { data, error } = await resend.domains.list();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get detailed info for each domain (includes DNS records)
        const detailed = await Promise.all(
          (data?.data || []).map(async (d) => {
            try {
              const { data: detail } = await resend.domains.get(d.id);
              return {
                id: d.id,
                name: d.name,
                status: d.status,
                region: d.region,
                records: detail?.records || [],
              };
            } catch {
              return { id: d.id, name: d.name, status: d.status, region: d.region, records: [] };
            }
          })
        );

        return NextResponse.json({ domains: detailed });
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
      }
    }

    case 'recent-sends': {
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
      try {
        const { data, error } = await resend.emails.list();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return the most recent sends
        const emails = (data?.data || []).slice(0, limit).map(e => ({
          id: e.id,
          to: e.to,
          subject: e.subject,
          createdAt: e.created_at,
        }));

        return NextResponse.json({ emails, count: emails.length });
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
      }
    }

    case 'email-stats': {
      // Aggregate email event counts from our DB
      try {
        const stats = await db
          .select({
            eventType: emailEvents.eventType,
            count: count(),
          })
          .from(emailEvents)
          .groupBy(emailEvents.eventType);

        // Count total drafts with resend message IDs (= emails actually sent via Resend)
        const [sentCount] = await db
          .select({ count: count() })
          .from(drafts)
          .where(sql`${drafts.resendMessageId} IS NOT NULL`);

        return NextResponse.json({
          totalSentViaResend: sentCount?.count || 0,
          eventBreakdown: stats.reduce((acc, s) => {
            acc[s.eventType] = s.count;
            return acc;
          }, {} as Record<string, number>),
        });
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
      }
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}. Valid: status, domains, recent-sends, email-stats` },
        { status: 400 }
      );
  }
}

const sendTestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  /** 'test' sends via lib/email.ts, 'raw' sends directly via Resend SDK */
  mode: z.enum(['test', 'raw']).default('test'),
});

/**
 * POST /api/admin/resend — send a test email
 */
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = sendTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { to, subject, body: emailBody, mode } = parsed.data;

    if (mode === 'raw') {
      // Direct Resend SDK send — useful for testing domain deliverability
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ReplySequence <noreply@resend.dev>',
        to: [to],
        subject,
        text: emailBody,
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, messageId: data?.id, mode: 'raw' });
    }

    // Standard send through lib/email.ts (includes HTML formatting, signature, etc.)
    const result = await sendEmail({
      to,
      subject,
      body: emailBody,
      includeSignature: true,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      mode: 'test',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
