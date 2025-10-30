import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * PATCH /api/conflicts/:id
 * Update conflict status (resolve or acknowledge)
 * Body: { action: 'resolve' | 'acknowledge' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['resolve', 'acknowledge'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "resolve" or "acknowledge"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { id } = await params;

    // Check if conflict exists
    const { data: existingConflict } = await supabase
      .from('conflicts')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingConflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Build update based on action
    const updates: any = {};

    if (action === 'resolve') {
      updates.status = 'resolved';
      updates.resolved_at = now;
      updates.resolved_by = user.id;
    } else if (action === 'acknowledge') {
      updates.status = 'acknowledged';
      updates.acknowledged_at = now;
      updates.acknowledged_by = user.id;
    }

    // Update conflict
    const { data: updatedConflict, error: updateError } = await supabase
      .from('conflicts')
      .update(updates)
      .eq('id', id)
      .select('*, user:users!user_id(full_name)')
      .single();

    if (updateError) {
      console.error('Error updating conflict:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conflict' },
        { status: 500 }
      );
    }

    // Format response
    const response = {
      id: updatedConflict.id,
      type: updatedConflict.type,
      severity: updatedConflict.severity,
      status: updatedConflict.status,
      employee: updatedConflict.user?.full_name || null,
      description: updatedConflict.description,
      date: updatedConflict.date,
      detected_at: updatedConflict.detected_at,
      acknowledged_at: updatedConflict.acknowledged_at,
      acknowledged_by: updatedConflict.acknowledged_by,
      resolved_at: updatedConflict.resolved_at,
      resolved_by: updatedConflict.resolved_by,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Update conflict error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conflicts/:id
 * Dismiss/delete a conflict
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { id } = await params;

    // Check if conflict exists
    const { data: existingConflict } = await supabase
      .from('conflicts')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingConflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    // Delete conflict
    const { error: deleteError } = await supabase
      .from('conflicts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting conflict:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete conflict' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Conflict dismissed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete conflict error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

