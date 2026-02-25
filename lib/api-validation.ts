import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * Parse and validate request body against a Zod schema.
 * Returns typed data on success, or a 400 NextResponse on failure.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const raw = await request.json();
    const result = schema.safeParse(raw);

    if (!result.success) {
      const issues = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return {
        error: NextResponse.json(
          { error: 'Validation failed', issues },
          { status: 400 }
        ),
      };
    }

    return { data: result.data };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}
