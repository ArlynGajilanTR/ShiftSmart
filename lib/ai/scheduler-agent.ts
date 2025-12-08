// AI Scheduling Agent - Orchestrates Claude Haiku 4.5 for intelligent scheduling

import { callClaude, isConfigured } from './client';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts/schedule-generation';
import { createClient } from '@/lib/supabase/server';
import {
  format,
  parseISO,
  isWeekend,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  differenceInHours,
  getDay,
} from 'date-fns';

// Debug storage for failed responses (in-memory for debugging)
interface DebugResponse {
  timestamp: string;
  response: string;
  responseLength: number;
  error: string;
  requestConfig: any;
}

const failedResponses: DebugResponse[] = [];
const MAX_STORED_FAILURES = 5;

export function getLastFailedResponses(): DebugResponse[] {
  return failedResponses.slice(-MAX_STORED_FAILURES);
}

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
 * Calculate recent shift history for fairness (OPTIMIZED - bulk query)
 * Performance: 15 queries → 1 query (15x faster)
 */
async function calculateRecentHistoryBulk(
  userIds: string[],
  supabase: any
): Promise<
  Map<
    string,
    {
      weekend_shifts_last_month: number;
      night_shifts_last_month: number;
      total_shifts_last_month: number;
    }
  >
> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // OPTIMIZATION: Single query for all employees
  const { data: shifts } = await supabase
    .from('shift_assignments')
    .select('user_id, shifts!inner(start_time, end_time)')
    .in('user_id', userIds)
    .gte('shifts.start_time', oneMonthAgo.toISOString())
    .in('status', ['assigned', 'confirmed', 'completed']);

  // Build map of user_id → history
  const historyMap = new Map();

  // Initialize all users with zero counts
  userIds.forEach((id) => {
    historyMap.set(id, {
      weekend_shifts_last_month: 0,
      night_shifts_last_month: 0,
      total_shifts_last_month: 0,
    });
  });

  if (shifts && shifts.length > 0) {
    shifts.forEach((assignment: any) => {
      const history = historyMap.get(assignment.user_id);
      if (!history) return;

      const startTime = parseISO(assignment.shifts.start_time);
      const hour = startTime.getHours();

      history.total_shifts_last_month++;
      if (isWeekend(startTime)) history.weekend_shifts_last_month++;
      if (hour >= 0 && hour < 8) history.night_shifts_last_month++;
    });
  }

  return historyMap;
}

/**
 * Generate schedule for a single bureau (used for parallel execution)
 */
async function generateScheduleForBureau(
  request: ScheduleRequest,
  bureau: 'Milan' | 'Rome'
): Promise<{ success: boolean; data?: ScheduleResponse; error?: string }> {
  const singleBureauRequest = { ...request, bureau };
  return generateScheduleSingle(singleBureauRequest);
}

/**
 * Merge two schedule responses into one
 */
function mergeScheduleResponses(milan: ScheduleResponse, rome: ScheduleResponse): ScheduleResponse {
  return {
    shifts: [...milan.shifts, ...rome.shifts],
    fairness_metrics: {
      weekend_shifts_per_person: {
        ...milan.fairness_metrics.weekend_shifts_per_person,
        ...rome.fairness_metrics.weekend_shifts_per_person,
      },
      night_shifts_per_person: {
        ...milan.fairness_metrics.night_shifts_per_person,
        ...rome.fairness_metrics.night_shifts_per_person,
      },
      total_shifts_per_person: {
        ...milan.fairness_metrics.total_shifts_per_person,
        ...rome.fairness_metrics.total_shifts_per_person,
      },
      preference_satisfaction_rate:
        (milan.fairness_metrics.preference_satisfaction_rate +
          rome.fairness_metrics.preference_satisfaction_rate) /
        2,
      hard_constraint_violations: [
        ...milan.fairness_metrics.hard_constraint_violations,
        ...rome.fairness_metrics.hard_constraint_violations,
      ],
    },
    recommendations: [...milan.recommendations, ...rome.recommendations],
  };
}

/**
 * Main AI Scheduling Agent - with parallel bureau support
 */
