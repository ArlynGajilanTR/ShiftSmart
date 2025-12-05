import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { callClaude, isConfigured } from '@/lib/ai/client';
import {
  CONFLICT_RESOLUTION_SYSTEM_PROMPT,
  buildConflictPrompt,
} from '@/lib/ai/prompts/conflict-resolution';
import { createClient } from '@/lib/supabase/server';

/**
 * Apply a resolution action to fix the conflict
 */
async function applyResolution(
  supabase: any,
  conflict: any,
  action: {
    type: 'reassign' | 'remove' | 'swap' | 'adjust_time';
    shift_id?: string;
    new_employee_id?: string;
    new_start_time?: string;
    new_end_time?: string;
    swap_with_shift_id?: string;
  },
  userId: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    switch (action.type) {
      case 'reassign': {
        // Reassign the shift to a different employee
        if (!action.shift_id || !action.new_employee_id) {
          return {
            success: false,
            message: 'Missing shift_id or new_employee_id for reassign action',
          };
        }

        // Update the assignment
        const { error: updateError } = await supabase
          .from('shift_assignments')
          .update({
            user_id: action.new_employee_id,
            assigned_by: userId,
            notes: `Reassigned via AI conflict resolution from conflict ${conflict.id}`,
          })
          .eq('shift_id', action.shift_id);

        if (updateError) {
          console.error('Error reassigning shift:', updateError);
          return { success: false, message: 'Failed to reassign shift' };
        }

        // Mark conflict as resolved
        await supabase
          .from('conflicts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
          })
          .eq('id', conflict.id);

        return {
          success: true,
          message: 'Shift reassigned successfully',
          details: { shift_id: action.shift_id, new_employee_id: action.new_employee_id },
        };
      }

      case 'remove': {
        // Remove the conflicting assignment
        if (!action.shift_id) {
          return { success: false, message: 'Missing shift_id for remove action' };
        }

        const { error: deleteError } = await supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', action.shift_id)
          .eq('user_id', conflict.user_id);

        if (deleteError) {
          console.error('Error removing assignment:', deleteError);
          return { success: false, message: 'Failed to remove assignment' };
        }

        // Mark conflict as resolved
        await supabase
          .from('conflicts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
          })
          .eq('id', conflict.id);

        return {
          success: true,
          message: 'Conflicting assignment removed',
          details: { shift_id: action.shift_id },
        };
      }

      case 'swap': {
        // Swap two employees' shifts
        if (!action.shift_id || !action.swap_with_shift_id) {
          return {
            success: false,
            message: 'Missing shift_id or swap_with_shift_id for swap action',
          };
        }

        // Get current assignments
        const { data: assignments } = await supabase
          .from('shift_assignments')
          .select('id, shift_id, user_id')
          .in('shift_id', [action.shift_id, action.swap_with_shift_id]);

        if (!assignments || assignments.length !== 2) {
          return { success: false, message: 'Could not find both assignments for swap' };
        }

        const [assign1, assign2] = assignments;

        // Swap user_ids
        await supabase
          .from('shift_assignments')
          .update({ user_id: assign2.user_id, assigned_by: userId })
          .eq('id', assign1.id);

        await supabase
          .from('shift_assignments')
          .update({ user_id: assign1.user_id, assigned_by: userId })
          .eq('id', assign2.id);

        // Mark conflict as resolved
        await supabase
          .from('conflicts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
          })
          .eq('id', conflict.id);

        return {
          success: true,
          message: 'Shifts swapped successfully',
          details: { shift_id: action.shift_id, swap_with_shift_id: action.swap_with_shift_id },
        };
      }

      case 'adjust_time': {
        // Adjust shift times to eliminate conflict
        if (!action.shift_id || (!action.new_start_time && !action.new_end_time)) {
          return {
            success: false,
            message: 'Missing shift_id or new times for adjust_time action',
          };
        }

        const updates: any = {};
        if (action.new_start_time) updates.start_time = action.new_start_time;
        if (action.new_end_time) updates.end_time = action.new_end_time;

        const { error: updateError } = await supabase
          .from('shifts')
          .update(updates)
          .eq('id', action.shift_id);

        if (updateError) {
          console.error('Error adjusting shift time:', updateError);
          return { success: false, message: 'Failed to adjust shift time' };
        }

        // Mark conflict as resolved
        await supabase
          .from('conflicts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
          })
          .eq('id', conflict.id);

        return {
          success: true,
          message: 'Shift time adjusted successfully',
          details: { shift_id: action.shift_id, ...updates },
        };
      }

      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    console.error('Error applying resolution:', error);
    return { success: false, message: 'Error applying resolution' };
  }
}

