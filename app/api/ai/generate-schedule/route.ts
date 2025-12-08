import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, canGenerateSchedule } from '@/lib/auth/verify';
import { generateSchedule, saveSchedule } from '@/lib/ai/scheduler-agent';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/generate-schedule
 * Generate AI-powered schedule using Claude Haiku 4.5
 *
 * Access: Only team leaders and admins can generate schedules
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only team leaders and admins can generate schedules
    if (!canGenerateSchedule(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can generate schedules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      start_date,
      end_date,
      type = 'week',
      bureau = 'both',
      preserve_existing = false,
      save_to_database = false,
    } = body;

    // Validate required fields
    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    // Validate type
    if (!['week', 'month', 'quarter'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: week, month, quarter' },
        { status: 400 }
      );
    }

    // Validate bureau
    if (!['Milan', 'Rome', 'both'].includes(bureau)) {
      return NextResponse.json(
        { error: 'bureau must be one of: Milan, Rome, both' },
        { status: 400 }
      );
    }

    // Generate schedule using AI
    const result = await generateSchedule({
      period: {
        start_date,
        end_date,
        type,
      },
      bureau,
      preserve_existing,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate schedule' },
        { status: 500 }
      );
    }

    // Optionally save to database
    let saveResult = null;
    if (save_to_database) {
      saveResult = await saveSchedule(result.data, user.id);

      if (!saveResult.success) {
        return NextResponse.json(
          {
            warning: 'Schedule generated but failed to save to database',
            schedule: result.data,
            save_error: saveResult.error,
          },
          { status: 207 } // Multi-Status
        );
      }
    }

    // Get unconfirmed preferences count for the response
    const supabase = await createClient();
    const { count: unconfirmedCount } = await supabase
      .from('shift_preferences')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', false);

    // Return generated schedule
    return NextResponse.json(
      {
        success: true,
        schedule: result.data,
        saved: save_to_database,
        shift_ids: saveResult?.shift_ids || [],
        unconfirmed_preferences_count: unconfirmedCount || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Generate schedule API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
