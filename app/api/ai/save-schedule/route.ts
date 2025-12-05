import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { saveSchedule, validateScheduleForConflicts } from '@/lib/ai/scheduler-agent';

/**
 * POST /api/ai/save-schedule
 * Save a pre-generated AI schedule to the database
 * This is separate from generate-schedule to avoid re-generating when saving
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schedule, skip_conflict_check = false } = body;

    // Validate required fields
    if (!schedule || !schedule.shifts || !Array.isArray(schedule.shifts)) {
      return NextResponse.json(
        { error: 'Invalid schedule data. Expected { schedule: { shifts: [...] } }' },
        { status: 400 }
      );
    }

    if (schedule.shifts.length === 0) {
      return NextResponse.json({ error: 'Schedule has no shifts to save' }, { status: 400 });
    }

    // Validate for conflicts before saving (unless explicitly skipped)
    if (!skip_conflict_check) {
      const validation = validateScheduleForConflicts(schedule);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: `Schedule has ${validation.conflicts.length} conflict(s). Use skip_conflict_check: true to save anyway.`,
            conflicts: validation.conflicts,
            conflict_count: validation.conflicts.length,
          },
          { status: 409 }
        );
      }
    }

    // Save the schedule
    console.log(`[Save Schedule] Saving ${schedule.shifts.length} shifts for user ${user.id}`);
    const saveResult = await saveSchedule(schedule, user.id, skip_conflict_check);

    if (!saveResult.success) {
      return NextResponse.json(
        {
          error: saveResult.error || 'Failed to save schedule',
          conflicts: saveResult.conflicts,
        },
        { status: 500 }
      );
    }

    console.log(`[Save Schedule] Successfully saved ${saveResult.shift_ids?.length || 0} shifts`);

    return NextResponse.json(
      {
        success: true,
        saved_shifts: saveResult.shift_ids?.length || 0,
        shift_ids: saveResult.shift_ids || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Save schedule API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
