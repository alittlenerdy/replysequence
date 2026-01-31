import { NextRequest, NextResponse } from 'next/server';
import { getDraftById, deleteDraft } from '@/lib/dashboard-queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/drafts/[id] - Get a specific draft
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    console.log('[DRAFT-GET-1] Fetching draft, id:', id);
    const draft = await getDraftById(id);

    if (!draft) {
      console.log('[DRAFT-GET-2] Draft not found, id:', id);
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    console.log('[DRAFT-GET-3] Draft fetched successfully, id:', id);
    return NextResponse.json(draft);
  } catch (error) {
    console.error('[DRAFT-GET-ERROR] Failed to fetch draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id] - Delete a draft
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    console.log('[DELETE-1] Deleting draft, id:', id);

    // Verify draft exists
    const draft = await getDraftById(id);
    if (!draft) {
      console.log('[DELETE-2] Draft not found, id:', id);
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of sent drafts
    if (draft.status === 'sent') {
      console.log('[DELETE-3] Cannot delete sent draft, id:', id);
      return NextResponse.json(
        { error: 'Cannot delete a sent draft' },
        { status: 400 }
      );
    }

    // Delete the draft
    await deleteDraft(id);

    console.log('[DELETE-4] Draft deleted successfully, id:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE-ERROR] Failed to delete draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
