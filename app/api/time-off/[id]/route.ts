import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * Helper function to check for overlapping time-off entries
 */
async function checkOverlap(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<{ hasOverlap: boolean; overlappingEntry?: any }> {
  // Find entries that overlap with the given date range
  // Overlap occurs when: existing.start <= new.end AND existing.end >= new.start
  let query = supabase
    .from('time_off_requests')
    .select('id, start_date, end_date, type')
    .eq('user_id', userId)
    .lte('start_date', endDate)
    .gte('end_date', startDate);

  // Exclude the entry being updated (for PUT requests)
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return { hasOverlap: false };
  }

  return { hasOverlap: true, overlappingEntry: data[0] };
}

/**
 * PUT /api/time-off/[id]
 * Update a time-off entry (users can only update their own)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Time-off entry not found' }, { status: 404 });
    }

    if (existingEntry.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own time-off entries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { start_date, end_date, type, notes } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (type !== undefined) updates.type = type;
    if (notes !== undefined) updates.notes = notes;

    // Validate required fields if provided
    const finalStartDate = updates.start_date || existingEntry.start_date;
    const finalEndDate = updates.end_date || existingEntry.end_date;

    // Validate date range
    if (new Date(finalEndDate) < new Date(finalStartDate)) {
      return NextResponse.json({ error: 'end_date must be >= start_date' }, { status: 400 });
    }

    // Validate type if provided
    if (updates.type) {
      const validTypes = ['vacation', 'personal', 'sick', 'other'];
      if (!validTypes.includes(updates.type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check for overlapping entries (exclude current entry)
    const { hasOverlap, overlappingEntry } = await checkOverlap(
      supabase,
      user.id,
      finalStartDate,
      finalEndDate,
      id
    );

    if (hasOverlap) {
      return NextResponse.json(
        {
          error: `This time-off overlaps with an existing entry (${overlappingEntry.start_date} to ${overlappingEntry.end_date})`,
        },
        { status: 400 }
      );
    }

    // Update the entry
    const { data, error: updateError } = await supabase
      .from('time_off_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating time-off request:', updateError);
      // Check if table doesn't exist
      if (updateError.code === '42P01' || updateError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Time-off feature not initialized. Please run database migration.',
            details: updateError.message,
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update time-off request', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ time_off_request: data }, { status: 200 });
  } catch (error) {
    console.error('Update time-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
