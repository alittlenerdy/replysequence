/**
 * GET /api/chat/conversations — List user's chat conversations
 * DELETE /api/chat/conversations?id=xxx — Delete a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, chatConversations, chatMessages } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if specific conversation requested
  const conversationId = request.nextUrl.searchParams.get('id');

  if (conversationId) {
    // Return single conversation with messages
    const [conv] = await db
      .select()
      .from(chatConversations)
      .where(and(
        eq(chatConversations.id, conversationId),
        eq(chatConversations.userId, user.id),
      ))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        sourceMeetings: chatMessages.sourceMeetings,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt));

    return NextResponse.json({ conversation: conv, messages });
  }

  // List all conversations
  const conversations = await db
    .select({
      id: chatConversations.id,
      title: chatConversations.title,
      meetingId: chatConversations.meetingId,
      messageCount: chatConversations.messageCount,
      lastMessageAt: chatConversations.lastMessageAt,
      createdAt: chatConversations.createdAt,
    })
    .from(chatConversations)
    .where(eq(chatConversations.userId, user.id))
    .orderBy(desc(chatConversations.lastMessageAt))
    .limit(50);

  return NextResponse.json({ conversations });
}

export async function DELETE(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const conversationId = request.nextUrl.searchParams.get('id');
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }

  // Delete conversation (cascades to messages)
  const result = await db
    .delete(chatConversations)
    .where(and(
      eq(chatConversations.id, conversationId),
      eq(chatConversations.userId, user.id),
    ))
    .returning({ id: chatConversations.id });

  if (result.length === 0) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
