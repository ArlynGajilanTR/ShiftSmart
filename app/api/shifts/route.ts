import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format, parseISO, differenceInHours } from 'date-fns';

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
 * Insert detected conflicts into database
 */
async function insertConflicts(supabase: any, conflicts: any[]): Promise<void> {
  if (conflicts.length === 0) return;

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

/**
 * GET /api/shifts
 * List all shifts with optional filters
 * Query params: start_date, end_date, bureau, employee_id
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const bureau = searchParams.get('bureau');
    const employeeId = searchParams.get('employee_id');

    const supabase = await createClient();

    // Build query for shifts with assignments
    let query = supabase.from('shifts').select(`
        *,
        bureaus(name, code),
        shift_assignments(
          id,
          status,
          user:users!user_id(id, full_name, title, shift_role)
        )
      `);

    // Apply filters
    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    if (bureau && bureau !== 'all') {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', bureau)
        .single();

      if (bureauData) {
        query = query.eq('bureau_id', bureauData.id);
      }
    }

    // Order by start time
    query = query.order('start_time');

    const { data: shifts, error } = await query;

    if (error) {
      console.error('Error fetching shifts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shifts', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Format response to match frontend expectations
    // Frontend expects flat array of shift assignments
    const formattedShifts: any[] = [];

    shifts.forEach((shift: any) => {
      // If shift has assignments, create one entry per assignment
      if (shift.shift_assignments && shift.shift_assignments.length > 0) {
        shift.shift_assignments.forEach((assignment: any) => {
          if (assignment.user) {
            // Filter by employee if specified
            if (employeeId && assignment.user.id !== employeeId) {
              return;
            }

            formattedShifts.push({
              id: shift.id,
              assignment_id: assignment.id,
              employee: assignment.user.full_name,
              employee_id: assignment.user.id,
              role: assignment.user.title,
              shift_role: assignment.user.shift_role,
              bureau: shift.bureaus?.name || 'Unknown',
              date: format(new Date(shift.start_time), 'yyyy-MM-dd'),
              startTime: format(new Date(shift.start_time), 'HH:mm'),
              endTime: format(new Date(shift.end_time), 'HH:mm'),
              status: assignment.status,
            });
          }
        });
      } else {
        // Unassigned shift
        formattedShifts.push({
          id: shift.id,
          assignment_id: null,
          employee: null,
          employee_id: null,
          role: null,
          shift_role: null,
          bureau: shift.bureaus?.name || 'Unknown',
          date: format(new Date(shift.start_time), 'yyyy-MM-dd'),
          startTime: format(new Date(shift.start_time), 'HH:mm'),
          endTime: format(new Date(shift.end_time), 'HH:mm'),
          status: shift.status,
        });
      }
    });

    return NextResponse.json({ shifts: formattedShifts }, { status: 200 });
  } catch (error) {
    console.error('Shifts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/shifts
 * Create a new shift (with optional assignment)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employee_id, bureau, date, start_time, end_time, status } = body;

    // Validate required fields
    if (!bureau || !date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get bureau ID
    const { data: bureauData } = await supabase
      .from('bureaus')
      .select('id, timezone')
      .eq('name', bureau)
      .single();

    if (!bureauData) {
      return NextResponse.json({ error: 'Invalid bureau' }, { status: 400 });
    }

    // Build timestamps
    const startTimestamp = `${date}T${start_time}:00`;
    const endTimestamp = `${date}T${end_time}:00`;

    // Create shift
    const { data: newShift, error: createError } = await supabase
      .from('shifts')
      .insert({
        bureau_id: bureauData.id,
        start_time: startTimestamp,
        end_time: endTimestamp,
        status: status || 'draft',
        required_staff: 1,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating shift:', createError);
      return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }

    // If employee specified, create assignment
    let assignmentData = null;
    if (employee_id) {
      const { data: assignment, error: assignError } = await supabase
        .from('shift_assignments')
        .insert({
          shift_id: newShift.id,
          user_id: employee_id,
          status: status === 'confirmed' ? 'confirmed' : 'assigned',
          assigned_by: user.id,
        })
        .select('*, user:users!user_id(full_name, title, shift_role)')
        .single();

      if (assignError) {
        console.error('Error creating assignment:', assignError);
        // Don't fail the request, shift was created successfully
      } else {
        assignmentData = assignment;
      }
    }

    // Run conflict detection only if assignment was successfully created
    let detectedConflicts: any[] = [];
    if (assignmentData) {
      detectedConflicts = await detectConflicts(
        supabase,
        newShift.id,
        assignmentData.user_id,
        startTimestamp,
        endTimestamp,
        bureau
      );

      // Insert conflicts into database
      await insertConflicts(supabase, detectedConflicts);
    }

    // Format response
    const response = {
      id: newShift.id,
      assignment_id: assignmentData?.id || null,
      employee: assignmentData?.user?.full_name || null,
      employee_id: employee_id || null,
      role: assignmentData?.user?.title || null,
      shift_role: assignmentData?.user?.shift_role || null,
      bureau,
      date,
      startTime: start_time,
      endTime: end_time,
      status: assignmentData?.status || newShift.status,
      conflicts: detectedConflicts.map((c) => ({
        type: c.type,
        severity: c.severity,
        description: c.description,
      })),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create shift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
