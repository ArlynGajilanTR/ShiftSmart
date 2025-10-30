import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * GET /api/employees/:id
 * Get a single employee with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get employee
    const { data: employee, error } = await supabase
      .from('users')
      .select('*, bureaus(name, code)')
      .eq('id', params.id)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get shift preferences
    const { data: preferences } = await supabase
      .from('shift_preferences')
      .select('*')
      .eq('user_id', params.id)
      .single();

    // Calculate shifts this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: shifts } = await supabase
      .from('shift_assignments')
      .select('shifts!inner(start_time)')
      .eq('user_id', params.id)
      .gte('shifts.start_time', monthStart.toISOString())
      .lte('shifts.start_time', monthEnd.toISOString())
      .eq('status', 'confirmed');

    // Format response
    const nameParts = employee.full_name.split(' ');
    const initials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : employee.full_name.substring(0, 2).toUpperCase();

    const response = {
      id: employee.id,
      name: employee.full_name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.title,
      bureau: employee.bureaus?.name || 'Unknown',
      status: employee.status,
      shiftsThisMonth: shifts?.length || 0,
      initials,
      preferences: preferences ? {
        preferredDays: preferences.preferred_days || [],
        preferredShifts: preferences.preferred_shifts || [],
        maxShiftsPerWeek: preferences.max_shifts_per_week || 5,
        notes: preferences.notes || '',
      } : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/:id
 * Update an employee
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, bureau, status } = body;

    const supabase = createClient();

    // Check if employee exists
    const { data: existingEmployee } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', params.id)
      .single();

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // If email is changing, check for conflicts
    if (email && email.toLowerCase() !== existingEmployee.email.toLowerCase()) {
      const { data: emailConflict } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Get bureau ID if bureau is being updated
    let bureauId = undefined;
    if (bureau) {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', bureau)
        .single();

      if (!bureauData) {
        return NextResponse.json(
          { error: 'Invalid bureau' },
          { status: 400 }
        );
      }
      bureauId = bureauData.id;
    }

    // Determine shift_role if role is being updated
    let shift_role = undefined;
    if (role) {
      shift_role = 'correspondent';
      if (role.toLowerCase().includes('editor')) {
        shift_role = 'editor';
      } else if (role.toLowerCase().includes('senior')) {
        shift_role = 'senior';
      }
    }

    // Build update object
    const updates: any = {};
    if (name) updates.full_name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone || null;
    if (role) {
      updates.title = role;
      updates.shift_role = shift_role;
    }
    if (bureauId) updates.bureau_id = bureauId;
    if (status) updates.status = status;

    // Update employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select('*, bureaus(name)')
      .single();

    if (updateError) {
      console.error('Error updating employee:', updateError);
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    // Format response
    const nameParts = updatedEmployee.full_name.split(' ');
    const initials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : updatedEmployee.full_name.substring(0, 2).toUpperCase();

    const response = {
      id: updatedEmployee.id,
      name: updatedEmployee.full_name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      role: updatedEmployee.title,
      bureau: updatedEmployee.bureaus?.name,
      status: updatedEmployee.status,
      initials,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/:id
 * Delete an employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check if employee exists
    const { data: existingEmployee } = await supabase
      .from('users')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete employee (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting employee:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

