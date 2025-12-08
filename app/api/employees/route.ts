import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, isAdminOrManager } from '@/lib/auth/verify';

/**
 * GET /api/employees
 * List all employees with optional filters
 * Query params: bureau, role, status, search
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bureau = searchParams.get('bureau');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = await createClient();

    // Build query
    let query = supabase.from('users').select('*, bureaus(name, code)');

    // Apply filters
    if (bureau && bureau !== 'all') {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', bureau)
        .single();

      if (bureauData) {
        query = query.eq('bureau_id', bureauData.id);
      }
    }

    if (role && role !== 'all') {
      query = query.eq('title', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by name or email
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Order by name
    query = query.order('full_name');

    const { data: employees, error } = await query;

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }

    // Calculate shifts this month for each employee
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Set to end of last day of month (23:59:59.999)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get shift counts - include assigned, confirmed, and completed statuses
    const { data: shiftCounts, error: shiftCountError } = await supabase
      .from('shift_assignments')
      .select('user_id, status, shifts!inner(start_time)')
      .gte('shifts.start_time', monthStart.toISOString())
      .lte('shifts.start_time', monthEnd.toISOString())
      .in('status', ['assigned', 'confirmed', 'completed']);

    if (shiftCountError) {
      console.error('Error fetching shift counts:', shiftCountError);
    }

    // Count shifts per user
    const shiftsMap = new Map<string, number>();
    if (shiftCounts) {
      shiftCounts.forEach((assignment: any) => {
        const count = shiftsMap.get(assignment.user_id) || 0;
        shiftsMap.set(assignment.user_id, count + 1);
      });
    }

    // Format response to match frontend expectations
    const formattedEmployees = employees.map((emp: any) => {
      const nameParts = emp.full_name.split(' ');
      const initials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : emp.full_name.substring(0, 2).toUpperCase();

      return {
        id: emp.id,
        name: emp.full_name,
        email: emp.email,
        phone: emp.phone || '',
        role: emp.title,
        bureau: emp.bureaus?.name || 'Unknown',
        status: emp.status,
        shiftsThisMonth: shiftsMap.get(emp.id) || 0,
        is_team_leader: emp.is_team_leader || false,
        initials,
      };
    });

    return NextResponse.json({ employees: formattedEmployees }, { status: 200 });
  } catch (error) {
    console.error('Employees API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/employees
 * Create a new employee
 * Requires: admin, manager, or scheduler role
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only admin, manager, or scheduler can create employees
    if (!isAdminOrManager(user) && user.role !== 'scheduler') {
      return NextResponse.json(
        { error: 'You do not have permission to create employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, role, bureau, status } = body;

    // Validate required fields
    if (!name || !email || !role || !bureau) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Get bureau ID
    const { data: bureauData } = await supabase
      .from('bureaus')
      .select('id')
      .eq('name', bureau)
      .single();

    if (!bureauData) {
      return NextResponse.json({ error: 'Invalid bureau' }, { status: 400 });
    }

    // Determine shift_role from title
    let shift_role = 'correspondent';
    if (role.toLowerCase().includes('editor')) {
      shift_role = 'editor';
    } else if (role.toLowerCase().includes('senior')) {
      shift_role = 'senior';
    }

    // Create employee
    const { data: newEmployee, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: name,
        phone: phone || null,
        title: role,
        shift_role,
        bureau_id: bureauData.id,
        team: 'Breaking News',
        status: status || 'active',
        password_hash: '$2a$10$default.hash.for.demo.purposes.only', // User must reset
      })
      .select('*, bureaus(name)')
      .single();

    if (createError) {
      console.error('Error creating employee:', createError);
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }

    // Create default preferences
    await supabase.from('shift_preferences').insert({
      user_id: newEmployee.id,
      preferred_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      preferred_shifts: ['Morning', 'Afternoon'],
      max_shifts_per_week: 5,
    });

    // Format response
    const nameParts = newEmployee.full_name.split(' ');
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : newEmployee.full_name.substring(0, 2).toUpperCase();

    const response = {
      id: newEmployee.id,
      name: newEmployee.full_name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      role: newEmployee.title,
      bureau: newEmployee.bureaus?.name,
      status: newEmployee.status,
      shiftsThisMonth: 0,
      initials,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
