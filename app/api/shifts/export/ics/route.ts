import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verify';
import { format, parseISO } from 'date-fns';

/**
 * GET /api/shifts/export/ics
 * Export user's shifts as iCalendar file for Outlook/Google Calendar
 * Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date query parameters are required' },
        { status: 400 }
      );
    }

    // Query shifts assigned to this user
    const { data: assignments, error } = await supabase
      .from('shift_assignments')
      .select(
        `
        id,
        shifts!inner(
          id,
          start_time,
          end_time,
          bureaus(name)
        )
      `
      )
      .eq('user_id', user.id)
      .gte('shifts.start_time', `${startDate}T00:00:00`)
      .lte('shifts.start_time', `${endDate}T23:59:59`);

    if (error) {
      console.error('Error fetching shifts for ICS export:', error);
      return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }

    // Build ICS content
    const events = (assignments || [])
      .map((assignment: any) => {
        const shift = assignment.shifts;
        const startTime = parseISO(shift.start_time);
        const endTime = parseISO(shift.end_time);
        const bureauName = shift.bureaus?.name || 'Unknown';

        return `BEGIN:VEVENT
UID:${shift.id}@shiftsmart
DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss'Z'")}
DTEND:${format(endTime, "yyyyMMdd'T'HHmmss'Z'")}
SUMMARY:Shift - ${bureauName}
DESCRIPTION:Role: ${user.title || 'Staff'}
LOCATION:${bureauName}
END:VEVENT`;
      })
      .join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ShiftSmart//Reuters Breaking News//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ShiftSmart Schedule
${events}
END:VCALENDAR`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="shiftsmart-schedule-${startDate}-to-${endDate}.ics"`,
      },
    });
  } catch (error) {
    console.error('ICS export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
