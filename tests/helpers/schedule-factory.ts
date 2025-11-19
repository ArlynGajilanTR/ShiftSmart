/**
 * Schedule Factory - Generate test schedules programmatically
 * Used for creating consistent test data across all test suites
 */

import { format, addDays } from 'date-fns';

export interface TestShift {
  date: string;
  start_time: string;
  end_time: string;
  bureau: 'Milan' | 'Rome';
  assigned_to: string;
  role_level: string;
  shift_type: string;
  reasoning: string;
}

export interface TestSchedule {
  shifts: TestShift[];
  fairness_metrics: {
    weekend_shifts_per_person: Record<string, number>;
    night_shifts_per_person: Record<string, number>;
    total_shifts_per_person: Record<string, number>;
    preference_satisfaction_rate: number;
    hard_constraint_violations: string[];
  };
  recommendations: string[];
}

export interface ScheduleOptions {
  shifts?: number;
  startDate?: string;
  bureau?: 'Milan' | 'Rome' | 'both';
  employees?: string[];
  includeWeekends?: boolean;
  includeNights?: boolean;
}

const DEFAULT_EMPLOYEES = [
  'Marco Rossi',
  'Sara Romano',
  'Luca Bianchi',
  'Anna Conti',
  'Giovanni Ferrari',
];

const SHIFT_TYPES = {
  morning: { start: '08:00', end: '16:00' },
  afternoon: { start: '16:00', end: '00:00' },
  night: { start: '00:00', end: '08:00' },
};

/**
 * Create a valid test schedule
 */
export function createValidSchedule(options: ScheduleOptions = {}): TestSchedule {
  const {
    shifts = 20,
    startDate = format(new Date(), 'yyyy-MM-dd'),
    bureau = 'Milan',
    employees = DEFAULT_EMPLOYEES,
    includeWeekends = true,
    includeNights = true,
  } = options;

  const generatedShifts: TestShift[] = [];
  const shiftCounts: Record<string, number> = {};
  const weekendCounts: Record<string, number> = {};
  const nightCounts: Record<string, number> = {};

  // Initialize counters
  employees.forEach((emp) => {
    shiftCounts[emp] = 0;
    weekendCounts[emp] = 0;
    nightCounts[emp] = 0;
  });

  let currentDate = new Date(startDate);
  let shiftIndex = 0;

  while (generatedShifts.length < shifts) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Skip weekends if not included
    if (!includeWeekends && isWeekend) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Generate shifts for the day
    const shiftsForDay = includeNights
      ? ['morning', 'afternoon', 'night']
      : ['morning', 'afternoon'];

    for (const shiftType of shiftsForDay) {
      if (generatedShifts.length >= shifts) break;

      const employee = employees[shiftIndex % employees.length];
      const shiftBureau = bureau === 'both' ? (shiftIndex % 2 === 0 ? 'Milan' : 'Rome') : bureau;

      const shift: TestShift = {
        date: format(currentDate, 'yyyy-MM-dd'),
        start_time: SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES].start,
        end_time: SHIFT_TYPES[shiftType as keyof typeof SHIFT_TYPES].end,
        bureau: shiftBureau,
        assigned_to: employee,
        role_level: 'senior',
        shift_type: shiftType.charAt(0).toUpperCase() + shiftType.slice(1),
        reasoning: `Fair rotation - ${employee} turn`,
      };

      generatedShifts.push(shift);
      shiftCounts[employee]++;

      if (isWeekend) {
        weekendCounts[employee]++;
      }

      if (shiftType === 'night') {
        nightCounts[employee]++;
      }

      shiftIndex++;
    }

    currentDate = addDays(currentDate, 1);
  }

  return {
    shifts: generatedShifts,
    fairness_metrics: {
      weekend_shifts_per_person: weekendCounts,
      night_shifts_per_person: nightCounts,
      total_shifts_per_person: shiftCounts,
      preference_satisfaction_rate: 0.85,
      hard_constraint_violations: [],
    },
    recommendations: ['Schedule is well-balanced', 'Consider employee preferences for next period'],
  };
}

