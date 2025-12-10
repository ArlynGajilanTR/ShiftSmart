import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format, parseISO, differenceInHours } from 'date-fns';
import { logAudit, createShiftMoveAudit, getClientIP } from '@/lib/audit/logger';

/**
 * Detect conflicts for a shift assignment
 * Returns array of detected conflicts
 */
async function detectConflicts(
  supabase: any,
  shiftId: string,
  employeeId: string,
  startTime: string,
  endTime: string,
  bureauName: string
): Promise<any[]> {
  const conflicts: any[] = [];
  const shiftDate = format(parseISO(startTime), 'yyyy-MM-dd');

  // 1. Check for double booking (overlapping shifts)
  const { data: existingAssignments } = await supabase
    .from('shift_assignments')
    .select('*, shifts!inner(start_time, end_time, bureaus(name))')
    .eq('user_id', employeeId)
    .neq('shift_id', shiftId);

  if (existingAssignments) {
    for (const assignment of existingAssignments) {
      const existingStart = parseISO(assignment.shifts.start_time);
      const existingEnd = parseISO(assignment.shifts.end_time);
      const newStart = parseISO(startTime);
      const newEnd = parseISO(endTime);

      // Check for overlap
      const hasOverlap =
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd);

      if (hasOverlap) {
        conflicts.push({
          type: 'Double Booking',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          description: 'Employee is scheduled for overlapping shifts',
          date: shiftDate,
          details: {
            shifts: [
              {
                time: `${format(newStart, 'HH:mm')} - ${format(newEnd, 'HH:mm')}`,
                bureau: bureauName,
              },
              {
                time: `${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')}`,
                bureau: assignment.shifts.bureaus?.name,
              },
            ],
          },
        });
      }

      // 2. Check for rest period violation (less than 11 hours between shifts)
      // Check both directions: new shift after existing, and existing shift after new

      // Case A: New shift starts after existing shift ends
      const hoursAfterExisting = differenceInHours(newStart, existingEnd);
      if (hoursAfterExisting >= 0 && hoursAfterExisting < 11) {
        conflicts.push({
          type: 'Rest Period Violation',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          description: `Less than 11 hours rest between shifts (${hoursAfterExisting.toFixed(1)} hours)`,
          date: shiftDate,
          details: {
            hours_between: hoursAfterExisting,
            minimum_required: 11,
          },
        });
      }

      // Case B: Existing shift starts after new shift ends
      const hoursBeforeExisting = differenceInHours(existingStart, newEnd);
      if (hoursBeforeExisting >= 0 && hoursBeforeExisting < 11) {
        conflicts.push({
          type: 'Rest Period Violation',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          description: `Less than 11 hours rest before next shift (${hoursBeforeExisting.toFixed(1)} hours)`,
          date: shiftDate,
          details: {
            hours_between: hoursBeforeExisting,
            minimum_required: 11,
          },
        });
      }
    }
  }

  return conflicts;
}

/**
 * Insert detected conflicts into database, resolving old ones first
 */
