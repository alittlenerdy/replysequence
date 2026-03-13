/**
 * Document Export API
 *
 * GET /api/drafts/export-document?id=<draftId>&format=<markdown|html|text>
 *
 * Exports a single draft/document in the requested format.
 * HTML format includes print-friendly styling for browser-based PDF export.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { drafts, meetings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { DOCUMENT_TYPE_LABELS } from '@/lib/prompts/document-templates';
import type { DraftType } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const draftId = request.nextUrl.searchParams.get('id');
  const format = request.nextUrl.searchParams.get('format') || 'markdown';

  if (!draftId) {
    return NextResponse.json({ error: 'Missing draft ID' }, { status: 400 });
  }

  // Fetch draft with ownership check
  const [draft] = await db
    .select({
      subject: drafts.subject,
      body: drafts.body,
      draftType: drafts.draftType,
      createdAt: drafts.createdAt,
      meetingTopic: meetings.topic,
      meetingDate: meetings.startTime,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(and(eq(drafts.id, draftId), eq(meetings.userId, userId)))
    .limit(1);

  if (!draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  const typeLabel = DOCUMENT_TYPE_LABELS[(draft.draftType || 'email') as DraftType] || 'Document';
  const dateStr = draft.createdAt ? new Date(draft.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  switch (format) {
    case 'text': {
      const text = `${draft.subject}\n${'='.repeat(draft.subject.length)}\n\nType: ${typeLabel}\nMeeting: ${draft.meetingTopic || 'N/A'}\nDate: ${dateStr}\n\n${stripMarkdown(draft.body)}`;
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slugify(draft.subject)}.txt"`,
        },
      });
    }

    case 'html': {
      const html = buildPrintableHTML(draft.subject, draft.body, typeLabel, draft.meetingTopic || '', dateStr);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    case 'markdown':
    default: {
      const md = `# ${draft.subject}\n\n**Type:** ${typeLabel}  \n**Meeting:** ${draft.meetingTopic || 'N/A'}  \n**Date:** ${dateStr}\n\n---\n\n${draft.body}`;
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slugify(draft.subject)}.md"`,
        },
      });
    }
  }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/---/g, '---')
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function buildPrintableHTML(subject: string, body: string, typeLabel: string, meetingTopic: string, dateStr: string): string {
  // Convert markdown to basic HTML
  const htmlBody = markdownToHTML(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(subject)}</title>
  <style>
    @media print {
      body { margin: 0.75in; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    h2 { font-size: 1.2rem; margin-top: 1.5rem; }
    h3 { font-size: 1.1rem; }
    ul, ol { padding-left: 1.5rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .actions { margin-top: 2rem; text-align: center; }
    .actions button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      margin: 0 8px;
    }
    .actions button:hover { background: #1d4ed8; }
    .actions button.secondary { background: #6b7280; }
    .actions button.secondary:hover { background: #4b5563; }
  </style>
</head>
<body>
  <h1>${escapeHTML(subject)}</h1>
  <div class="meta">
    <strong>${escapeHTML(typeLabel)}</strong>
    ${meetingTopic ? ` &middot; ${escapeHTML(meetingTopic)}` : ''}
    ${dateStr ? ` &middot; ${escapeHTML(dateStr)}` : ''}
  </div>
  ${htmlBody}
  <div class="actions no-print">
    <button onclick="window.print()">Save as PDF</button>
    <button class="secondary" onclick="copyToClipboard()">Copy to Clipboard</button>
  </div>
  <script>
    function copyToClipboard() {
      const content = document.body.innerText;
      navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('.secondary');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy to Clipboard', 2000);
      });
    }
  </script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHTML(md: string): string {
  return md
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[\s]*[-*]\s+(.*$)/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Line breaks to paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<hr>)<\/p>/g, '$1');
}
