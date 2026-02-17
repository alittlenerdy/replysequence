import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/preferences - Fetch AI draft preferences
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await db
      .select({
        aiTone: users.aiTone,
        aiCustomInstructions: users.aiCustomInstructions,
        aiSignature: users.aiSignature,
      })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PUT /api/user/preferences - Update AI draft preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { aiTone, aiCustomInstructions, aiSignature } = body;

    // Validate tone
    const validTones = ['professional', 'casual', 'friendly', 'concise'];
    if (aiTone && !validTones.includes(aiTone)) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
    }

    // Validate lengths
    if (aiCustomInstructions && aiCustomInstructions.length > 500) {
      return NextResponse.json({ error: 'Custom instructions too long' }, { status: 400 });
    }
    if (aiSignature && aiSignature.length > 500) {
      return NextResponse.json({ error: 'Signature too long' }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        aiTone: aiTone || 'professional',
        aiCustomInstructions: aiCustomInstructions || null,
        aiSignature: aiSignature || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
