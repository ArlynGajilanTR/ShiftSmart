import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

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

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('shift_preferences')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found is ok
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Format response
    const response = {
      employee_id: id,
      preferred_days: preferences?.preferred_days || [],
      preferred_shifts: preferences?.preferred_shifts || [],
      max_shifts_per_week: preferences?.max_shifts_per_week || 5,
      notes: preferences?.notes || '',
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
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferred_days, preferred_shifts, max_shifts_per_week, notes } = body;

    const supabase = await createClient();
    const { id } = await params;

    // Check if employee exists
    const { data: employee } = await supabase.from('users').select('id').eq('id', id).single();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('shift_preferences')
      .select('id')
      .eq('user_id', id)
      .single();

    // Build update/insert object
    const prefsData: any = {
      user_id: id,
    };

    if (preferred_days !== undefined) prefsData.preferred_days = preferred_days;
    if (preferred_shifts !== undefined) prefsData.preferred_shifts = preferred_shifts;
    if (max_shifts_per_week !== undefined) prefsData.max_shifts_per_week = max_shifts_per_week;
    if (notes !== undefined) prefsData.notes = notes;

    let updatedPrefs;
    if (existingPrefs) {
      // Update existing preferences
      const { data, error: updateError } = await supabase
        .from('shift_preferences')
        .update(prefsData)
        .eq('user_id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }
      updatedPrefs = data;
    } else {
      // Create new preferences
      const { data, error: insertError } = await supabase
        .from('shift_preferences')
        .insert(prefsData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }
      updatedPrefs = data;
    }

    // Format response
    const response = {
      employee_id: id,
      preferred_days: updatedPrefs.preferred_days || [],
      preferred_shifts: updatedPrefs.preferred_shifts || [],
      max_shifts_per_week: updatedPrefs.max_shifts_per_week || 5,
      notes: updatedPrefs.notes || '',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