/**
 * Create an invalid schedule with missing fields
 */
export function createInvalidSchedule(options: { missingFields?: string[] } = {}): any {
  const validSchedule = createValidSchedule({ shifts: 5 });
  const { missingFields = ['date'] } = options;

  // Remove specified fields from first shift
  if (validSchedule.shifts.length > 0) {
    missingFields.forEach((field) => {
      delete (validSchedule.shifts[0] as any)[field];
    });
  }

  return validSchedule;
}

/**
 * Create a truncated schedule response
 */
export function createTruncatedSchedule(options: { chars?: number } = {}): string {
  const { chars = 8000 } = options;
  const validSchedule = createValidSchedule({ shifts: 100 }); // Create large schedule
  const fullJson = JSON.stringify(validSchedule, null, 2);

  // Truncate at specified character count
  return fullJson.substring(0, chars);
}

/**
 * Create a conversational response instead of JSON
 */
export function createConversationalResponse(): string {
  return `I'll help you create a schedule for the Breaking News team.

  To generate an optimal schedule, I need to clarify a few things:
  - Which bureau should I focus on, Milan or Rome?
  - Are there any specific employee preferences I should consider?
  - Should I include night shifts in the rotation?

  Once you provide this information, I can create a balanced schedule that ensures fair distribution of shifts.`;
}

/**
 * Create a markdown-wrapped JSON response
 */
export function createMarkdownWrappedSchedule(): string {
  const schedule = createValidSchedule({ shifts: 5 });
  return `Here's the generated schedule:

\`\`\`json
${JSON.stringify(schedule, null, 2)}
\`\`\`

The schedule includes fair rotation and considers employee preferences.`;
}

/**
 * Create schedule with specific fairness violations
 */
export function createUnfairSchedule(): TestSchedule {
  const schedule = createValidSchedule({ shifts: 20 });

  // Make it unfair - assign most shifts to one person
  schedule.shifts.forEach((shift, index) => {
    if (index < 15) {
      shift.assigned_to = 'Marco Rossi';
    }
  });

  // Update metrics to reflect unfairness
  schedule.fairness_metrics.total_shifts_per_person = {
    'Marco Rossi': 15,
    'Sara Romano': 2,
    'Luca Bianchi': 2,
    'Anna Conti': 1,
    'Giovanni Ferrari': 0,
  };

  schedule.fairness_metrics.hard_constraint_violations = [
    'Marco Rossi assigned 15 shifts (75% of total)',
    'Giovanni Ferrari has no shifts assigned',
  ];

  schedule.fairness_metrics.preference_satisfaction_rate = 0.3;

  return schedule;
}

/**
 * Create schedule with empty shifts array
 */
export function createEmptySchedule(): TestSchedule {
  return {
    shifts: [],
    fairness_metrics: {
      weekend_shifts_per_person: {},
      night_shifts_per_person: {},
      total_shifts_per_person: {},
      preference_satisfaction_rate: 0,
      hard_constraint_violations: ['No shifts generated'],
    },
    recommendations: ['No employees available for scheduling'],
  };
}

/**
 * Create schedule with only fairness metrics (missing shifts)
 */
export function createScheduleWithoutShifts(): any {
  return {
    fairness_metrics: {
      weekend_shifts_per_person: {},
      night_shifts_per_person: {},
      total_shifts_per_person: {},
      preference_satisfaction_rate: 0,
      hard_constraint_violations: [],
    },
    recommendations: [],
  };
}

/**
 * Create schedule with invalid date formats
 */
export function createScheduleWithBadDates(): TestSchedule {
  const schedule = createValidSchedule({ shifts: 3 });

  // Corrupt date formats
  schedule.shifts[0].date = '15-11-2025'; // Wrong format
  schedule.shifts[1].start_time = '8:00 AM'; // 12-hour format
  schedule.shifts[2].end_time = 'invalid-time';

  return schedule;
}
