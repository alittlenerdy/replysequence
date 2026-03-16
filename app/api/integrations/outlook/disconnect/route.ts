import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, emailConnections, users } from '@/lib/db';
import { userOnboarding } from '@/lib/db/schema';

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

    // Check if any email connections remain for this user
    const remainingEmail = await db
      .select({ id: emailConnections.id })
      .from(emailConnections)
      .where(eq(emailConnections.userId, dbUser.id))
      .limit(1);

    // If no email connections remain, reset the onboarding emailConnected flag
    if (remainingEmail.length === 0) {
      await db
        .update(userOnboarding)
        .set({ emailConnected: false, updatedAt: new Date() })
        .where(eq(userOnboarding.clerkId, userId));
    }

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
