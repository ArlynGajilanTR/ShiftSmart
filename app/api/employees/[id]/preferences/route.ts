import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, canConfirmPreferences } from '@/lib/auth/verify';

/**
 * GET /api/employees/:id/preferences
 * Get employee shift preferences
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Check if employee exists
    const { data: employee } = await supabase.from('users').select('id').eq('id', id).single();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get preferences with confirmer info
    const { data: preferences, error } = await supabase
      .from('shift_preferences')
      .select('*, confirmer:users!shift_preferences_confirmed_by_fkey(full_name)')
      .eq('user_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found is ok
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Format response with confirmation fields
    const response = {
      employee_id: id,
      preferred_days: preferences?.preferred_days || [],
      preferred_shifts: preferences?.preferred_shifts || [],
      max_shifts_per_week: preferences?.max_shifts_per_week || 5,
      notes: preferences?.notes || '',
      confirmed: preferences?.confirmed || false,
      confirmed_by: preferences?.confirmed_by || null,
      confirmed_by_name: preferences?.confirmer?.full_name || null,
      confirmed_at: preferences?.confirmed_at || null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/employees/:id/preferences
 * Update employee shift preferences
 *
 * If staff edits their own preferences, confirmation is reset.
 * If team leader/admin edits, they can optionally confirm with `auto_confirm: true`.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferred_days, preferred_shifts, max_shifts_per_week, notes, auto_confirm } = body;

    const supabase = await createClient();
    const { id: employeeId } = await params;

    // Check if employee exists
    const { data: employee } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', employeeId)
      .single();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('shift_preferences')
      .select('id, confirmed')
      .eq('user_id', employeeId)
      .single();

    // Determine confirmation status
    const isTeamLeaderOrAdmin = canConfirmPreferences(user);
    const isEditingOwnPrefs = user.id === employeeId;

    // Build update/insert object
    const prefsData: any = {
      user_id: employeeId,
    };

    if (preferred_days !== undefined) prefsData.preferred_days = preferred_days;
    if (preferred_shifts !== undefined) prefsData.preferred_shifts = preferred_shifts;
    if (max_shifts_per_week !== undefined) prefsData.max_shifts_per_week = max_shifts_per_week;
    if (notes !== undefined) prefsData.notes = notes;

    // Handle confirmation status:
    // - If staff edits own preferences: reset confirmation
    // - If team leader edits and auto_confirm is true: confirm
    // - If team leader edits without auto_confirm: keep existing status
    if (isEditingOwnPrefs && !isTeamLeaderOrAdmin) {
      // Staff editing their own - reset confirmation
      prefsData.confirmed = false;
      prefsData.confirmed_by = null;
      prefsData.confirmed_at = null;
    } else if (isTeamLeaderOrAdmin && auto_confirm) {
      // Team leader wants to auto-confirm
      prefsData.confirmed = true;
      prefsData.confirmed_by = user.id;
      prefsData.confirmed_at = new Date().toISOString();
    }
    // Otherwise, keep existing confirmation status

    let updatedPrefs;
    if (existingPrefs) {
      // Update existing preferences
      const { data, error: updateError } = await supabase
        .from('shift_preferences')
        .update(prefsData)
        .eq('user_id', employeeId)
        .select('*, confirmer:users!shift_preferences_confirmed_by_fkey(full_name)')
        .single();

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }
      updatedPrefs = data;
    } else {
      // Create new preferences - default to unconfirmed unless auto_confirm
      if (!prefsData.hasOwnProperty('confirmed')) {
        prefsData.confirmed = false;
      }

      const { data, error: insertError } = await supabase
        .from('shift_preferences')
        .insert(prefsData)
        .select('*, confirmer:users!shift_preferences_confirmed_by_fkey(full_name)')
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }
      updatedPrefs = data;
    }

    // Format response with confirmation fields
    const response = {
      employee_id: employeeId,
      employee_name: employee.full_name,
      preferred_days: updatedPrefs.preferred_days || [],
      preferred_shifts: updatedPrefs.preferred_shifts || [],
      max_shifts_per_week: updatedPrefs.max_shifts_per_week || 5,
      notes: updatedPrefs.notes || '',
      confirmed: updatedPrefs.confirmed || false,
      confirmed_by: updatedPrefs.confirmed_by || null,
      confirmed_by_name: updatedPrefs.confirmer?.full_name || null,
      confirmed_at: updatedPrefs.confirmed_at || null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
