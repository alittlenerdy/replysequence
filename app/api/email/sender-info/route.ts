import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { emailConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/email/sender-info
 *
 * Returns the current user's default sending email account.
 * Used by the DraftPreviewModal to show which address an email will be sent from.
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ email: null, provider: null });
    }

    const [connection] = await db
      .select({
        email: emailConnections.email,
        provider: emailConnections.provider,
      })
      .from(emailConnections)
      .where(and(
        eq(emailConnections.userId, dbUser.id),
        eq(emailConnections.isDefault, true),
      ))
      .limit(1);

    if (!connection) {
      return NextResponse.json({ email: null, provider: null });
    }

    return NextResponse.json({
      email: connection.email,
      provider: connection.provider,
    });
  } catch (error) {
    console.error('[SENDER-INFO] Error:', error);
    return NextResponse.json({ email: null, provider: null });
  }
}
