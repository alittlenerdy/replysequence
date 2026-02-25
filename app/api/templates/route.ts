import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { MEETING_TEMPLATES, getTemplatesForMeetingType } from '@/lib/meeting-templates';
import { db, emailTemplates, users } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';
import type { MeetingType } from '@/lib/meeting-type-detector';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  meetingType: string | null;
  meetingTypes: string[];
  promptInstructions: string;
  icon: string;
  isSystem: boolean;
  isDefault: boolean;
}

/**
 * GET /api/templates
 * Returns system templates + user's custom templates
 * Optionally filtered by meetingType query param
 */
export async function GET(request: NextRequest) {
  const meetingType = request.nextUrl.searchParams.get('meetingType') as MeetingType | null;

  // Get system templates
  const systemTemplates = meetingType
    ? getTemplatesForMeetingType(meetingType)
    : MEETING_TEMPLATES;

  // Format system templates to match unified shape
  const formatted: TemplateResponse[] = systemTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    meetingType: t.meetingTypes[0] || null,
    meetingTypes: t.meetingTypes,
    promptInstructions: t.focusInstructions,
    icon: t.icon,
    isSystem: true,
    isDefault: false,
  }));

  // Try to get user custom templates (non-blocking if not authenticated)
  let userTemplates: TemplateResponse[] = [];
  try {
    const user = await currentUser();
    if (user) {
      const [dbUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, user.id))
        .limit(1);

      if (dbUser) {
        const customs = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.userId, dbUser.id));

        userTemplates = customs.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          meetingType: t.meetingType,
          meetingTypes: t.meetingType ? [t.meetingType as MeetingType] : [],
          promptInstructions: t.promptInstructions,
          icon: t.icon || 'general',
          isSystem: false,
          isDefault: t.isDefault,
        }));
      }
    }
  } catch {
    // Return system templates only if auth fails
  }

  return NextResponse.json({ templates: [...formatted, ...userTemplates] });
}

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  meetingType: z.string().max(100).optional(),
  promptInstructions: z.string().min(1).max(10000),
  icon: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * POST /api/templates
 * Create a custom template for the authenticated user
 */
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsed = await parseBody(request, createTemplateSchema);
  if ('error' in parsed) return parsed.error;
  const { name, description, meetingType, promptInstructions, icon, isDefault } = parsed.data;

  // If setting as default, clear other defaults for this meeting type
  if (isDefault && meetingType) {
    await db
      .update(emailTemplates)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(emailTemplates.userId, dbUser.id),
          eq(emailTemplates.meetingType, meetingType),
          eq(emailTemplates.isDefault, true)
        )
      );
  }

  const [template] = await db
    .insert(emailTemplates)
    .values({
      userId: dbUser.id,
      name,
      description: description || null,
      meetingType: meetingType || null,
      promptInstructions,
      icon: icon || 'general',
      isDefault: isDefault || false,
      isSystem: false,
    })
    .returning();

  return NextResponse.json({ template }, { status: 201 });
}

/**
 * DELETE /api/templates
 * Delete a custom template (requires templateId query param)
 */
export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateId = request.nextUrl.searchParams.get('id');
  if (!templateId) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, user.id))
    .limit(1);

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only allow deleting user's own non-system templates
  const [deleted] = await db
    .delete(emailTemplates)
    .where(
      and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, dbUser.id),
        eq(emailTemplates.isSystem, false)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Template not found or cannot be deleted' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
