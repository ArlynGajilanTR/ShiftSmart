// AI Scheduling Agent - Orchestrates Claude Sonnet 4.5 for intelligent scheduling

import { callClaude, isConfigured } from './client';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts/schedule-generation';
import { createClient } from '@/lib/supabase/server';
import { format, parseISO, isWeekend, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface ScheduleRequest {
  period: {
    start_date: string;
    end_date: string;
    type: 'week' | 'month' | 'quarter';
  };
  bureau?: 'Milan' | 'Rome' | 'both';
  preserve_existing?: boolean;
}

interface ScheduleResponse {
  shifts: Array<{
    date: string;
    start_time: string;
    end_time: string;
    bureau: string;
    assigned_to: string;
    role_level: string;
    shift_type: string;
    reasoning: string;
  }>;
  fairness_metrics: {
    weekend_shifts_per_person: Record<string, number>;
    night_shifts_per_person: Record<string, number>;
    total_shifts_per_person: Record<string, number>;
    preference_satisfaction_rate: number;
    hard_constraint_violations: string[];
  };
  recommendations: string[];
}

/**
 * Generate Italian holidays for a date range
 * TODO: Replace with actual Italian holiday API or database
 */
function getItalianHolidays(startDate: string, endDate: string): string[] {
  const holidays: Record<string, string> = {
    '01-01': "New Year's Day",
    '01-06': 'Epiphany',
    '04-25': 'Liberation Day',
    '05-01': 'Labour Day',
    '06-02': 'Republic Day',
    '08-15': 'Ferragosto',
    '11-01': "All Saints' Day",
    '12-08': 'Immaculate Conception',
    '12-25': 'Christmas',
    '12-26': 'Santo Stefano',
  };

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const year = start.getFullYear();

  const holidaysInRange: string[] = [];

  Object.keys(holidays).forEach((monthDay) => {
    const holidayDate = parseISO(`${year}-${monthDay}`);
    if (holidayDate >= start && holidayDate <= end) {
      holidaysInRange.push(format(holidayDate, 'yyyy-MM-dd'));
    }
  });

  return holidaysInRange;
}

/**
 * Calculate recent shift history for fairness
 */
async function calculateRecentHistory(
  userId: string,
  supabase: any
): Promise<{
  weekend_shifts_last_month: number;
  night_shifts_last_month: number;
  total_shifts_last_month: number;
  last_holiday_worked?: string;
}> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Get shifts from last month
  const { data: shifts } = await supabase
    .from('shift_assignments')
    .select('*, shifts!inner(start_time, end_time)')
    .eq('user_id', userId)
    .gte('shifts.start_time', oneMonthAgo.toISOString())
    .in('status', ['assigned', 'confirmed', 'completed']);

  if (!shifts || shifts.length === 0) {
    return {
      weekend_shifts_last_month: 0,
      night_shifts_last_month: 0,
      total_shifts_last_month: 0,
    };
  }

  let weekendCount = 0;
  let nightCount = 0;

  shifts.forEach((assignment: any) => {
    const startTime = parseISO(assignment.shifts.start_time);
    const hour = startTime.getHours();

    // Check if weekend
    if (isWeekend(startTime)) {
      weekendCount++;
    }

    // Check if night shift (00:00 - 08:00)
    if (hour >= 0 && hour < 8) {
      nightCount++;
    }
  });

  return {
    weekend_shifts_last_month: weekendCount,
    night_shifts_last_month: nightCount,
    total_shifts_last_month: shifts.length,
  };
}

/**
 * Main AI Scheduling Agent
 */
