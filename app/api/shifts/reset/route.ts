import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * DELETE /api/shifts/reset
 * DEV ONLY: Delete all shifts and shift assignments
 * Only works on localhost for development/testing purposes
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if running on localhost
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    if (!isLocalhost) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode on localhost' },
        { status: 403 }
      );
    }

    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Delete all shift assignments first (foreign key constraint)
    const { error: assignmentsError } = await supabase
      .from('shift_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq a non-existent id)

    if (assignmentsError) {
      console.error('Error deleting shift assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to delete shift assignments', details: assignmentsError.message },
        { status: 500 }
      );
    }

    // Delete all shifts
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (shiftsError) {
      console.error('Error deleting shifts:', shiftsError);
      return NextResponse.json(
        { error: 'Failed to delete shifts', details: shiftsError.message },
        { status: 500 }
      );
    }

    // Also clear any conflicts related to shifts
    const { error: conflictsError } = await supabase
      .from('conflicts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (conflictsError) {
      console.error('Error deleting conflicts:', conflictsError);
      // Don't fail the request, conflicts are secondary
    }

    console.log(`[DEV] Schedule reset by user ${user.id} (${user.email})`);

    return NextResponse.json(
      {
        message: 'Schedule reset successfully',
        deleted: {
          shifts: true,
          assignments: true,
          conflicts: !conflictsError,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
