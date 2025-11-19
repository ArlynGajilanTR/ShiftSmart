/**
 * Claude Contract Tests - Live AI Testing
 * Verify Claude returns expected JSON structure with real API
 *
 * NOTE: These tests require ANTHROPIC_TEST_API_KEY to be set
 * and ENABLE_LIVE_AI_TESTS=true in test environment
 */

import { callClaude, MODEL } from '@/lib/ai/client';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompts/schedule-generation';
import { parseScheduleResponse } from '@/lib/ai/scheduler-agent';
import { testConfig, validateLiveTestConfig } from '../../helpers/test-config';

// Skip these tests unless live AI testing is enabled
const describeIfLive = testConfig.enableLiveAiTests ? describe : describe.skip;

describeIfLive('Claude Contract Tests - Live AI', () => {
  beforeAll(() => {
    validateLiveTestConfig();

    // Use test API key
    process.env.ANTHROPIC_API_KEY = testConfig.anthropicTestApiKey;
  });

  afterAll(() => {
    // Reset API key
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('JSON Structure Validation', () => {
    it('should return valid JSON for minimal week schedule', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Test Employee',
            email: 'test@example.com',
            title: 'Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 0,
              night_shifts_last_month: 0,
              total_shifts_last_month: 0,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);

      // Should parse successfully
      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();
      expect(parsed!.shifts).toBeDefined();
      expect(Array.isArray(parsed!.shifts)).toBe(true);
    });

    it('should include all required fields in shifts', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-03',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Marco Rossi',
            email: 'marco@example.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Monday', 'Tuesday'],
              preferred_shifts: ['Morning'],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 2,
              night_shifts_last_month: 1,
              total_shifts_last_month: 18,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();

      // Check first shift has all required fields
      if (parsed!.shifts.length > 0) {
        const firstShift = parsed!.shifts[0];
        expect(firstShift.date).toBeDefined();
        expect(firstShift.start_time).toBeDefined();
        expect(firstShift.end_time).toBeDefined();
        expect(firstShift.bureau).toBeDefined();
        expect(firstShift.assigned_to).toBeDefined();
        expect(firstShift.shift_type).toBeDefined();
        expect(firstShift.reasoning).toBeDefined();
      }
    });

    it('should include fairness_metrics in response', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@example.com`,
            title: 'Editor',
            shift_role: i < 2 ? 'senior' : 'mid',
            bureau: i % 2 === 0 ? 'Milan' : 'Rome',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: i,
              night_shifts_last_month: 0,
              total_shifts_last_month: 15 + i,
            },
          })),
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();
      expect(parsed!.fairness_metrics).toBeDefined();
      expect(parsed!.fairness_metrics.total_shifts_per_person).toBeDefined();
      expect(parsed!.fairness_metrics.preference_satisfaction_rate).toBeGreaterThanOrEqual(0);
      expect(parsed!.fairness_metrics.preference_satisfaction_rate).toBeLessThanOrEqual(1);
    });

    it('should provide recommendations', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Overworked Employee',
            email: 'overworked@example.com',
            title: 'Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 3,
              notes: 'Prefers fewer shifts',
            },
            recent_history: {
              weekend_shifts_last_month: 8,
              night_shifts_last_month: 5,
              total_shifts_last_month: 25,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();
      expect(parsed!.recommendations).toBeDefined();
      expect(Array.isArray(parsed!.recommendations)).toBe(true);

      // Should provide recommendations for overworked employee
      if (parsed!.recommendations.length > 0) {
        const recommendations = parsed!.recommendations.join(' ');
        expect(recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Token Usage and Response Times', () => {
    it('should stay within token limits for week schedule', async () => {
      const startTime = Date.now();

      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@example.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 2,
              night_shifts_last_month: 1,
              total_shifts_last_month: 20,
            },
          })),
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const elapsed = Date.now() - startTime;

      expect(response.length).toBeLessThan(10000); // Response should be reasonably sized
      expect(elapsed).toBeLessThan(30000); // Should respond within 30 seconds

      console.log(
        `[Live Test] Week schedule generated in ${elapsed}ms, response size: ${response.length} chars`
      );
    });

    it('should handle month schedule within limits', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-30',
          type: 'month',
        },
        employees: Array(15)
          .fill(null)
          .map((_, i) => ({
            id: `${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@example.com`,
            title: i < 5 ? 'Senior Editor' : 'Editor',
            shift_role: i < 5 ? 'senior' : 'mid',
            bureau: i < 8 ? 'Milan' : 'Rome',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 4,
              night_shifts_last_month: 2,
              total_shifts_last_month: 22,
            },
          })),
        existing_shifts: [],
        italian_holidays: ['2025-11-01'],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();
      expect(parsed!.shifts.length).toBeGreaterThan(20); // Should generate many shifts for a month
      expect(parsed!.shifts.length).toBeLessThan(200); // But not too many
    });
  });

  describe('Prompt Variations', () => {
    it('should handle minimal employees', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-03',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Solo Employee',
            email: 'solo@example.com',
            title: 'Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 7,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 0,
              night_shifts_last_month: 0,
              total_shifts_last_month: 0,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();

      // Should handle constraint that one person can't cover all shifts
      if (parsed!.fairness_metrics.hard_constraint_violations.length > 0) {
        expect(parsed!.fairness_metrics.hard_constraint_violations[0]).toContain('coverage');
      }
    });

    it('should respect Italian holidays', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          type: 'week',
        },
        employees: Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `${i}`,
            full_name: `Employee ${i}`,
            email: `emp${i}@example.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
            },
            recent_history: {
              weekend_shifts_last_month: 2,
              night_shifts_last_month: 1,
              total_shifts_last_month: 20,
            },
          })),
        existing_shifts: [],
        italian_holidays: ['2025-12-25', '2025-12-26'], // Christmas holidays
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();

      // Check if holidays are mentioned in recommendations or handled specially
      const hasHolidayConsideration =
        parsed!.recommendations.some((r) => r.toLowerCase().includes('holiday')) ||
        parsed!.recommendations.some((r) => r.toLowerCase().includes('christmas')) ||
        parsed!.shifts.some((s) => s.reasoning.toLowerCase().includes('holiday'));

      expect(hasHolidayConsideration).toBe(true);
    });

    it('should handle complex preferences', async () => {
      const userPrompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Morning Person',
            email: 'morning@example.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Monday', 'Tuesday', 'Wednesday'],
              preferred_shifts: ['Morning'],
              unavailable_days: ['Saturday', 'Sunday'],
              max_shifts_per_week: 3,
              notes: 'Strongly prefers morning shifts only',
            },
            recent_history: {
              weekend_shifts_last_month: 0,
              night_shifts_last_month: 0,
              total_shifts_last_month: 12,
            },
          },
          {
            id: '2',
            full_name: 'Night Owl',
            email: 'night@example.com',
            title: 'Editor',
            shift_role: 'mid',
            bureau: 'Milan',
            preferences: {
              preferred_days: [],
              preferred_shifts: ['Night', 'Afternoon'],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: 'Available for night shifts',
            },
            recent_history: {
              weekend_shifts_last_month: 4,
              night_shifts_last_month: 8,
              total_shifts_last_month: 20,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      const response = await callClaude(SYSTEM_PROMPT, userPrompt, testConfig.maxTestTokens);

      const parsed = parseScheduleResponse(response);
      expect(parsed).not.toBeNull();

      // Check preference satisfaction
      expect(parsed!.fairness_metrics.preference_satisfaction_rate).toBeGreaterThan(0.5);

      // Verify morning person gets morning shifts
      const morningPersonShifts = parsed!.shifts.filter((s) => s.assigned_to === 'Morning Person');
      const morningShifts = morningPersonShifts.filter((s) => s.shift_type === 'Morning');
      expect(morningShifts.length).toBeGreaterThan(0);
    });
  });
});