export async function generateSchedule(request: ScheduleRequest): Promise<{
  success: boolean;
  data?: ScheduleResponse;
  error?: string;
}> {
  try {
    // Check if API key is configured
    if (!isConfigured()) {
      return {
        success: false,
        error: 'AI scheduling not configured. Please set ANTHROPIC_API_KEY environment variable.',
      };
    }

    const supabase = await createClient();

    // 1. Fetch employees
    let employeeQuery = supabase
      .from('users')
      .select('*, shift_preferences(*), bureaus(name)')
      .eq('team', 'Breaking News')
      .eq('status', 'active');

    if (request.bureau && request.bureau !== 'both') {
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('id')
        .eq('name', request.bureau)
        .single();

      if (bureauData) {
        employeeQuery = employeeQuery.eq('bureau_id', bureauData.id);
      }
    }

    const { data: employees, error: empError } = await employeeQuery;

    if (empError || !employees || employees.length === 0) {
      return {
        success: false,
        error: 'No employees found for scheduling',
      };
    }

    // 2. Fetch existing shifts if preserving
    let existingShifts: any[] = [];
    if (request.preserve_existing) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*, shift_assignments(users(full_name))')
        .gte('start_time', `${request.period.start_date}T00:00:00`)
        .lte('start_time', `${request.period.end_date}T23:59:59`);

      if (shifts) {
        existingShifts = shifts
          .filter((s: any) => s.shift_assignments && s.shift_assignments.length > 0)
          .map((s: any) => ({
            date: format(parseISO(s.start_time), 'yyyy-MM-dd'),
            employee_name: s.shift_assignments[0].users.full_name,
            shift_type: getShiftType(parseISO(s.start_time)),
          }));
      }
    }

    // 3. Build employee data with history
    const employeeData = await Promise.all(
      employees.map(async (emp: any) => {
        const history = await calculateRecentHistory(emp.id, supabase);

        // Parse unavailable days from notes if present
        const unavailableDays: string[] = [];
        if (emp.shift_preferences?.notes) {
          const notes = emp.shift_preferences.notes.toLowerCase();
          if (notes.includes('monday')) unavailableDays.push('Monday');
          if (notes.includes('tuesday')) unavailableDays.push('Tuesday');
          if (notes.includes('wednesday')) unavailableDays.push('Wednesday');
          if (notes.includes('thursday')) unavailableDays.push('Thursday');
          if (notes.includes('friday')) unavailableDays.push('Friday');
        }

        return {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          title: emp.title,
          shift_role: emp.shift_role,
          bureau: emp.bureaus?.name || 'Unknown',
          preferences: {
            preferred_days: emp.shift_preferences?.preferred_days || [],
            preferred_shifts: emp.shift_preferences?.preferred_shifts || [],
            unavailable_days: unavailableDays,
            max_shifts_per_week: emp.shift_preferences?.max_shifts_per_week || 5,
            notes: emp.shift_preferences?.notes || '',
          },
          recent_history: history,
        };
      })
    );

    // 4. Get Italian holidays
    const holidays = getItalianHolidays(request.period.start_date, request.period.end_date);

    // 5. Build prompts
    const userPrompt = buildUserPrompt({
      period: request.period,
      employees: employeeData,
      existing_shifts: existingShifts,
      italian_holidays: holidays,
    });

    // 6. Call Claude
    console.log('Calling Claude Sonnet 4.5 for schedule generation...');
    const response = await callClaude(SYSTEM_PROMPT, userPrompt, 8192);

    // 7. Parse response
    const scheduleData = parseScheduleResponse(response);

    if (!scheduleData) {
      return {
        success: false,
        error: 'Failed to parse AI response. Please try again.',
      };
    }

    // 8. Validate shift count (Issue #5)
    const dateDiff =
      Math.abs(
        new Date(request.period.end_date).getTime() - new Date(request.period.start_date).getTime()
      ) /
      (1000 * 60 * 60 * 24);

    const maxExpectedShifts = (dateDiff + 1) * 24; // Max one shift per hour per day
    if (scheduleData.shifts.length > maxExpectedShifts) {
      console.error(
        `[Validation Error] AI generated ${scheduleData.shifts.length} shifts, exceeds limit of ${maxExpectedShifts} for ${dateDiff + 1} days`
      );
      return {
        success: false,
        error: `AI generated ${scheduleData.shifts.length} shifts, which exceeds reasonable limit for ${Math.floor(dateDiff + 1)} days. Please try again.`,
      };
    }

    if (scheduleData.shifts.length === 0) {
      return {
        success: false,
        error: 'AI generated 0 shifts. This may indicate a prompt issue or constraint conflict.',
      };
    }

    console.log(
      `[Validation Success] ${scheduleData.shifts.length} shifts validated for ${Math.floor(dateDiff + 1)} days`
    );

    return {
      success: true,
      data: scheduleData,
    };
  } catch (error) {
    console.error('Schedule generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Determine shift type from start time
 * Fixed: Issue #1 - Night shifts (00:00-07:59) now correctly classified
 */
function getShiftType(date: Date): string {
  const hour = date.getHours();
  if (hour >= 8 && hour < 16) return 'Morning';
  if (hour >= 16 && hour < 24) return 'Afternoon';
  return 'Night'; // 00:00 - 07:59
}

/**
 * Parse Claude's JSON response
 * Fixed: Issue #3 - Comprehensive validation with default values for missing fields
 */
function parseScheduleResponse(response: string): ScheduleResponse | null {
  try {
    // Log raw response for debugging (first 500 chars)
    console.log('[AI Response] Raw Claude output (first 500 chars):', response.substring(0, 500));

    // Try to extract JSON (prefer markdown code blocks first)
    let jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      console.error('[Parse Error] No JSON found in response');
      return null;
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonString);

    // Comprehensive validation - shifts array
    if (!parsed.shifts || !Array.isArray(parsed.shifts)) {
      console.error('[Parse Error] Missing or invalid shifts array');
      return null;
    }

    if (parsed.shifts.length === 0) {
      console.error('[Parse Error] Empty shifts array');
      return null;
    }

    // Validate first shift has required fields
    const firstShift = parsed.shifts[0];
    const requiredFields = [
      'date',
      'start_time',
      'end_time',
      'bureau',
      'assigned_to',
      'shift_type',
    ];
    for (const field of requiredFields) {
      if (!firstShift[field]) {
        console.error(`[Parse Error] Missing required field in shift: ${field}`);
        return null;
      }
    }

    // Ensure fairness_metrics exists with defaults
    if (!parsed.fairness_metrics) {
      console.warn('[Parse Warning] Missing fairness_metrics, using defaults');
      parsed.fairness_metrics = {
        weekend_shifts_per_person: {},
        night_shifts_per_person: {},
        total_shifts_per_person: {},
        preference_satisfaction_rate: 0,
        hard_constraint_violations: [],
      };
    } else {
      // Ensure all sub-fields exist
      parsed.fairness_metrics.weekend_shifts_per_person =
        parsed.fairness_metrics.weekend_shifts_per_person || {};
      parsed.fairness_metrics.night_shifts_per_person =
        parsed.fairness_metrics.night_shifts_per_person || {};
      parsed.fairness_metrics.total_shifts_per_person =
        parsed.fairness_metrics.total_shifts_per_person || {};
      parsed.fairness_metrics.preference_satisfaction_rate =
        parsed.fairness_metrics.preference_satisfaction_rate || 0;
      parsed.fairness_metrics.hard_constraint_violations =
        parsed.fairness_metrics.hard_constraint_violations || [];
    }

    // Ensure recommendations exists
    if (!parsed.recommendations) {
      parsed.recommendations = [];
    }

    console.log(`[Parse Success] Parsed ${parsed.shifts.length} shifts successfully`);
    return parsed as ScheduleResponse;
  } catch (error) {
    console.error('[Parse Error] JSON parse exception:', error);
    console.error('[Parse Error] Attempted to parse:', response.substring(0, 200));
    return null;
  }
}

/**
 * Save AI-generated schedule to database
 */
export async function saveSchedule(
  scheduleData: ScheduleResponse,
  userId: string
): Promise<{ success: boolean; shift_ids?: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    const createdShiftIds: string[] = [];

    for (const shift of scheduleData.shifts) {
      // Find employee by name
      const { data: employee } = await supabase
        .from('users')
        .select('id, bureau_id')
        .eq('full_name', shift.assigned_to)
        .single();

      if (!employee) {
        console.warn(`Employee not found: ${shift.assigned_to}`);
        continue;
      }

      // Create shift with midnight crossing and timezone handling
      // Issue #7: Handle shifts ending at midnight (next day)
      let endDate = shift.date;
      let endTime = shift.end_time;

      // Check for midnight crossing (afternoon shifts ending at 00:00)
      if (endTime === '00:00' || endTime === '24:00') {
        // Shift crosses into next day
        const shiftDate = parseISO(shift.date);
        shiftDate.setDate(shiftDate.getDate() + 1);
        endDate = format(shiftDate, 'yyyy-MM-dd');
        endTime = '00:00';
        console.log(
          `[Midnight Crossing] Shift ${shift.date} ${shift.start_time}-00:00 ends on ${endDate}`
        );
      }

      // Issue #6: Add timezone for Europe/Rome (Italy)
      // Italy is UTC+1 (CET) or UTC+2 (CEST during DST)
      // PostgreSQL will store as timestamptz with timezone info
      const startTimestamp = `${shift.date}T${shift.start_time}:00+01:00`;
      const endTimestamp = `${endDate}T${endTime}:00+01:00`;

      const { data: newShift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          bureau_id: employee.bureau_id,
          start_time: startTimestamp,
          end_time: endTimestamp,
          status: 'published',
          required_staff: 1,
          notes: `AI Generated: ${shift.reasoning}`,
        })
        .select()
        .single();

      if (shiftError || !newShift) {
        console.error('Failed to create shift:', shiftError);
        continue;
      }

      // Create assignment
      await supabase.from('shift_assignments').insert({
        shift_id: newShift.id,
        user_id: employee.id,
        status: 'assigned',
        assigned_by: userId,
        notes: shift.reasoning,
      });

      createdShiftIds.push(newShift.id);
    }

    return {
      success: true,
      shift_ids: createdShiftIds,
    };
  } catch (error) {
    console.error('Save schedule error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save schedule',
    };
  }
}
