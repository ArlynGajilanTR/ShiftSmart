import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { callClaude, isConfigured } from '@/lib/ai/client';
import { 
  CONFLICT_RESOLUTION_SYSTEM_PROMPT, 
  buildConflictPrompt 
} from '@/lib/ai/prompts/conflict-resolution';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/resolve-conflict
 * Get AI-powered conflict resolution suggestions
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if AI is configured
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'AI conflict resolution not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { conflict_id } = body;

    if (!conflict_id) {
      return NextResponse.json(
        { error: 'conflict_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch conflict details
    const { data: conflict, error: conflictError } = await supabase
      .from('conflicts')
      .select('*, users(full_name), shifts(start_time, end_time, bureaus(name))')
      .eq('id', conflict_id)
      .single();

    if (conflictError || !conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    // Get team size
    const { count: teamSize } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('team', 'Breaking News')
      .eq('status', 'active');

    // Get alternative employees who could cover
    const { data: alternatives } = await supabase
      .from('users')
      .select('*, shift_assignments!inner(shift_id, shifts!inner(start_time))')
      .eq('team', 'Breaking News')
      .eq('status', 'active')
      .neq('id', conflict.user_id);

    // Calculate current weekly hours for each alternative
    const alternativesData = alternatives?.map((alt: any) => {
      const weeklyHours = alt.shift_assignments
        ?.filter((a: any) => {
          const shiftDate = new Date(a.shifts.start_time);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return shiftDate >= weekAgo;
        })
        .length * 8 || 0; // Assume 8-hour shifts

      return {
        employee_name: alt.full_name,
        shift_role: alt.shift_role,
        current_weekly_hours: weeklyHours,
        can_cover: weeklyHours < 40, // Under 40 hours can cover
        reason: weeklyHours >= 40 ? 'Approaching maximum hours' : undefined,
      };
    }) || [];

    // Build context
    const promptContext = {
      type: conflict.type,
      severity: conflict.severity,
      description: conflict.description,
      date: conflict.date,
      employee: conflict.users?.full_name,
      shifts: conflict.details?.shifts || [],
      context: {
        team_size: teamSize || 15,
        available_alternatives: alternativesData,
        current_schedule_state: {
          total_shifts_this_week: 0, // TODO: Calculate
          coverage_gaps: [],
        },
      },
    };

    // Generate prompt
    const userPrompt = buildConflictPrompt(promptContext);

    // Call Claude
    console.log('Calling Claude for conflict resolution...');
    const response = await callClaude(
      CONFLICT_RESOLUTION_SYSTEM_PROMPT,
      userPrompt,
      4096
    );

    // Parse response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const resolution = JSON.parse(jsonMatch[0]);

    return NextResponse.json(
      {
        success: true,
        conflict_id,
        resolution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resolve conflict API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

