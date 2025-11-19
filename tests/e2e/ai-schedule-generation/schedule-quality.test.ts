/**
 * Schedule Quality Tests - Live AI Testing
 * Validate generated schedules meet business requirements
 *
 * NOTE: These tests require ANTHROPIC_TEST_API_KEY to be set
 * and ENABLE_LIVE_AI_TESTS=true in test environment
 */

import { generateSchedule } from '@/lib/ai/scheduler-agent';
import { testConfig, validateLiveTestConfig } from '../../helpers/test-config';
import { isWeekend, parseISO } from 'date-fns';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    then: jest.fn(),
  }),
}));

// Skip these tests unless live AI testing is enabled
const describeIfLive = testConfig.enableLiveAiTests ? describe : describe.skip;

describeIfLive('Schedule Quality Tests - Live AI', () => {
  let mockSupabase: any;

  beforeAll(() => {
    validateLiveTestConfig();
    process.env.ANTHROPIC_API_KEY = testConfig.anthropicTestApiKey;
  });

  afterAll(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = createClient();

    // Reset mock
    jest.clearAllMocks();
  });

  describe('Fairness Requirements', () => {
    it('should distribute shifts fairly among employees', async () => {
      // Mock 5 employees
      mockSupabase.then.mockResolvedValue({
        data: Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@reuters.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Check fairness metrics
      const metrics = result.data!.fairness_metrics;
      const shiftCounts = Object.values(metrics.total_shifts_per_person);

      if (shiftCounts.length > 0) {
        const avg = shiftCounts.reduce((a, b) => a + b, 0) / shiftCounts.length;
        const maxDeviation = Math.max(...shiftCounts.map((count) => Math.abs(count - avg)));

        // Deviation should be reasonable (within 50% of average)
        expect(maxDeviation).toBeLessThanOrEqual(avg * 0.5 + 1);
      }
    });

    it('should balance weekend shifts fairly', async () => {
      // Mock employees with weekend availability
      mockSupabase.then.mockResolvedValue({
        data: Array(6)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@reuters.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              unavailable_days: i === 0 ? ['Saturday', 'Sunday'] : [], // First employee unavailable weekends
            },
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-30', // Full month
          type: 'month',
        },
      });

      expect(result.success).toBe(true);

      const weekendMetrics = result.data!.fairness_metrics.weekend_shifts_per_person;

      // Employee 0 should have no weekend shifts
      expect(weekendMetrics['Employee 0'] || 0).toBe(0);

      // Others should share weekend shifts fairly
      const otherWeekendShifts = Object.entries(weekendMetrics)
        .filter(([name]) => name !== 'Employee 0')
        .map(([_, count]) => count);

      if (otherWeekendShifts.length > 0) {
        const maxWeekend = Math.max(...otherWeekendShifts);
        const minWeekend = Math.min(...otherWeekendShifts);

        // Weekend distribution should be relatively fair (max 2 shift difference)
        expect(maxWeekend - minWeekend).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Constraint Satisfaction', () => {
    it('should respect max shifts per week preference', async () => {
      // Mock employees with different max shift preferences
      mockSupabase.then.mockResolvedValue({
        data: [
          {
            id: 'emp-1',
            full_name: 'Part Timer',
            email: 'part@reuters.com',
            title: 'Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              max_shifts_per_week: 3,
              notes: 'Part-time employee',
            },
          },
          {
            id: 'emp-2',
            full_name: 'Full Timer',
            email: 'full@reuters.com',
            title: 'Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              max_shifts_per_week: 5,
            },
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Count shifts per employee
      const partTimerShifts = result.data!.shifts.filter((s) => s.assigned_to === 'Part Timer');
      const fullTimerShifts = result.data!.shifts.filter((s) => s.assigned_to === 'Full Timer');

      // Part timer should not exceed 3 shifts
      expect(partTimerShifts.length).toBeLessThanOrEqual(3);

      // Full timer can have up to 5
      expect(fullTimerShifts.length).toBeLessThanOrEqual(5);
    });

    it('should ensure minimum coverage requirements', async () => {
      // Mock minimal employees
      mockSupabase.then.mockResolvedValue({
        data: [
          {
            id: 'emp-1',
            full_name: 'Senior Editor',
            email: 'senior@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          },
          {
            id: 'emp-2',
            full_name: 'Junior Editor',
            email: 'junior@reuters.com',
            title: 'Editor',
            shift_role: 'junior',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Check each day has coverage
      const dateSet = new Set(result.data!.shifts.map((s) => s.date));

      // Should have at least some coverage (though may not cover all days with only 2 people)
      expect(dateSet.size).toBeGreaterThan(0);

      // Check for constraint violations
      const violations = result.data!.fairness_metrics.hard_constraint_violations;

      // With minimal staff, there should be coverage warnings
      const hasCoverageWarning = violations.some(
        (v) => v.toLowerCase().includes('coverage') || v.toLowerCase().includes('insufficient')
      );

      expect(hasCoverageWarning || dateSet.size >= 5).toBe(true);
    });

    it('should not create overlapping shifts for same employee', async () => {
      mockSupabase.then.mockResolvedValue({
        data: Array(3)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@reuters.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-03', // Just 3 days
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Check for overlapping shifts
      const employeeShifts = new Map<string, any[]>();

      result.data!.shifts.forEach((shift) => {
        const shifts = employeeShifts.get(shift.assigned_to) || [];
        shifts.push(shift);
        employeeShifts.set(shift.assigned_to, shifts);
      });

      // For each employee, check no overlapping shifts
      let hasOverlap = false;
      employeeShifts.forEach((shifts, employee) => {
        for (let i = 0; i < shifts.length; i++) {
          for (let j = i + 1; j < shifts.length; j++) {
            if (shifts[i].date === shifts[j].date) {
              const start1 = parseInt(shifts[i].start_time.replace(':', ''));
              const end1 = parseInt(shifts[i].end_time.replace(':', ''));
              const start2 = parseInt(shifts[j].start_time.replace(':', ''));
              const end2 = parseInt(shifts[j].end_time.replace(':', ''));

              if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
                hasOverlap = true;
                console.error(`Overlap detected for ${employee} on ${shifts[i].date}`);
              }
            }
          }
        }
      });

      expect(hasOverlap).toBe(false);
    });
  });

  describe('Preference Adherence', () => {
    it('should respect preferred shifts when possible', async () => {
      mockSupabase.then.mockResolvedValue({
        data: [
          {
            id: 'emp-1',
            full_name: 'Morning Person',
            email: 'morning@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              preferred_shifts: ['Morning'],
              notes: 'Strongly prefers morning shifts',
            },
          },
          {
            id: 'emp-2',
            full_name: 'Flexible Person',
            email: 'flex@reuters.com',
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Check morning person's shifts
      const morningPersonShifts = result.data!.shifts.filter(
        (s) => s.assigned_to === 'Morning Person'
      );
      const morningShifts = morningPersonShifts.filter((s) => s.shift_type === 'Morning');

      // Should have high percentage of preferred shifts
      if (morningPersonShifts.length > 0) {
        const preferenceRate = morningShifts.length / morningPersonShifts.length;
        expect(preferenceRate).toBeGreaterThan(0.5); // At least 50% should be morning
      }

      // Check overall preference satisfaction
      expect(result.data!.fairness_metrics.preference_satisfaction_rate).toBeGreaterThan(0.5);
    });

    it('should handle conflicting preferences gracefully', async () => {
      // Everyone wants the same shifts
      mockSupabase.then.mockResolvedValue({
        data: Array(4)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@reuters.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              preferred_days: ['Monday', 'Tuesday', 'Wednesday'],
              preferred_shifts: ['Morning'],
              notes: 'Everyone wants the same shifts',
            },
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Should distribute preferred shifts as fairly as possible
      const preferredDays = ['2025-11-03', '2025-11-04', '2025-11-05']; // Mon-Wed
      const preferredShifts = result.data!.shifts.filter(
        (s) => preferredDays.includes(s.date) && s.shift_type === 'Morning'
      );

      // Count how many different employees got preferred shifts
      const employeesWithPreferred = new Set(preferredShifts.map((s) => s.assigned_to));

      // Should distribute among multiple employees, not just one
      expect(employeesWithPreferred.size).toBeGreaterThan(1);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle holiday period scheduling', async () => {
      // Mock employees with holiday preferences
      mockSupabase.then.mockResolvedValue({
        data: [
          {
            id: 'emp-1',
            full_name: 'Holiday Worker',
            email: 'holiday@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              notes: 'Available during holidays',
            },
          },
          {
            id: 'emp-2',
            full_name: 'Regular Worker 1',
            email: 'regular1@reuters.com',
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              unavailable_days: ['2025-12-25', '2025-12-26'],
              notes: 'Off for Christmas',
            },
          },
          {
            id: 'emp-3',
            full_name: 'Regular Worker 2',
            email: 'regular2@reuters.com',
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
            shift_preferences: null,
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Check Christmas shifts
      const christmasShifts = result.data!.shifts.filter(
        (s) => s.date === '2025-12-25' || s.date === '2025-12-26'
      );

      // Regular Worker 1 should not be assigned Christmas shifts
      const regularWorker1Christmas = christmasShifts.filter(
        (s) => s.assigned_to === 'Regular Worker 1'
      );
      expect(regularWorker1Christmas.length).toBe(0);

      // Holiday coverage should be maintained
      expect(christmasShifts.length).toBeGreaterThan(0);
    });

    it('should handle bureau-specific scheduling', async () => {
      // Mock employees from both bureaus
      mockSupabase.then.mockResolvedValue({
        data: [
          // Milan employees
          ...Array(3)
            .fill(null)
            .map((_, i) => ({
              id: `milan-${i}`,
              full_name: `Milan Employee ${i}`,
              email: `milan${i}@reuters.com`,
              title: i === 0 ? 'Senior Editor' : 'Editor',
              shift_role: i === 0 ? 'senior' : 'mid',
              bureaus: { name: 'Milan' },
              shift_preferences: null,
            })),
          // Rome employees
          ...Array(3)
            .fill(null)
            .map((_, i) => ({
              id: `rome-${i}`,
              full_name: `Rome Employee ${i}`,
              email: `rome${i}@reuters.com`,
              title: i === 0 ? 'Senior Editor' : 'Editor',
              shift_role: i === 0 ? 'senior' : 'mid',
              bureaus: { name: 'Rome' },
              shift_preferences: null,
            })),
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        bureau: 'both',
      });

      expect(result.success).toBe(true);

      // Check bureau distribution
      const milanShifts = result.data!.shifts.filter((s) => s.bureau === 'Milan');
      const romeShifts = result.data!.shifts.filter((s) => s.bureau === 'Rome');

      // Both bureaus should have coverage
      expect(milanShifts.length).toBeGreaterThan(0);
      expect(romeShifts.length).toBeGreaterThan(0);

      // Employees should only be assigned to their bureau
      milanShifts.forEach((shift) => {
        expect(shift.assigned_to).toMatch(/Milan Employee/);
      });

      romeShifts.forEach((shift) => {
        expect(shift.assigned_to).toMatch(/Rome Employee/);
      });
    });
  });
});
