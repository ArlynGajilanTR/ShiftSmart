import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format, addDays } from 'date-fns';

/**
 * GET /api/shifts/upcoming
 * Get upcoming shifts (next N days)
 * Query params: days (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const supabase = await createClient();

    // Calculate date range
    const now = new Date();
    const endDate = addDays(now, days);

    // Query shifts
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        bureaus(name, code),
        shift_assignments(
          id,
          status,
          users(id, full_name, title, shift_role)
        )
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time');

    if (error) {
      console.error('Error fetching upcoming shifts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch upcoming shifts' },
        { status: 500 }
      );
    }

    // Format response
    const formattedShifts: any[] = [];

    shifts.forEach((shift: any) => {
      if (shift.shift_assignments && shift.shift_assignments.length > 0) {
        shift.shift_assignments.forEach((assignment: any) => {
          if (assignment.users) {
            formattedShifts.push({
              id: shift.id,
              employee: assignment.users.full_name,
              role: assignment.users.title,
              bureau: shift.bureaus?.name || 'Unknown',
              date: format(new Date(shift.start_time), 'yyyy-MM-dd'),
              time: `${format(new Date(shift.start_time), 'HH:mm')} - ${format(new Date(shift.end_time), 'HH:mm')}`,
              status: assignment.status,
            });
          }
        });
      }
    });

    return NextResponse.json(formattedShifts, { status: 200 });
  } catch (error) {
    console.error('Upcoming shifts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

