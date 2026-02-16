import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, users, emailConnections } from '@/lib/db';

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db
      .delete(emailConnections)
      .where(
        and(
          eq(emailConnections.userId, dbUser.id),
          eq(emailConnections.provider, 'outlook')
        )
      );

    console.log(JSON.stringify({
      level: 'info',
      tag: '[OUTLOOK-DISCONNECT]',
      message: 'Outlook disconnected successfully',
      userId: dbUser.id,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: '[OUTLOOK-DISCONNECT-ERROR]',
      message: 'Failed to disconnect Outlook',
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
