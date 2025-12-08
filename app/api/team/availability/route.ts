import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, canConfirmPreferences } from '@/lib/auth/verify';

/**
 * GET /api/team/availability
 * Get all employees with their preference status (team leader or admin only)
 * Returns employees across ALL bureaus for team leaders and admins
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only team leaders and admins can view team availability
    if (!canConfirmPreferences(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can view team availability' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Get all employees with their preferences and bureau info
    const { data: employees, error: empError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        title,
        shift_role,
        status,
        is_team_leader,
        bureau_id,
        bureaus(name),
        shift_preferences(
          id,
          preferred_days,
          preferred_shifts,
          max_shifts_per_week,
          notes,
          confirmed,
          confirmed_by,
          confirmed_at
        )
      `
      )
      .eq('status', 'active')
      .order('full_name');

    if (empError) {
      console.error('Error fetching employees:', empError);
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }

    // Get confirmer names in a separate query
    const confirmerIds =
      employees
        ?.filter((emp: any) => emp.shift_preferences?.[0]?.confirmed_by)
        .map((emp: any) => emp.shift_preferences[0].confirmed_by) || [];

    let confirmerMap: Record<string, string> = {};
    if (confirmerIds.length > 0) {
      const { data: confirmers } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', confirmerIds);

      if (confirmers) {
        confirmerMap = confirmers.reduce((acc: Record<string, string>, c: any) => {
          acc[c.id] = c.full_name;
          return acc;
        }, {});
      }
    }

    // Format employee data
    const formattedEmployees =
      employees?.map((emp: any) => {
        const prefs = emp.shift_preferences?.[0];
        const hasPreferences =
          prefs && (prefs.preferred_days?.length > 0 || prefs.preferred_shifts?.length > 0);

        return {
          id: emp.id,
          email: emp.email,
          full_name: emp.full_name,
          title: emp.title,
          shift_role: emp.shift_role,
          is_team_leader: emp.is_team_leader || false,
          bureau_id: emp.bureau_id,
          bureau_name: emp.bureaus?.name || 'Unknown',
          preferences: {
            preferred_days: prefs?.preferred_days || [],
            preferred_shifts: prefs?.preferred_shifts || [],
            max_shifts_per_week: prefs?.max_shifts_per_week || 5,
            notes: prefs?.notes || '',
            confirmed: prefs?.confirmed || false,
            confirmed_by: prefs?.confirmed_by || null,
            confirmed_by_name: prefs?.confirmed_by
              ? confirmerMap[prefs.confirmed_by] || null
              : null,
            confirmed_at: prefs?.confirmed_at || null,
          },
          // Status indicator for UI
          status: prefs?.confirmed ? 'confirmed' : hasPreferences ? 'pending' : 'missing',
        };
      }) || [];

    // Calculate summary stats
    const stats = {
      total: formattedEmployees.length,
      confirmed: formattedEmployees.filter((e: any) => e.status === 'confirmed').length,
      pending: formattedEmployees.filter((e: any) => e.status === 'pending').length,
      missing: formattedEmployees.filter((e: any) => e.status === 'missing').length,
    };

    return NextResponse.json({
      employees: formattedEmployees,
      stats,
    });
  } catch (error) {
    console.error('Team availability error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/team/availability/confirm-all
 * Bulk confirm all pending preferences
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    if (!canConfirmPreferences(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can confirm preferences' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Update all unconfirmed preferences
    const { data, error } = await supabase
      .from('shift_preferences')
      .update({
        confirmed: true,
        confirmed_by: user.id,
        confirmed_at: now,
      })
      .eq('confirmed', false)
      .select('user_id');

    if (error) {
      console.error('Error confirming all preferences:', error);
      return NextResponse.json({ error: 'Failed to confirm preferences' }, { status: 500 });
    }

    const confirmedCount = data?.length || 0;

    return NextResponse.json({
      message: `Confirmed preferences for ${confirmedCount} employee(s)`,
      confirmed_count: confirmedCount,
    });
  } catch (error) {
    console.error('Bulk confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
