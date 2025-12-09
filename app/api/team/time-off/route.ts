import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, canConfirmPreferences } from '@/lib/auth/verify';

/**
 * GET /api/team/time-off
 * Get all time-off requests for team members (team leader or admin only)
 * Optional query params: start_date, end_date (ISO date format)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only team leaders and admins can view team time-off
    if (!canConfirmPreferences(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can view team time-off' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query for time-off requests with user info
    let query = supabase
      .from('time_off_requests')
      .select(
        `
        id,
        user_id,
        start_date,
        end_date,
        type,
        notes,
        created_at,
        updated_at,
        users!inner(
          id,
          full_name,
          email,
          title,
          shift_role,
          bureau_id,
          bureaus(name)
        )
      `
      )
      .order('start_date', { ascending: true });

    // Optional date range filter (show entries overlapping with the range)
    if (startDate) {
      query = query.gte('end_date', startDate); // Entry ends after or on start_date
    }
    if (endDate) {
      query = query.lte('start_date', endDate); // Entry starts before or on end_date
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team time-off requests:', error);
      // Handle "table does not exist" errors from Supabase/PostgREST
      const isMissingTableError =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes("Could not find the table 'public.time_off_requests'");

      if (isMissingTableError) {
        return NextResponse.json(
          {
            error:
              'Time-off feature not initialized. Please run database migration: supabase/migrations/002_time_off_requests.sql',
            details: error.message,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch team time-off requests', details: error.message },
        { status: 500 }
      );
    }

    // Format the data for the response
    const formattedRequests =
      data?.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        employee_name: entry.users?.full_name || 'Unknown',
        employee_email: entry.users?.email || '',
        employee_title: entry.users?.title || '',
        employee_role: entry.users?.shift_role || '',
        bureau_id: entry.users?.bureau_id || null,
        bureau_name: entry.users?.bureaus?.name || 'Unknown',
        start_date: entry.start_date,
        end_date: entry.end_date,
        type: entry.type,
        notes: entry.notes,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      })) || [];

    // Calculate summary stats
    const uniqueEmployees = new Set(formattedRequests.map((r: any) => r.user_id));
    const stats = {
      total_requests: formattedRequests.length,
      employees_with_time_off: uniqueEmployees.size,
      by_type: {
        vacation: formattedRequests.filter((r: any) => r.type === 'vacation').length,
        personal: formattedRequests.filter((r: any) => r.type === 'personal').length,
        sick: formattedRequests.filter((r: any) => r.type === 'sick').length,
        other: formattedRequests.filter((r: any) => r.type === 'other').length,
      },
    };

    return NextResponse.json({
      time_off_requests: formattedRequests,
      stats,
    });
  } catch (error) {
    console.error('Team time-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
