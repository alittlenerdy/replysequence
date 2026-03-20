import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { validateEmail } from '@/lib/email-validation';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

const validateSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, validateSchema);
    if ('error' in parsed) return parsed.error;

    const result = await validateEmail(parsed.data.email);

    return NextResponse.json({
      email: parsed.data.email,
      ...result,
    });
  } catch (error) {
    console.error('Email validation error:', error);
    return NextResponse.json(
      { error: 'Validation service unavailable' },
      { status: 500 }
    );
  }
}