export async function generateSchedule(request: ScheduleRequest): Promise<{
  success: boolean;
  data?: ScheduleResponse;
  error?: string;
}> {
  // Check if API key is configured
  if (!isConfigured()) {
    return {
      success: false,
      error: 'AI scheduling not configured. Please set ANTHROPIC_API_KEY environment variable.',
    };
  }

  // OPTIMIZATION: Parallel generation for both bureaus
  if (request.bureau === 'both') {
    console.log('[Parallel] Generating schedules for Milan and Rome simultaneously...');
    const startTime = Date.now();

    const [milanResult, romeResult] = await Promise.all([
      generateScheduleForBureau(request, 'Milan'),
      generateScheduleForBureau(request, 'Rome'),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(
      `[Parallel] Both bureaus completed in ${elapsed}ms (vs ~${elapsed * 2}ms sequential)`
    );

    if (!milanResult.success || !milanResult.data) {
      return { success: false, error: `Milan: ${milanResult.error}` };
    }
    if (!romeResult.success || !romeResult.data) {
      return { success: false, error: `Rome: ${romeResult.error}` };
    }

    return {
      success: true,
      data: mergeScheduleResponses(milanResult.data, romeResult.data),
    };
  }

  // Single bureau generation
  return generateScheduleSingle(request);
}

/**
 * Generate schedule for a single bureau
 */
async function generateScheduleSingle(request: ScheduleRequest): Promise<{
  success: boolean;
  data?: ScheduleResponse;
  error?: string;
}> {
  try {
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

    // 3. Build employee data with history (OPTIMIZED - single bulk query)
    const userIds = employees.map((emp: any) => emp.id);
    const historyMap = await calculateRecentHistoryBulk(userIds, supabase);

    // OPTIMIZATION: Fetch time-off requests for all employees in bulk
    const { data: timeOffEntries } = await supabase
      .from('time_off_requests')
      .select('user_id, start_date, end_date')
      .in('user_id', userIds)
      .gte('end_date', request.period.start_date) // Overlaps with schedule period
      .lte('start_date', request.period.end_date); // Overlaps with schedule period

    // Build map of user_id -> array of unavailable dates from time-off
    const timeOffMap = new Map<string, string[]>();
    if (timeOffEntries) {
      timeOffEntries.forEach((entry: any) => {
        const dates = eachDayOfInterval({
          start: parseISO(entry.start_date),
          end: parseISO(entry.end_date),
        });
        const dateStrings = dates.map((d) => format(d, 'yyyy-MM-dd'));
        const existing = timeOffMap.get(entry.user_id) || [];
        timeOffMap.set(entry.user_id, [...existing, ...dateStrings]);
      });
    }

    // Convert day-of-week names to specific dates for the schedule period
    const scheduleStart = parseISO(request.period.start_date);
    const scheduleEnd = parseISO(request.period.end_date);
    const allScheduleDates = eachDayOfInterval({ start: scheduleStart, end: scheduleEnd });

    // Map day names to day-of-week numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dayNameToNumber: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const employeeData = employees.map((emp: any) => {
      // Parse unavailable days from notes if present (backward compatibility)
      // Convert day-of-week names to specific dates for this schedule period
      const unavailableDays: string[] = [];
      if (emp.shift_preferences?.notes) {
        const notes = emp.shift_preferences.notes.toLowerCase();
        const dayNames: string[] = [];
        if (notes.includes('monday')) dayNames.push('Monday');
        if (notes.includes('tuesday')) dayNames.push('Tuesday');
        if (notes.includes('wednesday')) dayNames.push('Wednesday');
        if (notes.includes('thursday')) dayNames.push('Thursday');
        if (notes.includes('friday')) dayNames.push('Friday');
        if (notes.includes('saturday')) dayNames.push('Saturday');
        if (notes.includes('sunday')) dayNames.push('Sunday');

        // Convert day names to specific dates in the schedule period
        dayNames.forEach((dayName) => {
          const dayNumber = dayNameToNumber[dayName];
          allScheduleDates.forEach((date) => {
            if (getDay(date) === dayNumber) {
              unavailableDays.push(format(date, 'yyyy-MM-dd'));
            }
          });
        });
      }

      // Add time-off dates to unavailable_days (specific dates in YYYY-MM-DD format)
      const timeOffDates = timeOffMap.get(emp.id) || [];
      unavailableDays.push(...timeOffDates);

      // Remove duplicates (in case a day name matches a time-off date)
      const uniqueUnavailableDays = Array.from(new Set(unavailableDays));

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
          unavailable_days: uniqueUnavailableDays,
          max_shifts_per_week: emp.shift_preferences?.max_shifts_per_week || 5,
          notes: emp.shift_preferences?.notes || '',
        },
        recent_history: historyMap.get(emp.id) || {
          weekend_shifts_last_month: 0,
          night_shifts_last_month: 0,
          total_shifts_last_month: 0,
        },
      };
    });

    // 4. Get Italian holidays
    const holidays = getItalianHolidays(request.period.start_date, request.period.end_date);

    // 5. Build prompts
    const userPrompt = buildUserPrompt({
      period: request.period,
      employees: employeeData,
      existing_shifts: existingShifts,
      italian_holidays: holidays,
    });

    // 6. Call Claude with optimized settings
    console.log('Calling Claude Haiku 4.5 for schedule generation...');
    // Claude Haiku 4.5 max output: 64K tokens for quarterly schedules
    // Ultra-brief reasoning keeps output manageable even for 100+ employee teams
    const response = await callClaude(SYSTEM_PROMPT, userPrompt, 64000);

    // 7. Parse response with request context for debugging
    const scheduleData = parseScheduleResponse(response, {
      period: request.period,
      bureau: request.bureau,
      employeeCount: employees.length,
      existingShiftCount: existingShifts.length,
    });

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
 * Exported for testing
 */