async function updateConflicts(supabase: any, shiftId: string, conflicts: any[]): Promise<void> {
  // Resolve any existing conflicts for this shift
  await supabase
    .from('conflicts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('shift_id', shiftId)
    .eq('status', 'unresolved');

  // Insert new conflicts
  if (conflicts.length > 0) {
    const conflictsToInsert = conflicts.map((c) => ({
      type: c.type,
      severity: c.severity,
      status: 'unresolved',
      shift_id: c.shift_id,
      user_id: c.user_id,
      description: c.description,
      date: c.date,
      details: c.details,
      detected_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('conflicts').insert(conflictsToInsert);
    if (error) {
      console.error('Error inserting conflicts:', error);
    }
  }
}

/**
 * PUT /api/shifts/:id
 * Update a shift
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employee_id, bureau, date, start_time, end_time, status } = body;

    const supabase = await createClient();
    const { id } = await params;

    // Check if shift exists
    const { data: existingShift } = await supabase.from('shifts').select('*').eq('id', id).single();

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
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
        return NextResponse.json({ error: 'Invalid bureau' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
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
        await supabase.from('shift_assignments').delete().eq('id', existingAssignment.id);
      } else if (employee_id && !existingAssignment) {
        // Create new assignment
        await supabase.from('shift_assignments').insert({
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

    // Log update to audit trail
    logAudit({
      user_id: user.id,
      action: 'shift_updated',
      entity_type: 'shift',
      entity_id: id,
      changes: {
        updates,
        employee_changed: employee_id !== undefined,
      },
      ip_address: getClientIP(request) || undefined,
    }).catch((err) => console.error('Audit log failed:', err));

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Get shift details before deletion for audit log
    const { data: shiftDetails } = await supabase
      .from('shifts')
      .select('*, bureaus(name), shift_assignments(user_id, users(full_name))')
      .eq('id', id)
      .single();

    // Delete shift (cascade will handle assignments)
    const { error: deleteError } = await supabase.from('shifts').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting shift:', deleteError);
      return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }

    // Log deletion to audit trail
    if (shiftDetails) {
      logAudit({
        user_id: user.id,
        action: 'shift_deleted',
        entity_type: 'shift',
        entity_id: id,
        changes: {
          deleted_shift: {
            date: format(new Date(shiftDetails.start_time), 'yyyy-MM-dd'),
            start_time: format(new Date(shiftDetails.start_time), 'HH:mm'),
            end_time: format(new Date(shiftDetails.end_time), 'HH:mm'),
            bureau: shiftDetails.bureaus?.name,
            employee: shiftDetails.shift_assignments?.[0]?.users?.full_name || null,
          },
        },
        ip_address: getClientIP(request) || undefined,
      }).catch((err) => console.error('Audit log failed:', err));
    }

    return NextResponse.json({ message: 'Shift deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete shift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check conflicts for a potential shift move (before actually moving)
 */
async function checkMoveConflicts(
  supabase: any,
  shiftId: string,
  employeeId: string,
  startTime: string,
  endTime: string,
  bureauName: string
): Promise<any[]> {
  const conflicts: any[] = [];
  const shiftDate = format(parseISO(startTime), 'yyyy-MM-dd');

  // Get employee name
  const { data: employee } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', employeeId)
    .single();

  const employeeName = employee?.full_name || 'Employee';

  // Check for existing shifts that would conflict (excluding current shift)
  const { data: existingAssignments } = await supabase
    .from('shift_assignments')
    .select('*, shifts!inner(start_time, end_time, bureaus(name))')
    .eq('user_id', employeeId)
    .neq('shift_id', shiftId);

  if (existingAssignments) {
    for (const assignment of existingAssignments) {
      const existingStart = parseISO(assignment.shifts.start_time);
      const existingEnd = parseISO(assignment.shifts.end_time);
      const newStart = parseISO(startTime);
      const newEnd = parseISO(endTime);

      // Check for overlap
      const hasOverlap =
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd);

      if (hasOverlap) {
        conflicts.push({
          type: 'Double Booking',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          employee: employeeName,
          description: `${employeeName} is already scheduled for ${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')} on ${format(existingStart, 'MMM dd')}`,
          date: shiftDate,
          details: {
            shifts: [
              {
                time: `${format(newStart, 'HH:mm')} - ${format(newEnd, 'HH:mm')}`,
                bureau: bureauName,
                label: 'Moved shift',
              },
              {
                time: `${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')}`,
                bureau: assignment.shifts.bureaus?.name,
                label: 'Existing shift',
              },
            ],
          },
        });
      }

      // Check rest period violations
      const hoursAfterExisting = differenceInHours(newStart, existingEnd);
      if (hoursAfterExisting >= 0 && hoursAfterExisting < 11) {
        conflicts.push({
          type: 'Rest Period Violation',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          employee: employeeName,
          description: `${employeeName} would have only ${hoursAfterExisting.toFixed(0)}h rest (minimum 11h required)`,
          date: shiftDate,
          details: {
            hours_between: hoursAfterExisting,
            minimum_required: 11,
          },
        });
      }

      const hoursBeforeExisting = differenceInHours(existingStart, newEnd);
      if (hoursBeforeExisting >= 0 && hoursBeforeExisting < 11) {
        conflicts.push({
          type: 'Rest Period Violation',
          severity: 'high',
          shift_id: shiftId,
          user_id: employeeId,
          employee: employeeName,
          description: `${employeeName} would have only ${hoursBeforeExisting.toFixed(0)}h rest before next shift (minimum 11h required)`,
          date: shiftDate,
          details: {
            hours_between: hoursBeforeExisting,
            minimum_required: 11,
          },
        });
      }
    }
  }

  return conflicts;
}

/**
 * PATCH /api/shifts/:id
 * Move a shift (drag-and-drop) - updates date/time only
 *
 * SAFEGUARD: By default, rejects moves that would create conflicts.
 * Use validate_only=true to check without moving.
 * Use force=true to move despite conflicts (logs as user-confirmed override).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      start_time,
      end_time,
      validate_only = false, // If true, only check for conflicts without moving
      force = false, // If true, move even if conflicts exist (user confirmed)
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Fetch current assignment
    const { data: assignment } = await supabase
      .from('shift_assignments')
      .select('*, user:users!user_id(full_name, title, shift_role)')
      .eq('shift_id', id)
      .maybeSingle();

    // Use existing times if not provided
    const existingStartTime = format(new Date(existingShift.start_time), 'HH:mm');
    const existingEndTime = format(new Date(existingShift.end_time), 'HH:mm');

    const newStartTime = start_time || existingStartTime;
    const newEndTime = end_time || existingEndTime;
    const newStartTimestamp = `${date}T${newStartTime}:00`;
    const newEndTimestamp = `${date}T${newEndTime}:00`;

    // SAFEGUARD 2: Check for conflicts BEFORE moving
    let potentialConflicts: any[] = [];
    if (assignment?.user_id) {
      potentialConflicts = await checkMoveConflicts(
        supabase,
        id,
        assignment.user_id,
        newStartTimestamp,
        newEndTimestamp,
        existingShift.bureaus?.name || ''
      );
    }

    // If validate_only, return conflicts without moving
    if (validate_only) {
      return NextResponse.json(
        {
          valid: potentialConflicts.length === 0,
          conflicts: potentialConflicts,
          current: {
            date: format(new Date(existingShift.start_time), 'yyyy-MM-dd'),
            startTime: existingStartTime,
            endTime: existingEndTime,
          },
          proposed: {
            date,
            startTime: newStartTime,
            endTime: newEndTime,
          },
        },
        { status: 200 }
      );
    }

    // If conflicts exist and not forced, reject the move
    if (potentialConflicts.length > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Move would create conflicts',
          conflicts: potentialConflicts,
          message: 'This move would create scheduling conflicts. Set force=true to move anyway.',
        },
        { status: 409 }
      ); // 409 Conflict
    }

    // Update shift
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update({
        start_time: newStartTimestamp,
        end_time: newEndTimestamp,
      })
      .eq('id', id)
      .select('*, bureaus(name)')
      .single();

    if (updateError) {
      console.error('Error moving shift:', updateError);
      return NextResponse.json({ error: 'Failed to move shift' }, { status: 500 });
    }

    // Log the shift move to audit trail
    const previousDate = format(new Date(existingShift.start_time), 'yyyy-MM-dd');
    const auditEntry = createShiftMoveAudit(
      user.id,
      id,
      {
        date: previousDate,
        start_time: existingStartTime,
        end_time: existingEndTime,
        employee_id: assignment?.user_id,
        employee_name: assignment?.user?.full_name,
      },
      {
        date,
        start_time: newStartTime,
        end_time: newEndTime,
      },
      {
        forced: force && potentialConflicts.length > 0,
        ip_address: getClientIP(request),
      }
    );

    // Fire-and-forget audit logging (don't block the response)
    logAudit(auditEntry).catch((err) => console.error('Audit log failed:', err));

    // If conflicts exist but were forced, log them as user-confirmed overrides
    if (potentialConflicts.length > 0 && force) {
      console.log(
        `[Override] User ${user.id} moved shift despite ${potentialConflicts.length} conflicts`
      );

      // Resolve old conflicts for this shift first
      await supabase
        .from('conflicts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('shift_id', id)
        .eq('status', 'unresolved');

      // Insert new conflicts with "acknowledged" status
      const conflictsToInsert = potentialConflicts.map((c) => ({
        type: c.type,
        severity: c.severity,
        status: 'acknowledged',
        shift_id: id,
        user_id: c.user_id,
        description: `[User Override] ${c.description}`,
        date: c.date,
        details: { ...c.details, forced_by: user.id, forced_at: new Date().toISOString() },
        detected_at: new Date().toISOString(),
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      }));

      await supabase.from('conflicts').insert(conflictsToInsert);
    } else if (assignment?.user_id) {
      // Normal case - resolve any old conflicts since move was clean
      await supabase
        .from('conflicts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('shift_id', id)
        .eq('status', 'unresolved');
    }

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
      forced: force && potentialConflicts.length > 0,
      conflicts_overridden: force ? potentialConflicts.length : 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Move shift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
