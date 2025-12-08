import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, canConfirmPreferences } from '@/lib/auth/verify';

/**
 * POST /api/employees/:id/preferences/confirm
 * Confirm an employee's shift preferences (team leader or admin only)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only team leaders and admins can confirm preferences
    if (!canConfirmPreferences(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can confirm preferences' },
        { status: 403 }
      );
    }

    const { id: employeeId } = await params;
    const supabase = await createClient();

    // Check if employee exists
    const { data: employee, error: empError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if preferences exist
    const { data: existingPrefs, error: prefsError } = await supabase
      .from('shift_preferences')
      .select('*')
      .eq('user_id', employeeId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    const now = new Date().toISOString();

    if (existingPrefs) {
      // Update existing preferences with confirmation
      const { data: updatedPrefs, error: updateError } = await supabase
        .from('shift_preferences')
        .update({
          confirmed: true,
          confirmed_by: user.id,
          confirmed_at: now,
        })
        .eq('user_id', employeeId)
        .select('*, confirmer:users!shift_preferences_confirmed_by_fkey(full_name)')
        .single();

      if (updateError) {
        console.error('Error confirming preferences:', updateError);
        return NextResponse.json({ error: 'Failed to confirm preferences' }, { status: 500 });
      }

      return NextResponse.json({
        message: `Preferences confirmed for ${employee.full_name}`,
        preferences: {
          employee_id: employeeId,
          employee_name: employee.full_name,
          preferred_days: updatedPrefs.preferred_days || [],
          preferred_shifts: updatedPrefs.preferred_shifts || [],
          max_shifts_per_week: updatedPrefs.max_shifts_per_week || 5,
          notes: updatedPrefs.notes || '',
          confirmed: true,
          confirmed_by: user.id,
          confirmed_by_name: user.full_name,
          confirmed_at: now,
        },
      });
    } else {
      // Create new preferences with confirmation (default values)
      const { data: newPrefs, error: insertError } = await supabase
        .from('shift_preferences')
        .insert({
          user_id: employeeId,
          preferred_days: [],
          preferred_shifts: [],
          max_shifts_per_week: 5,
          notes: '',
          confirmed: true,
          confirmed_by: user.id,
          confirmed_at: now,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      return NextResponse.json({
        message: `Preferences confirmed for ${employee.full_name} (with defaults)`,
        preferences: {
          employee_id: employeeId,
          employee_name: employee.full_name,
          preferred_days: newPrefs.preferred_days || [],
          preferred_shifts: newPrefs.preferred_shifts || [],
          max_shifts_per_week: newPrefs.max_shifts_per_week || 5,
          notes: newPrefs.notes || '',
          confirmed: true,
          confirmed_by: user.id,
          confirmed_by_name: user.full_name,
          confirmed_at: now,
        },
      });
    }
  } catch (error) {
    console.error('Confirm preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