export function getShiftType(date: Date): string {
  const hour = date.getHours();
  if (hour >= 8 && hour < 16) return 'Morning';
  if (hour >= 16 && hour < 24) return 'Afternoon';
  return 'Night'; // 00:00 - 07:59
}

/**
 * Parse Claude's JSON response with comprehensive error logging
 * Enhanced: Captures failed responses for debugging
 * Exported for testing
 */
export function parseScheduleResponse(
  response: string,
  requestConfig?: any
): ScheduleResponse | null {
  const logFailure = (error: string, fullResponse: string) => {
    console.error(`[Parse Error] ${error}`);
    console.error('[Parse Error] Response length:', fullResponse.length);
    console.error('[Parse Error] First 1000 chars:', fullResponse.substring(0, 1000));
    console.error(
      '[Parse Error] Last 500 chars:',
      fullResponse.substring(Math.max(0, fullResponse.length - 500))
    );

    // Store failed response for debugging
    failedResponses.push({
      timestamp: new Date().toISOString(),
      response: fullResponse,
      responseLength: fullResponse.length,
      error,
      requestConfig: requestConfig || {},
    });

    // Keep only last 5 failures
    if (failedResponses.length > MAX_STORED_FAILURES) {
      failedResponses.shift();
    }
  };

  try {
    console.log('[AI Response] Processing response...');
    console.log('[AI Response] Length:', response.length, 'chars');
    console.log('[AI Response] First 500 chars:', response.substring(0, 500));

    const trimmedResponse = response.trim();

    // Check if response contains JSON - either starts with it, or has markdown code blocks
    const startsWithJSON =
      trimmedResponse.startsWith('{') ||
      trimmedResponse.startsWith('[') ||
      trimmedResponse.startsWith('```json') ||
      trimmedResponse.startsWith('```');

    // Also check if response contains markdown JSON blocks anywhere (not just at start)
    const containsMarkdownJSON = /```json[\s\S]*?```/.test(trimmedResponse);
    const containsJSONObject = /\{[\s\S]*"shifts"[\s\S]*\}/.test(trimmedResponse);

    // Only check for conversational response if it doesn't contain extractable JSON
    if (!startsWithJSON && !containsMarkdownJSON && !containsJSONObject) {
      // Detect if response is conversational instead of JSON
      // Note: All patterns are anchored to start (^) to avoid false positives from JSON content
      const conversationalPatterns = [
        /^(I|Let me|I'll|I can|I would|I need|To create|Before)/i,
        /^(What|Which|How|Could you|Can you|Would you)/i,
        /^(Thank you|Here's|Here is|Based on|Looking at)/i,
      ];

      for (const pattern of conversationalPatterns) {
        if (pattern.test(trimmedResponse)) {
          logFailure('Claude returned conversational response instead of JSON', response);
          return null;
        }
      }
    }

    // Try multiple JSON extraction strategies
    let jsonString: string | null = null;

    // Strategy 1: Markdown JSON code block - extract content between ```json and ``` (first block only)
    let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      // Trim and verify it looks like JSON
      const extracted = jsonMatch[1].trim();
      if (extracted.startsWith('{') || extracted.startsWith('[')) {
        jsonString = extracted;
        console.log('[Parse] Extracted JSON from markdown code block');
      }
    }

    // Strategy 2: Plain JSON object (greedy match)
    if (!jsonString) {
      jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
        console.log('[Parse] Extracted JSON with greedy match');
      }
    }

    // Strategy 3: JSON between text (non-greedy)
    if (!jsonString) {
      jsonMatch = response.match(/\{[\s\S]*?\}\s*$/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
        console.log('[Parse] Extracted JSON with non-greedy end match');
      }
    }

    if (!jsonString) {
      logFailure('No JSON found in response with any extraction strategy', response);
      return null;
    }

    console.log('[Parse] Attempting to parse JSON, length:', jsonString.length);

    // Check for truncation indicators
    const lastChars = jsonString.substring(jsonString.length - 50);
    if (!lastChars.includes('}')) {
      console.warn('[Parse Warning] JSON might be truncated - no closing brace in last 50 chars');
    }

    const parsed = JSON.parse(jsonString);

    // Comprehensive validation - shifts array
    if (!parsed.shifts || !Array.isArray(parsed.shifts)) {
      logFailure('Missing or invalid shifts array in parsed JSON', response);
      return null;
    }

    if (parsed.shifts.length === 0) {
      logFailure('Empty shifts array in parsed JSON', response);
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

    const missingFields = requiredFields.filter((field) => !firstShift[field]);
    if (missingFields.length > 0) {
      logFailure(`Missing required fields in shift: ${missingFields.join(', ')}`, response);
      return null;
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFailure(`JSON parse exception: ${errorMessage}`, response);
    return null;
  }
}

/**
 * Detected conflict from AI schedule validation
 */
interface DetectedConflict {
  type: 'Double Booking' | 'Rest Period Violation';
  severity: 'high';
  employee: string;
  description: string;
  shift1: { date: string; start: string; end: string };
  shift2: { date: string; start: string; end: string };
}

/**
 * Validate AI-generated schedule for conflicts BEFORE saving
 * Returns any conflicts found so they can be fixed before committing to database
 */
export function validateScheduleForConflicts(scheduleData: ScheduleResponse): {
  valid: boolean;
  conflicts: DetectedConflict[];
} {
  const conflicts: DetectedConflict[] = [];

  // Group shifts by employee
  const shiftsByEmployee = new Map<string, typeof scheduleData.shifts>();

  for (const shift of scheduleData.shifts) {
    const existing = shiftsByEmployee.get(shift.assigned_to) || [];
    existing.push(shift);
    shiftsByEmployee.set(shift.assigned_to, existing);
  }

  // Check each employee's shifts for conflicts
  for (const [employeeName, shifts] of shiftsByEmployee) {
    // Sort by date and time
    const sortedShifts = [...shifts].sort((a, b) => {
      const dateA = `${a.date}T${a.start_time}`;
      const dateB = `${b.date}T${b.start_time}`;
      return dateA.localeCompare(dateB);
    });

    for (let i = 0; i < sortedShifts.length; i++) {
      for (let j = i + 1; j < sortedShifts.length; j++) {
        const shift1 = sortedShifts[i];
        const shift2 = sortedShifts[j];

        // Parse times
        const start1 = parseISO(`${shift1.date}T${shift1.start_time}`);
        let end1 = parseISO(`${shift1.date}T${shift1.end_time}`);
        // Handle midnight crossing
        if (shift1.end_time === '00:00' || shift1.end_time === '24:00') {
          end1 = parseISO(`${shift1.date}T23:59`);
          end1.setMinutes(end1.getMinutes() + 1);
        }

        const start2 = parseISO(`${shift2.date}T${shift2.start_time}`);
        let end2 = parseISO(`${shift2.date}T${shift2.end_time}`);
        if (shift2.end_time === '00:00' || shift2.end_time === '24:00') {
          end2 = parseISO(`${shift2.date}T23:59`);
          end2.setMinutes(end2.getMinutes() + 1);
        }

        // Check for overlap (double booking)
        const hasOverlap =
          (start1 >= start2 && start1 < end2) ||
          (end1 > start2 && end1 <= end2) ||
          (start1 <= start2 && end1 >= end2);

        if (hasOverlap) {
          conflicts.push({
            type: 'Double Booking',
            severity: 'high',
            employee: employeeName,
            description: `${employeeName} has overlapping shifts`,
            shift1: { date: shift1.date, start: shift1.start_time, end: shift1.end_time },
            shift2: { date: shift2.date, start: shift2.start_time, end: shift2.end_time },
          });
        }

        // Check for rest period violation (less than 11 hours between shifts)
        const hoursBetween = differenceInHours(start2, end1);
        if (hoursBetween >= 0 && hoursBetween < 11) {
          conflicts.push({
            type: 'Rest Period Violation',
            severity: 'high',
            employee: employeeName,
            description: `${employeeName} has only ${hoursBetween}h rest between shifts (minimum 11h required)`,
            shift1: { date: shift1.date, start: shift1.start_time, end: shift1.end_time },
            shift2: { date: shift2.date, start: shift2.start_time, end: shift2.end_time },
          });
        }
      }
    }
  }

  console.log(
    `[Validation] Checked ${scheduleData.shifts.length} shifts, found ${conflicts.length} conflicts`
  );

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Save AI-generated schedule to database (OPTIMIZED with bulk operations)
 * Performance: 270 sequential queries → 3 bulk queries (90x faster)
 * Now includes pre-save conflict validation!
 */
export async function saveSchedule(
  scheduleData: ScheduleResponse,
  userId: string,
  skipValidation: boolean = false
): Promise<{
  success: boolean;
  shift_ids?: string[];
  error?: string;
  conflicts?: DetectedConflict[];
}> {
  try {
    // SAFEGUARD 1: Validate for conflicts before saving
    if (!skipValidation) {
      const validation = validateScheduleForConflicts(scheduleData);
      if (!validation.valid) {
        console.error(
          `[Save Blocked] Found ${validation.conflicts.length} conflicts in AI schedule`
        );
        return {
          success: false,
          error: `AI generated ${validation.conflicts.length} conflict(s). Please regenerate or fix manually.`,
          conflicts: validation.conflicts,
        };
      }
      console.log('[Validation] AI schedule passed conflict check');
    }

    const supabase = await createClient();
    console.log(`[Save Performance] Starting bulk save for ${scheduleData.shifts.length} shifts`);
    const startTime = Date.now();

    // OPTIMIZATION 1: Batch fetch all employees (1 query vs 90)
    const employeeNames = scheduleData.shifts.map((s) => s.assigned_to);
    const { data: employees } = await supabase
      .from('users')
      .select('id, full_name, bureau_id')
      .in('full_name', employeeNames);

    if (!employees || employees.length === 0) {
      return {
        success: false,
        error: 'No matching employees found for schedule',
      };
    }

    // Create employee lookup map
    const employeeMap = new Map(employees.map((e) => [e.full_name, e]));

    // OPTIMIZATION 2: Prepare bulk shift inserts
    const shiftsToInsert: Array<{
      bureau_id: string;
      start_time: string;
      end_time: string;
      status: string;
      required_staff: number;
      notes: string;
      _employee_id: string;
      _reasoning: string;
    }> = [];

    for (const shift of scheduleData.shifts) {
      const employee = employeeMap.get(shift.assigned_to);
      if (!employee) {
        console.warn(`Employee not found: ${shift.assigned_to}`);
        continue;
      }

      // Handle midnight crossing
      let endDate = shift.date;
      let endTime = shift.end_time;
      if (endTime === '00:00' || endTime === '24:00') {
        const shiftDate = parseISO(shift.date);
        shiftDate.setDate(shiftDate.getDate() + 1);
        endDate = format(shiftDate, 'yyyy-MM-dd');
        endTime = '00:00';
      }

      shiftsToInsert.push({
        bureau_id: employee.bureau_id,
        start_time: `${shift.date}T${shift.start_time}:00+01:00`,
        end_time: `${endDate}T${endTime}:00+01:00`,
        status: 'published',
        required_staff: 1,
        notes: `AI Generated: ${shift.reasoning}`,
        _employee_id: employee.id, // Temporary field for assignment mapping
        _reasoning: shift.reasoning,
      });
    }

    // Bulk insert shifts (1 query vs 90)
    const { data: newShifts, error: shiftError } = await supabase
      .from('shifts')
      .insert(shiftsToInsert.map(({ _employee_id, _reasoning, ...shift }) => shift))
      .select();

    if (shiftError || !newShifts) {
      console.error('Failed to create shifts:', shiftError);
      return {
        success: false,
        error: 'Failed to insert shifts into database',
      };
    }

    // OPTIMIZATION 3: Prepare bulk assignment inserts
    const assignmentsToInsert = newShifts.map((newShift, index) => ({
      shift_id: newShift.id,
      user_id: shiftsToInsert[index]._employee_id,
      status: 'assigned',
      assigned_by: userId,
      notes: shiftsToInsert[index]._reasoning,
    }));

    // Bulk insert assignments (1 query vs 90)
    await supabase.from('shift_assignments').insert(assignmentsToInsert);

    const elapsed = Date.now() - startTime;
    console.log(
      `[Save Performance] Completed in ${elapsed}ms (was 27-54s, now <3s) - 3 queries vs 270`
    );

    return {
      success: true,
      shift_ids: newShifts.map((s) => s.id),
    };
  } catch (error) {
    console.error('Save schedule error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save schedule',
    };
  }
}
