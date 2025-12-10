import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth, canGenerateSchedule } from '@/lib/auth/verify';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSchedulePDF } from '@/lib/pdf/schedule-template';
import { format, parseISO } from 'date-fns';

/**
 * GET /api/shifts/export/pdf
 * Export schedule as PDF (team leaders and admins only)
 * Query params: start_date, end_date, bureau (Milan|Rome|both)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Only team leaders and admins can export PDF
    if (!canGenerateSchedule(user)) {
      return NextResponse.json(
        { error: 'Only team leaders and administrators can export PDF schedules' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const bureau = searchParams.get('bureau') || 'both';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date query parameters are required' },
        { status: 400 }
      );
    }

    // Query shifts with assignments
    let query = supabase
      .from('shifts')
      .select(
        `
        id,
        start_time,
        end_time,
        bureaus(name),
        shift_assignments(
          users(full_name, title)
        )
      `
      )
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('start_time', `${endDate}T23:59:59`)
      .order('start_time', { ascending: true });

    // Filter by bureau if specified
    if (bureau !== 'both') {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', bureau)
        .single();
      if (bureauData) {
        query = query.eq('bureau_id', bureauData.id);
      }
    }

    const { data: shifts, error } = await query;

    if (error) {
      console.error('Error fetching shifts for PDF export:', error);
      return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }

    // Transform shifts for PDF
    const pdfShifts = (shifts || [])
      .filter((s: any) => s.shift_assignments?.length > 0)
      .map((s: any) => {
        const assignment = s.shift_assignments[0];
        const startTime = parseISO(s.start_time);
        const endTime = parseISO(s.end_time);
        return {
          id: s.id,
          date: format(startTime, 'yyyy-MM-dd'),
          startTime: format(startTime, 'HH:mm'),
          endTime: format(endTime, 'HH:mm'),
          employee: assignment.users?.full_name || 'Unassigned',
          bureau: s.bureaus?.name || 'Unknown',
          role: assignment.users?.title || 'Staff',
        };
      });

    // Generate PDF
    const pdfDocument = createSchedulePDF({
      shifts: pdfShifts,
      startDate: startDate,
      endDate: endDate,
      bureau: bureau,
      generatedAt: format(new Date(), 'MMM d, yyyy HH:mm'),
    });

    const pdfBuffer = await renderToBuffer(pdfDocument);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shiftsmart-schedule-${startDate}-to-${endDate}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
