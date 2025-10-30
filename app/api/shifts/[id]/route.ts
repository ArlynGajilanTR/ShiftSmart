import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format } from 'date-fns';

/**
 * PUT /api/shifts/:id
 * Update a shift
 */
export async function PUT(
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
    const { employee_id, bureau, date, start_time, end_time, status } = body;

    const supabase = await createClient();
    const { id } = await params;

    // Check if shift exists
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};

    if (bureau) {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', bureau)
        .single();

      if (!bureauData) {
        return NextResponse.json(
          { error: 'Invalid bureau' },
          { status: 400 }
        );
      }
      updates.bureau_id = bureauData.id;
    }

    if (date && start_time) {
      updates.start_time = `${date}T${start_time}:00`;
    }

    if (date && end_time) {
      updates.end_time = `${date}T${end_time}:00`;
    }

    if (status) {
      updates.status = status;
    }

    // Update shift
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select('*, bureaus(name)')
      .single();

    if (updateError) {
      console.error('Error updating shift:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shift' },
        { status: 500 }
      );
    }

    // Handle assignment updates
    if (employee_id !== undefined) {
      // Get existing assignment
      const { data: existingAssignment } = await supabase
        .from('shift_assignments')
        .select('*')
        .eq('shift_id', id)
        .maybeSingle();

      if (employee_id === null && existingAssignment) {
        // Remove assignment
        await supabase
          .from('shift_assignments')
          .delete()
          .eq('id', existingAssignment.id);
      } else if (employee_id && !existingAssignment) {
        // Create new assignment
        await supabase
          .from('shift_assignments')
          .insert({
            shift_id: id,
            user_id: employee_id,
            status: status === 'confirmed' ? 'confirmed' : 'assigned',
            assigned_by: user.id,
          });
      } else if (employee_id && existingAssignment && existingAssignment.user_id !== employee_id) {
        // Update existing assignment to new employee
        await supabase
          .from('shift_assignments')
          .update({
            user_id: employee_id,
            assigned_by: user.id,
          })
          .eq('id', existingAssignment.id);
      }
    }

    // Fetch updated assignment
    const { data: assignment } = await supabase
      .from('shift_assignments')
      .select('*, user:users!user_id(full_name, title, shift_role)')
      .eq('shift_id', id)
      .maybeSingle();

    // Format response
    const response = {
      id: updatedShift.id,
      assignment_id: assignment?.id || null,
      employee: assignment?.user?.full_name || null,
      employee_id: assignment?.user_id || null,
      role: assignment?.user?.title || null,
      shift_role: assignment?.user?.shift_role || null,
      bureau: updatedShift.bureaus?.name,
      date: format(new Date(updatedShift.start_time), 'yyyy-MM-dd'),
      startTime: format(new Date(updatedShift.start_time), 'HH:mm'),
      endTime: format(new Date(updatedShift.end_time), 'HH:mm'),
      status: assignment?.status || updatedShift.status,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Update shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shifts/:id
 * Delete a shift
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

    // Check if shift exists
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Delete shift (cascade will handle assignments)
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting shift:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete shift' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Shift deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shifts/:id
 * Move a shift (drag-and-drop) - updates date/time only
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
    const { date, start_time, end_time } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { id } = await params;

    // Check if shift exists
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('*, bureaus(name)')
      .eq('id', id)
      .single();

    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // Use existing times if not provided
    const existingStartTime = format(new Date(existingShift.start_time), 'HH:mm');
    const existingEndTime = format(new Date(existingShift.end_time), 'HH:mm');

    const newStartTime = start_time || existingStartTime;
    const newEndTime = end_time || existingEndTime;

    // Update shift
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update({
        start_time: `${date}T${newStartTime}:00`,
        end_time: `${date}T${newEndTime}:00`,
      })
      .eq('id', id)
      .select('*, bureaus(name)')
      .single();

    if (updateError) {
      console.error('Error moving shift:', updateError);
      return NextResponse.json(
        { error: 'Failed to move shift' },
        { status: 500 }
      );
    }

    // TODO: Run conflict detection here and return any conflicts
    // For now, just return the updated shift

    // Fetch assignment
    const { data: assignment } = await supabase
      .from('shift_assignments')
      .select('*, user:users!user_id(full_name, title, shift_role)')
      .eq('shift_id', id)
      .maybeSingle();

    // Format response
    const response = {
      id: updatedShift.id,
      assignment_id: assignment?.id || null,
      employee: assignment?.user?.full_name || null,
      employee_id: assignment?.user_id || null,
      role: assignment?.user?.title || null,
      shift_role: assignment?.user?.shift_role || null,
      bureau: updatedShift.bureaus?.name,
      date: format(new Date(updatedShift.start_time), 'yyyy-MM-dd'),
      startTime: format(new Date(updatedShift.start_time), 'HH:mm'),
      endTime: format(new Date(updatedShift.end_time), 'HH:mm'),
      status: assignment?.status || updatedShift.status,
      conflicts: [], // TODO: Add conflict detection
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Move shift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

