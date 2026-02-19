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
        hourlyRate: users.hourlyRate,
        userRole: users.userRole,
        aiOnboardingComplete: users.aiOnboardingComplete,
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
    const { aiTone, aiCustomInstructions, aiSignature, hourlyRate, userRole, aiOnboardingComplete } = body;

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

    // Validate hourly rate
    if (hourlyRate !== undefined && (typeof hourlyRate !== 'number' || hourlyRate < 1 || hourlyRate > 9999)) {
      return NextResponse.json({ error: 'Hourly rate must be between 1 and 9999' }, { status: 400 });
    }

    // Validate user role
    const validRoles = ['founder', 'ae', 'csm', 'consultant', 'other'];
    if (userRole !== undefined && userRole !== null && !validRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Validate aiOnboardingComplete
    if (aiOnboardingComplete !== undefined && typeof aiOnboardingComplete !== 'boolean') {
      return NextResponse.json({ error: 'aiOnboardingComplete must be a boolean' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      aiTone: aiTone || 'professional',
      aiCustomInstructions: aiCustomInstructions || null,
      aiSignature: aiSignature || null,
      updatedAt: new Date(),
    };
    if (hourlyRate !== undefined) {
      updateData.hourlyRate = hourlyRate;
    }
    if (userRole !== undefined) {
      updateData.userRole = userRole || null;
    }
    if (aiOnboardingComplete !== undefined) {
      updateData.aiOnboardingComplete = aiOnboardingComplete;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.clerkId, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
