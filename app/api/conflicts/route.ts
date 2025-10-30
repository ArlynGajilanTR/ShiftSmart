import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format } from 'date-fns';

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
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Failed to fetch conflicts' },
        { status: 500 }
      );
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

    return NextResponse.json(formattedConflicts, { status: 200 });
  } catch (error) {
    console.error('Conflicts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

