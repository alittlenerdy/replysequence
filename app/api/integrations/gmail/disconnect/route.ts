import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, emailConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE() {
  const tag = '[GMAIL-DISCONNECT]';

  try {
    // 1. Auth check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find user by clerkId
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      console.log(JSON.stringify({
        level: 'error',
        tag: `${tag}-1`,
        message: 'User not found in database',
        clerkId,
      }));
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Delete Gmail connections for this user
    const deleted = await db
      .delete(emailConnections)
      .where(
        and(
          eq(emailConnections.userId, dbUser.id),
          eq(emailConnections.provider, 'gmail')
        )
      )
      .returning();

    console.log(JSON.stringify({
      level: 'info',
      tag: `${tag}-2`,
      message: 'Gmail connection disconnected',
      userId: dbUser.id,
      deletedCount: deleted.length,
    }));

    return NextResponse.json({
      success: true,
      message: 'Gmail disconnected successfully',
      deletedCount: deleted.length,
    });
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      tag: `${tag}-3`,
      message: 'Failed to disconnect Gmail',
      error: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
}
