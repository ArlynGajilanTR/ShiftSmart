/**
 * Schedule Validator Tests
 * Validate shift constraints, fairness metrics, date/time formats, and bureau assignments
 */

import { isWeekend, parseISO, format } from 'date-fns';
import {
  createValidSchedule,
  createUnfairSchedule,
  createScheduleWithBadDates,
} from '../../../helpers/schedule-factory';

// Validation functions (these would be in the actual validator module)
const validateShiftConstraints = (shifts: any[]): string[] => {
  const violations: string[] = [];

  // Check for double bookings
  const shiftsByEmployee = new Map<string, any[]>();
  shifts.forEach((shift) => {
    const existing = shiftsByEmployee.get(shift.assigned_to) || [];
    shiftsByEmployee.set(shift.assigned_to, [...existing, shift]);
  });

  shiftsByEmployee.forEach((employeeShifts, employee) => {
    for (let i = 0; i < employeeShifts.length; i++) {
      for (let j = i + 1; j < employeeShifts.length; j++) {
        const shift1 = employeeShifts[i];
        const shift2 = employeeShifts[j];

        if (shift1.date === shift2.date) {
          const start1 = parseInt(shift1.start_time.replace(':', ''));
          const end1 = parseInt(shift1.end_time.replace(':', ''));
          const start2 = parseInt(shift2.start_time.replace(':', ''));
          const end2 = parseInt(shift2.end_time.replace(':', ''));

          if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
            violations.push(`${employee} has overlapping shifts on ${shift1.date}`);
          }
        }
      }
    }
  });

  // Check shift duration (max 8 hours)
  shifts.forEach((shift) => {
    const start = parseInt(shift.start_time.replace(':', ''));
    const end = shift.end_time === '00:00' ? 2400 : parseInt(shift.end_time.replace(':', ''));
    const duration = end - start;

    if (duration > 800) {
      // 8 hours
      violations.push(`Shift exceeds 8 hours: ${shift.assigned_to} on ${shift.date}`);
    }
  });

  return violations;
};

const validateFairnessMetrics = (metrics: any): string[] => {
  const issues: string[] = [];

  if (!metrics) {
    issues.push('Missing fairness metrics');
    return issues;
  }

  // Check preference satisfaction rate
  if (metrics.preference_satisfaction_rate < 0 || metrics.preference_satisfaction_rate > 1) {
    issues.push(`Invalid preference satisfaction rate: ${metrics.preference_satisfaction_rate}`);
  }

  // Check for unfair distribution
  const shifts = Object.values(metrics.total_shifts_per_person || {}) as number[];
  if (shifts.length > 0) {
    const avg = shifts.reduce((a, b) => a + b, 0) / shifts.length;
    const maxDeviation = Math.max(...shifts.map((s) => Math.abs(s - avg)));

    if (maxDeviation > avg * 0.5 && avg > 0) {
      issues.push(
        `Unfair shift distribution detected (max deviation: ${maxDeviation.toFixed(1)} from average ${avg.toFixed(1)})`
      );
    }
  }

  // Check weekend fairness
  const weekendShifts = Object.values(metrics.weekend_shifts_per_person || {}) as number[];
  if (weekendShifts.length > 0) {
    const maxWeekend = Math.max(...weekendShifts);
    const minWeekend = Math.min(...weekendShifts);

    if (maxWeekend - minWeekend > 2) {
      issues.push(`Unfair weekend distribution (range: ${minWeekend}-${maxWeekend})`);
    }
  }

  return issues;
};

const validateDateTimeFormats = (shifts: any[]): string[] => {
  const errors: string[] = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  shifts.forEach((shift, index) => {
    // Validate date format
    if (!dateRegex.test(shift.date)) {
      errors.push(`Invalid date format at shift ${index}: ${shift.date}`);
    } else {
      // Check if date is valid
      try {
        const parsed = parseISO(shift.date);
        if (isNaN(parsed.getTime())) {
          errors.push(`Invalid date at shift ${index}: ${shift.date}`);
        }
      } catch {
        errors.push(`Cannot parse date at shift ${index}: ${shift.date}`);
      }
    }

    // Validate time formats
    if (!timeRegex.test(shift.start_time)) {
      errors.push(`Invalid start_time format at shift ${index}: ${shift.start_time}`);
    }
    if (!timeRegex.test(shift.end_time)) {
      errors.push(`Invalid end_time format at shift ${index}: ${shift.end_time}`);
    }

    // Validate time values
    const startHour = parseInt(shift.start_time.split(':')[0]);
    const startMin = parseInt(shift.start_time.split(':')[1]);
    const endHour = parseInt(shift.end_time.split(':')[0]);
    const endMin = parseInt(shift.end_time.split(':')[1]);

    if (startHour > 23 || startMin > 59) {
      errors.push(`Invalid start_time value at shift ${index}: ${shift.start_time}`);
    }
    if (endHour > 23 || endMin > 59) {
      errors.push(`Invalid end_time value at shift ${index}: ${shift.end_time}`);
    }
  });

  return errors;
};

