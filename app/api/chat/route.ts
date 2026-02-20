/**
 * POST /api/chat — Conversational AI endpoint for querying meetings.
 *
 * Streams Claude responses via Server-Sent Events (SSE).
 * Uses RAG: searches relevant meetings, builds context, streams answer.
 * Persists conversations and messages for history.
 */

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, chatConversations, chatMessages, meetings } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude-api';
import { searchMeetings, buildMeetingContext, getFullTranscript } from '@/lib/meeting-search';
import type { ChatSourceMeeting, ChatRole } from '@/lib/db/schema';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are ReplySequence AI, a helpful assistant that answers questions about the user's meeting history.

You have access to meeting transcripts, summaries, and metadata. When answering:
- Be specific and cite which meeting your information comes from (mention the meeting title and date)
- If you quote someone, attribute it clearly (e.g., "In the Dec 5 standup, Sarah said...")
- If you're unsure or the information isn't in the provided context, say so honestly
- For action items and decisions, be precise about who owns what
- Keep answers concise but thorough — the user wants quick answers, not essays
- Format your responses with markdown for readability (bold for names/dates, lists for action items)

If no relevant meetings are found, let the user know and suggest they rephrase their question.`;

interface ChatRequestBody {
  message: string;
  conversationId?: string;
  meetingId?: string; // Scope to a single meeting
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Get DB user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { message, conversationId, meetingId } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
  }

  try {
    // 1. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const [conv] = await db
        .insert(chatConversations)
        .values({
          userId: user.id,
          title: message.slice(0, 100),
          meetingId: meetingId || null,
        })
        .returning({ id: chatConversations.id });
      convId = conv.id;
    } else {
      // Verify conversation belongs to user
      const [conv] = await db
        .select({ id: chatConversations.id })
        .from(chatConversations)
        .where(and(
          eq(chatConversations.id, convId),
          eq(chatConversations.userId, user.id),
        ))
        .limit(1);

      if (!conv) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
      }
    }

    // 2. Store user message
    await db.insert(chatMessages).values({
      conversationId: convId,
      role: 'user' as ChatRole,
      content: message,
    });

    // 3. Get conversation history (last 10 messages for context)
    const history = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, convId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(20);

    // 4. Search relevant meetings
    const scopedMeetingId = meetingId || undefined;
    let meetingContext: string;
    let sourceMeetings: ChatSourceMeeting[] = [];

    if (scopedMeetingId) {
      // Single meeting mode — get full transcript
      const fullTranscript = await getFullTranscript(scopedMeetingId, user.id);
      const [meetingData] = await db
        .select({
          id: meetings.id,
          topic: meetings.topic,
          platform: meetings.platform,
          startTime: meetings.startTime,
          summary: meetings.summary,
          participants: meetings.participants,
          duration: meetings.duration,
        })
        .from(meetings)
        .where(and(eq(meetings.id, scopedMeetingId), eq(meetings.userId, user.id)))
        .limit(1);

      if (meetingData) {
        const date = meetingData.startTime
          ? meetingData.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
          : 'Unknown date';
        const platform = meetingData.platform === 'zoom' ? 'Zoom' : meetingData.platform === 'microsoft_teams' ? 'Teams' : 'Google Meet';
        const participants = (meetingData.participants as { user_name: string }[] || []).map(p => p.user_name).join(', ');

        meetingContext = `=== Meeting: ${meetingData.topic || 'Untitled'} ===\n`;
        meetingContext += `Date: ${date} | Platform: ${platform} | Duration: ${meetingData.duration || '?'} min\n`;
        meetingContext += `Participants: ${participants}\n`;
        if (meetingData.summary) meetingContext += `\nSummary: ${meetingData.summary}\n`;
        if (fullTranscript) meetingContext += `\nFull Transcript:\n${fullTranscript}\n`;

        sourceMeetings = [{
          meetingId: meetingData.id,
          topic: meetingData.topic || 'Untitled',
          date: meetingData.startTime?.toISOString() || '',
          platform: meetingData.platform,
        }];
      } else {
        meetingContext = 'Meeting not found.';
      }
    } else {
      // Cross-meeting search
      const searchResults = await searchMeetings({
        userId: user.id,
        query: message,
        limit: 5,
      });

      meetingContext = buildMeetingContext(searchResults);
      sourceMeetings = searchResults.map(r => ({
        meetingId: r.meetingId,
        topic: r.topic,
        date: r.startTime?.toISOString() || '',
        platform: r.platform,
      }));
    }

    // 5. Build messages array for Claude
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [];

    // Add conversation history (skip the last message since we add it with context below)
    for (const msg of history.slice(0, -1)) {
      claudeMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add the current message with meeting context
    const contextualMessage = `Here is the relevant meeting context for the user's question:

<meeting_context>
${meetingContext}
</meeting_context>

User's question: ${message}`;

    claudeMessages.push({ role: 'user', content: contextualMessage });

    // 6. Stream response from Claude
    const client = getClaudeClient();

    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    // Create a ReadableStream that sends SSE events
    const encoder = new TextEncoder();
    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', conversationId: convId })}\n\n`));

          // Send source meetings
          if (sourceMeetings.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', meetings: sourceMeetings })}\n\n`));
          }

          // Stream text chunks
          stream.on('text', (text) => {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
          });

          // Wait for completion
          const finalMessage = await stream.finalMessage();
          inputTokens = finalMessage.usage.input_tokens;
          outputTokens = finalMessage.usage.output_tokens;

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', inputTokens, outputTokens })}\n\n`));
          controller.close();

          // Store assistant message (non-blocking)
          db.insert(chatMessages).values({
            conversationId: convId!,
            role: 'assistant' as ChatRole,
            content: fullResponse,
            sourceMeetings: sourceMeetings.length > 0 ? sourceMeetings : null,
            inputTokens,
            outputTokens,
          }).then(() => {
            // Update conversation metadata
            return db
              .update(chatConversations)
              .set({
                messageCount: history.length + 1, // +1 for assistant message
                lastMessageAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(chatConversations.id, convId!));
          }).catch(err => {
            console.error(JSON.stringify({
              level: 'error',
              tag: '[CHAT]',
              message: 'Failed to persist chat message',
              error: err instanceof Error ? err.message : String(err),
            }));
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      tag: '[CHAT]',
      message: 'Chat API error',
      error: error instanceof Error ? error.message : String(error),
    }));
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
