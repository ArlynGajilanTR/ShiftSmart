import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from 'date-fns';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
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
    const now = new Date();

    // Calculate date ranges
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    // 1. Total Employees
    const { count: totalEmployees } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 2. Active Employees
    const { count: activeEmployees } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 3. Active Shifts This Week
    const { count: activeShiftsThisWeek } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', thisWeekStart.toISOString())
      .lte('start_time', thisWeekEnd.toISOString());

    // 4. Active Shifts Last Week
    const { count: activeShiftsLastWeek } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', lastWeekStart.toISOString())
      .lte('start_time', lastWeekEnd.toISOString());

    // 5. Open Conflicts
    const { count: openConflicts } = await supabase
      .from('conflicts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unresolved');

    // 6. Coverage Rate (shifts with assignments vs total shifts this week)
    const { count: assignedShifts } = await supabase
      .from('shift_assignments')
      .select('*, shifts!inner(start_time)', { count: 'exact', head: true })
      .gte('shifts.start_time', thisWeekStart.toISOString())
      .lte('shifts.start_time', thisWeekEnd.toISOString())
      .in('status', ['assigned', 'confirmed']);

    const coverageRate = activeShiftsThisWeek && activeShiftsThisWeek > 0
      ? Math.round((assignedShifts || 0) / activeShiftsThisWeek * 100)
      : 0;

    // Calculate last week's coverage for comparison
    const { count: lastWeekAssignedShifts } = await supabase
      .from('shift_assignments')
      .select('*, shifts!inner(start_time)', { count: 'exact', head: true })
      .gte('shifts.start_time', lastWeekStart.toISOString())
      .lte('shifts.start_time', lastWeekEnd.toISOString())
      .in('status', ['assigned', 'confirmed']);

    const lastWeekCoverageRate = activeShiftsLastWeek && activeShiftsLastWeek > 0
      ? Math.round((lastWeekAssignedShifts || 0) / activeShiftsLastWeek * 100)
      : 0;

    const coverageChange = coverageRate - lastWeekCoverageRate;
    const coverageChangeText = coverageChange >= 0 
      ? `+${coverageChange}% from last week`
      : `${coverageChange}% from last week`;

    // Format response
    const response = {
      total_employees: totalEmployees || 0,
      active_employees: activeEmployees || 0,
      active_shifts_count: activeShiftsThisWeek || 0,
      open_conflicts: openConflicts || 0,
      coverage_rate: coverageRate,
      coverage_change: coverageChangeText,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

