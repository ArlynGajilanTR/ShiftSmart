import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * GET /api/time-off
 * List current user's time-off entries
 * Optional query params: start_date, end_date (ISO date format)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query - users can only see their own time-off entries
    let query = supabase
      .from('time_off_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    // Optional date range filter
    if (startDate) {
      query = query.gte('end_date', startDate); // Overlaps with range
    }
    if (endDate) {
      query = query.lte('start_date', endDate); // Overlaps with range
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching time-off requests:', error);
      // Handle "table does not exist" errors from Supabase/PostgREST
      // - Postgres: 42P01
      // - PostgREST: PGRST205 with message about missing table in schema cache
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
        { error: 'Failed to fetch time-off requests', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ time_off_requests: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Get time-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/time-off
 * Create new time-off entry for current user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start_date, end_date, type, notes } = body;

    // Validate required fields
    if (!start_date || !end_date || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: start_date, end_date, and type are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) {
      return NextResponse.json({ error: 'end_date must be >= start_date' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['vacation', 'personal', 'sick', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create time-off entry
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({
        user_id: user.id,
        start_date,
        end_date,
        type,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time-off request:', error);
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
        { error: 'Failed to create time-off request', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ time_off_request: data }, { status: 201 });
  } catch (error) {
    console.error('Create time-off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