const validateBureauAssignments = (shifts: any[]): string[] => {
  const errors: string[] = [];
  const validBureaus = ['Milan', 'Rome'];

  shifts.forEach((shift, index) => {
    if (!validBureaus.includes(shift.bureau)) {
      errors.push(`Invalid bureau at shift ${index}: ${shift.bureau}`);
    }
  });

  // Check bureau coverage
  const bureauCoverage = new Map<string, Set<string>>();
  shifts.forEach((shift) => {
    const dates = bureauCoverage.get(shift.bureau) || new Set();
    dates.add(shift.date);
    bureauCoverage.set(shift.bureau, dates);
  });

  // Check if both bureaus have coverage (if multiple dates)
  const allDates = new Set(shifts.map((s) => s.date));
  if (allDates.size > 1) {
    validBureaus.forEach((bureau) => {
      const covered = bureauCoverage.get(bureau)?.size || 0;
      if (covered === 0) {
        errors.push(`No coverage for ${bureau} bureau`);
      }
    });
  }

  return errors;
};

describe('Schedule Validator', () => {
  describe('Shift Constraints Validation', () => {
    it('should detect overlapping shifts for same employee', () => {
      const shifts = [
        {
          date: '2025-11-01',
          start_time: '08:00',
          end_time: '16:00',
          assigned_to: 'Marco Rossi',
        },
        {
          date: '2025-11-01',
          start_time: '14:00', // Overlaps with previous
          end_time: '22:00',
          assigned_to: 'Marco Rossi',
        },
      ];

      const violations = validateShiftConstraints(shifts);
      expect(violations).toContain('Marco Rossi has overlapping shifts on 2025-11-01');
    });

    it('should allow back-to-back shifts', () => {
      const shifts = [
        {
          date: '2025-11-01',
          start_time: '08:00',
          end_time: '16:00',
          assigned_to: 'Marco Rossi',
        },
        {
          date: '2025-11-01',
          start_time: '16:00', // Starts when previous ends
          end_time: '00:00',
          assigned_to: 'Marco Rossi',
        },
      ];

      const violations = validateShiftConstraints(shifts);
      expect(violations).toHaveLength(1); // Only the >8 hour violation
    });

    it('should detect shifts exceeding 8 hours', () => {
      const shifts = [
        {
          date: '2025-11-01',
          start_time: '08:00',
          end_time: '18:00', // 10 hours
          assigned_to: 'Test User',
        },
      ];

      const violations = validateShiftConstraints(shifts);
      expect(violations).toContain('Shift exceeds 8 hours: Test User on 2025-11-01');
    });

    it('should handle midnight-crossing shifts correctly', () => {
      const shifts = [
        {
          date: '2025-11-01',
          start_time: '22:00',
          end_time: '06:00', // Next day
          assigned_to: 'Night Worker',
        },
      ];

      // This is a complex case - for now we're treating 00:00 as 24:00
      const violations = validateShiftConstraints(shifts);
      expect(violations).toHaveLength(0); // Should handle gracefully
    });
  });

  describe('Fairness Metrics Validation', () => {
    it('should validate preference satisfaction rate range', () => {
      const invalidMetrics = [
        { preference_satisfaction_rate: -0.1 },
        { preference_satisfaction_rate: 1.5 },
        { preference_satisfaction_rate: 2 },
      ];

      invalidMetrics.forEach((metrics) => {
        const issues = validateFairnessMetrics(metrics);
        expect(issues).toContain(expect.stringContaining('Invalid preference satisfaction rate'));
      });
    });

    it('should detect unfair shift distribution', () => {
      const unfairMetrics = {
        total_shifts_per_person: {
          'Employee A': 20,
          'Employee B': 5,
          'Employee C': 6,
          'Employee D': 4,
        },
        weekend_shifts_per_person: {},
        night_shifts_per_person: {},
        preference_satisfaction_rate: 0.3,
        hard_constraint_violations: [],
      };

      const issues = validateFairnessMetrics(unfairMetrics);
      expect(issues).toContain(expect.stringContaining('Unfair shift distribution detected'));
    });

    it('should detect unfair weekend distribution', () => {
      const metrics = {
        total_shifts_per_person: {},
        weekend_shifts_per_person: {
          'Employee A': 5,
          'Employee B': 1,
          'Employee C': 2,
        },
        night_shifts_per_person: {},
        preference_satisfaction_rate: 0.7,
        hard_constraint_violations: [],
      };

      const issues = validateFairnessMetrics(metrics);
      expect(issues).toContain(expect.stringContaining('Unfair weekend distribution'));
    });

    it('should accept fair metrics', () => {
      const fairMetrics = {
        total_shifts_per_person: {
          'Employee A': 10,
          'Employee B': 9,
          'Employee C': 10,
          'Employee D': 11,
        },
        weekend_shifts_per_person: {
          'Employee A': 2,
          'Employee B': 2,
          'Employee C': 1,
          'Employee D': 2,
        },
        night_shifts_per_person: {},
        preference_satisfaction_rate: 0.85,
        hard_constraint_violations: [],
      };

      const issues = validateFairnessMetrics(fairMetrics);
      expect(issues).toHaveLength(0);
    });
  });

  describe('Date/Time Format Validation', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        '2025-01-01',
        '2025-12-31',
        '2025-02-28',
        '2024-02-29', // Leap year
      ];

      validDates.forEach((date) => {
        const shifts = [{ date, start_time: '08:00', end_time: '16:00' }];
        const errors = validateDateTimeFormats(shifts);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '01-01-2025', // Wrong format
        '2025/01/01', // Wrong separator
        '2025-1-1', // No padding
        '2025-13-01', // Invalid month
        '2025-01-32', // Invalid day
        '2025-02-30', // Invalid day for February
      ];

      invalidDates.forEach((date) => {
        const shifts = [{ date, start_time: '08:00', end_time: '16:00' }];
        const errors = validateDateTimeFormats(shifts);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate correct time formats', () => {
      const validTimes = [
        { start_time: '00:00', end_time: '08:00' },
        { start_time: '08:00', end_time: '16:00' },
        { start_time: '16:00', end_time: '00:00' },
        { start_time: '23:59', end_time: '07:59' },
      ];

      validTimes.forEach((times) => {
        const shifts = [{ date: '2025-11-01', ...times }];
        const errors = validateDateTimeFormats(shifts);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject invalid time formats', () => {
      const invalidTimes = [
        { start_time: '8:00', end_time: '16:00' }, // No padding
        { start_time: '08:00 AM', end_time: '4 PM' }, // 12-hour format
        { start_time: '25:00', end_time: '16:00' }, // Invalid hour
        { start_time: '08:60', end_time: '16:00' }, // Invalid minute
        { start_time: 'morning', end_time: 'evening' }, // Text
      ];

      invalidTimes.forEach((times) => {
        const shifts = [{ date: '2025-11-01', ...times }];
        const errors = validateDateTimeFormats(shifts);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should test schedule with bad dates from factory', () => {
      const schedule = createScheduleWithBadDates();
      const errors = validateDateTimeFormats(schedule.shifts);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Bureau Assignment Validation', () => {
    it('should accept valid bureaus', () => {
      const shifts = [
        { bureau: 'Milan', date: '2025-11-01' },
        { bureau: 'Rome', date: '2025-11-01' },
      ];

      const errors = validateBureauAssignments(shifts);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid bureaus', () => {
      const shifts = [
        { bureau: 'milan', date: '2025-11-01' }, // Lowercase
        { bureau: 'MILAN', date: '2025-11-01' }, // Uppercase
        { bureau: 'Milano', date: '2025-11-01' }, // Italian name
        { bureau: 'Florence', date: '2025-11-01' }, // Different city
        { bureau: '', date: '2025-11-01' }, // Empty
      ];

      shifts.forEach((shift, index) => {
        const errors = validateBureauAssignments([shift]);
        expect(errors).toContain(`Invalid bureau at shift 0: ${shift.bureau}`);
      });
    });

    it('should check bureau coverage across dates', () => {
      const shifts = [
        { bureau: 'Milan', date: '2025-11-01' },
        { bureau: 'Milan', date: '2025-11-02' },
        { bureau: 'Milan', date: '2025-11-03' },
        // Rome has no coverage
      ];

      const errors = validateBureauAssignments(shifts);
      expect(errors).toContain('No coverage for Rome bureau');
    });

    it('should not require both bureaus for single day', () => {
      const shifts = [{ bureau: 'Milan', date: '2025-11-01' }];

      const errors = validateBureauAssignments(shifts);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Complete Schedule Validation', () => {
    it('should validate a complete valid schedule', () => {
      const schedule = createValidSchedule({
        shifts: 20,
        bureau: 'both',
        includeWeekends: true,
      });

      const constraintViolations = validateShiftConstraints(schedule.shifts);
      const fairnessIssues = validateFairnessMetrics(schedule.fairness_metrics);
      const dateTimeErrors = validateDateTimeFormats(schedule.shifts);
      const bureauErrors = validateBureauAssignments(schedule.shifts);

      expect(constraintViolations).toHaveLength(0);
      expect(fairnessIssues).toHaveLength(0);
      expect(dateTimeErrors).toHaveLength(0);
      expect(bureauErrors).toHaveLength(0);
    });

    it('should detect issues in unfair schedule', () => {
      const schedule = createUnfairSchedule();

      const fairnessIssues = validateFairnessMetrics(schedule.fairness_metrics);
      expect(fairnessIssues.length).toBeGreaterThan(0);
      expect(schedule.fairness_metrics.hard_constraint_violations.length).toBeGreaterThan(0);
    });
  });
});
