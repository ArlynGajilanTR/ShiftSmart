import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * GET /api/conflicts
 * List all conflicts with optional filters
 * Query params: status, severity, limit
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = searchParams.get('limit');

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('conflicts')
      .select('*, user:users!user_id(full_name), shifts(start_time, end_time, bureaus(name))');

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    // Order by detected_at descending (most recent first)
    query = query.order('detected_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error('Error fetching conflicts:', error);
      return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 });
    }

    // Format response to match frontend expectations
    const formattedConflicts = conflicts.map((conflict: any) => {
      // Parse details for affected shifts
      const shifts = conflict.details?.shifts || [];

      return {
        id: conflict.id,
        type: conflict.type,
        severity: conflict.severity,
        status: conflict.status,
        employee: conflict.user?.full_name || null,
        description: conflict.description,
        date: conflict.date,
        shifts: shifts,
        detected_at: conflict.detected_at,
        acknowledged_at: conflict.acknowledged_at,
        acknowledged_by: conflict.acknowledged_by,
        resolved_at: conflict.resolved_at,
        resolved_by: conflict.resolved_by,
      };
    });

    return NextResponse.json({ conflicts: formattedConflicts }, { status: 200 });
  } catch (error) {
    console.error('Conflicts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/conflicts
 * Create a new conflict manually
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, severity, description, date, shift_id, user_id, details } = body;

    // Validate required fields
    if (!type || !severity || !description || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, severity, description, date' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['high', 'medium', 'low'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be: high, medium, or low' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create conflict
    const { data: newConflict, error: createError } = await supabase
      .from('conflicts')
      .insert({
        type,
        severity,
        status: 'unresolved',
        description,
        date,
        shift_id: shift_id || null,
        user_id: user_id || null,
        details: details || {},
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conflict:', createError);
      return NextResponse.json({ error: 'Failed to create conflict' }, { status: 500 });
    }

    return NextResponse.json(newConflict, { status: 201 });
  } catch (error) {
    console.error('Create conflict error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