/**
 * POST /api/ai/resolve-conflict
 * Get AI-powered conflict resolution suggestions, optionally apply them
 *
 * Body:
 * - conflict_id: string (required) - The conflict to resolve
 * - apply_action: object (optional) - If provided, applies the resolution action
 *   - type: 'reassign' | 'remove' | 'swap' | 'adjust_time'
 *   - shift_id: string
 *   - new_employee_id?: string (for reassign)
 *   - swap_with_shift_id?: string (for swap)
 *   - new_start_time?: string (for adjust_time)
 *   - new_end_time?: string (for adjust_time)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conflict_id, apply_action } = body;

    if (!conflict_id) {
      return NextResponse.json({ error: 'conflict_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch conflict details
    const { data: conflict, error: conflictError } = await supabase
      .from('conflicts')
      .select('*, users(id, full_name), shifts(id, start_time, end_time, bureaus(name))')
      .eq('id', conflict_id)
      .single();

    if (conflictError || !conflict) {
      return NextResponse.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // If apply_action is provided, apply it directly without AI
    if (apply_action) {
      const result = await applyResolution(supabase, conflict, apply_action, user.id);

      if (result.success) {
        return NextResponse.json(
          {
            success: true,
            conflict_id,
            action_applied: apply_action.type,
            message: result.message,
            details: result.details,
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.message,
          },
          { status: 400 }
        );
      }
    }

    // Check if AI is configured
    if (!isConfigured()) {
      return NextResponse.json({ error: 'AI conflict resolution not configured' }, { status: 503 });
    }

    // Get team size
    const { count: teamSize } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('team', 'Breaking News')
      .eq('status', 'active');

    // Get alternative employees who could cover (LEFT JOIN to include those without assignments)
    const { data: allEmployees } = await supabase
      .from('users')
      .select('id, full_name, shift_role, bureau_id')
      .eq('team', 'Breaking News')
      .eq('status', 'active')
      .neq('id', conflict.user_id || '');

    // Get their assignments separately
    const { data: assignments } = await supabase
      .from('shift_assignments')
      .select('user_id, shifts!inner(start_time)')
      .in('user_id', allEmployees?.map((e: any) => e.id) || []);

    // Calculate current weekly hours for each alternative
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const alternativesData =
      allEmployees?.map((emp: any) => {
        const empAssignments = assignments?.filter((a: any) => a.user_id === emp.id) || [];
        const weeklyHours =
          empAssignments.filter((a: any) => {
            const shiftDate = new Date(a.shifts.start_time);
            return shiftDate >= weekAgo;
          }).length * 8;

        return {
          employee_id: emp.id,
          employee_name: emp.full_name,
          shift_role: emp.shift_role,
          current_weekly_hours: weeklyHours,
          can_cover: weeklyHours < 40,
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
          total_shifts_this_week: 0,
          coverage_gaps: [],
        },
      },
    };

    // Generate prompt
    const userPrompt = buildConflictPrompt(promptContext);

    // Call Claude
    console.log('Calling Claude for conflict resolution...');
    const response = await callClaude(CONFLICT_RESOLUTION_SYSTEM_PROMPT, userPrompt, 4096);

    // Parse response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const resolution = JSON.parse(jsonMatch[0]);

    // Enhance solutions with actionable data
    const enhancedSolutions =
      resolution.solutions?.map((solution: any, index: number) => {
        // Try to map solution to an actionable type
        const descLower = (solution.description || '').toLowerCase();
        let suggestedAction: any = null;

        if (descLower.includes('reassign') || descLower.includes('assign to')) {
          // Find a suggested employee from alternatives
          const availableEmployee = alternativesData.find((a: any) => a.can_cover);
          if (availableEmployee) {
            suggestedAction = {
              type: 'reassign',
              shift_id: conflict.shift_id,
              new_employee_id: availableEmployee.employee_id,
              new_employee_name: availableEmployee.employee_name,
            };
          }
        } else if (descLower.includes('remove') || descLower.includes('cancel')) {
          suggestedAction = {
            type: 'remove',
            shift_id: conflict.shift_id,
          };
        } else if (descLower.includes('swap') || descLower.includes('exchange')) {
          suggestedAction = {
            type: 'swap',
            shift_id: conflict.shift_id,
            // swap_with_shift_id would need to be determined
          };
        } else if (
          descLower.includes('adjust') ||
          descLower.includes('change time') ||
          descLower.includes('modify')
        ) {
          suggestedAction = {
            type: 'adjust_time',
            shift_id: conflict.shift_id,
            // Times would need to be determined
          };
        }

        return {
          ...solution,
          suggested_action: suggestedAction,
          can_auto_apply: suggestedAction !== null,
        };
      }) || [];

    return NextResponse.json(
      {
        success: true,
        conflict_id,
        conflict_details: {
          type: conflict.type,
          severity: conflict.severity,
          description: conflict.description,
          employee: conflict.users?.full_name,
          date: conflict.date,
        },
        resolution: {
          ...resolution,
          solutions: enhancedSolutions,
        },
        available_employees: alternativesData.filter((a: any) => a.can_cover).slice(0, 5),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resolve conflict API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
