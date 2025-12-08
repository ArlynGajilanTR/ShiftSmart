import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * DELETE /api/time-off/[id]
 * Delete a time-off entry (users can only delete their own)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // First, verify the time-off entry exists and belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('time_off_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Time-off entry not found' }, { status: 404 });
    }

    if (existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own time-off entries' },
        { status: 403 }
      );
    }

    // Delete the entry
    const { error: deleteError } = await supabase.from('time_off_requests').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting time-off request:', deleteError);
      // Check if table doesn't exist
      if (deleteError.code === '42P01' || deleteError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Time-off feature not initialized. Please run database migration.',
            details: deleteError.message,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete time-off request', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Time-off entry deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete time-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
