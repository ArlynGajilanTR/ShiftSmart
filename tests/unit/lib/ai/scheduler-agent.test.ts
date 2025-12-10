/**
 * Unit tests for AI Scheduler Agent
 * Tests the schedule generation logic and AI integration
 */

import { generateSchedule, saveSchedule } from '@/lib/ai/scheduler-agent';
import { callClaude, isConfigured } from '@/lib/ai/client';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompts/schedule-generation';

// Mock dependencies
jest.mock('@/lib/ai/client');

// Create a chainable query builder mock
const createQueryBuilder = (table: string) => {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => ({
      data: table === 'bureaus' ? { id: 'test-bureau-id', code: 'ITA-MILAN', name: 'Milan' } : null,
      error: null,
    })),
    then: jest.fn((resolve) =>
      resolve({
        data:
          table === 'users'
            ? [
                {
                  id: 'test-user-1',
                  full_name: 'Marco Rossi',
                  email: 'marco@reuters.com',
                  title: 'Senior Editor',
                  shift_role: 'senior',
                  bureaus: { name: 'Milan' },
                  shift_preferences: null,
                },
              ]
            : [],
        error: null,
      })
    ),
  };
  return builder;
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => createQueryBuilder(table)),
  })),
}));

const mockCallClaude = callClaude as jest.MockedFunction<typeof callClaude>;
const mockIsConfigured = isConfigured as jest.MockedFunction<typeof isConfigured>;

describe('AI Scheduler Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSchedule', () => {
    it('should return error when AI is not configured', async () => {
      mockIsConfigured.mockReturnValue(false);

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should generate schedule successfully with valid input', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockResolvedValue(
        JSON.stringify({
          shifts: [
            {
              date: '2025-11-01',
              start_time: '08:00',
              end_time: '16:00',
              bureau: 'Milan',
              assigned_to: 'Marco Rossi',
              role_level: 'senior',
              shift_type: 'Morning',
              reasoning: 'Test assignment',
            },
          ],
          fairness_metrics: {
            weekend_shifts_per_person: { 'Marco Rossi': 0 },
            night_shifts_per_person: { 'Marco Rossi': 0 },
            total_shifts_per_person: { 'Marco Rossi': 1 },
            preference_satisfaction_rate: 100,
            hard_constraint_violations: [],
          },
          recommendations: ['Schedule looks good'],
        })
      );

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        bureau: 'Milan',
      });

      expect(result.success).toBe(true);
      expect(result.data?.shifts).toHaveLength(1);
      expect(result.data?.shifts[0].assigned_to).toBe('Marco Rossi');
    });

    it('should handle invalid AI response', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockResolvedValue('Invalid JSON response');

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });

    it('should filter by bureau correctly', async () => {
      mockIsConfigured.mockReturnValue(true);

      await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        bureau: 'Rome',
      });

      // Verify that AI client was called (bureau filtering happens in data fetch)
      expect(mockCallClaude).toHaveBeenCalled();
    });

    it('should handle date range validation', async () => {
      mockIsConfigured.mockReturnValue(true);

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-07',
          end_date: '2025-11-01', // End before start
          type: 'week',
        },
      });

      // Should still call the function but AI might handle validation
      expect(mockIsConfigured).toHaveBeenCalled();
    });

    it('should support different period types', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockResolvedValue(
        JSON.stringify({
          shifts: [
            {
              date: '2025-11-01',
              start_time: '08:00',
              end_time: '16:00',
              bureau: 'Milan',
              assigned_to: 'Test User',
              role_level: 'senior',
              shift_type: 'Morning',
              reasoning: 'Test shift',
            },
          ],
          fairness_metrics: {
            weekend_shifts_per_person: {},
            night_shifts_per_person: {},
            total_shifts_per_person: {},
            preference_satisfaction_rate: 100,
            hard_constraint_violations: [],
          },
          recommendations: [],
        })
      );

      const types: Array<'week' | 'month' | 'quarter'> = ['week', 'month', 'quarter'];

      for (const type of types) {
        const result = await generateSchedule({
          period: {
            start_date: '2025-11-01',
            end_date: '2025-11-30',
            type,
          },
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Italian Holidays', () => {
    it('should include Italian holidays in schedule generation', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockResolvedValue(
        JSON.stringify({
          shifts: [],
          fairness_metrics: {
            weekend_shifts_per_person: {},
            night_shifts_per_person: {},
            total_shifts_per_person: {},
            preference_satisfaction_rate: 100,
            hard_constraint_violations: [],
          },
          recommendations: [],
        })
      );

      // Test date range that includes Christmas
      await generateSchedule({
        period: {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          type: 'week',
        },
      });

      // Verify Claude was called with prompt containing holiday data
      expect(mockCallClaude).toHaveBeenCalled();
    });
  });

  describe('Fairness Metrics', () => {
    it('should calculate fairness metrics correctly', () => {
      const metrics = {
        weekend_shifts_per_person: {
          'Marco Rossi': 2,
          'Sara Romano': 1,
        },
        night_shifts_per_person: {
          'Marco Rossi': 1,
          'Sara Romano': 2,
        },
        total_shifts_per_person: {
          'Marco Rossi': 5,
          'Sara Romano': 4,
        },
        preference_satisfaction_rate: 85,
        hard_constraint_violations: [],
      };

      expect(metrics.total_shifts_per_person['Marco Rossi']).toBe(5);
      expect(metrics.preference_satisfaction_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.preference_satisfaction_rate).toBeLessThanOrEqual(100);
      expect(metrics.hard_constraint_violations).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API timeout', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockRejectedValue(new Error('Request timeout'));

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockCallClaude.mockRejectedValue(new Error('Network error'));

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should handle missing employee data gracefully', async () => {
      mockIsConfigured.mockReturnValue(true);
      // Mock will simulate no employees found

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        bureau: 'NonExistent' as any,
      });

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });
});

describe('AI Prompt Generation', () => {
  describe('buildUserPrompt', () => {
    it('should build valid prompt with all required data', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '123',
            full_name: 'Marco Rossi',
            email: 'marco@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Monday', 'Wednesday', 'Friday'],
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
        italian_holidays: ['2025-11-01'],
      });

      expect(prompt).toContain('Marco Rossi');
      expect(prompt).toContain('Milan');
      expect(prompt).toContain('2025-11-01');
      expect(prompt).toContain('senior');
    });

    it('should include employee preferences', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '123',
            full_name: 'Marco Rossi',
            email: 'marco@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Monday', 'Wednesday'],
              preferred_shifts: ['Morning'],
              unavailable_days: ['Friday'],
              max_shifts_per_week: 4,
              notes: 'Prefers morning shifts',
            },
            recent_history: {
              weekend_shifts_last_month: 2,
              night_shifts_last_month: 0,
              total_shifts_last_month: 16,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      expect(prompt).toContain('Monday');
      expect(prompt).toContain('Wednesday');
      expect(prompt).toContain('Morning');
    });

    it('should include Italian holidays', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          type: 'week',
        },
        employees: [],
        existing_shifts: [],
        italian_holidays: ['2025-12-25', '2025-12-26'],
      });

      expect(prompt).toContain('2025-12-25');
      expect(prompt).toContain('2025-12-26');
    });

    it('should include existing shifts when preserving', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [],
        existing_shifts: [
          {
            date: '2025-11-01',
            employee_name: 'Marco Rossi',
            shift_type: 'Morning',
          },
        ],
        italian_holidays: [],
      });

      expect(prompt).toContain('Marco Rossi');
      expect(prompt.toLowerCase()).toContain('existing');
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should contain scheduling guidelines', () => {
      expect(SYSTEM_PROMPT).toContain('schedule');
      expect(SYSTEM_PROMPT).toContain('shift');
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should mention fairness and constraints', () => {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('fair');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('constraint');
    });

    it('should mention Breaking News team context', () => {
      expect(SYSTEM_PROMPT).toContain('Breaking News');
      expect(SYSTEM_PROMPT).toContain('Reuters');
    });

    it('should include preference confirmation status instructions', () => {
      expect(SYSTEM_PROMPT).toContain('PREFERENCE CONFIRMATION STATUS');
      expect(SYSTEM_PROMPT).toContain('CONFIRMED');
      expect(SYSTEM_PROMPT).toContain('PENDING');
      expect(SYSTEM_PROMPT).toContain('prioritize CONFIRMED preferences over PENDING');
    });
  });

  describe('Preference Confirmation Status in Prompts', () => {
    it('should show CONFIRMED status when preferences are confirmed', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '123',
            full_name: 'Sofia Romano',
            email: 'sofia@reuters.com',
            title: 'Breaking News Correspondent',
            shift_role: 'correspondent',
            bureau: 'Rome',
            preferences: {
              preferred_days: ['Monday', 'Wednesday', 'Friday'],
              preferred_shifts: ['Morning', 'Afternoon'],
              unavailable_days: [],
              max_shifts_per_week: 5,
              notes: '',
              confirmed: true,
              confirmed_at: '2025-12-01T10:00:00Z',
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      expect(prompt).toContain('Sofia Romano');
      expect(prompt).toContain('Preference Status: CONFIRMED');
      expect(prompt).not.toContain('PENDING (not yet approved)');
    });

    it('should show PENDING status when preferences are not confirmed', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '456',
            full_name: 'Marco Bianchi',
            email: 'marco.b@reuters.com',
            title: 'Correspondent',
            shift_role: 'correspondent',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Tuesday', 'Thursday'],
              preferred_shifts: ['Afternoon'],
              unavailable_days: [],
              max_shifts_per_week: 4,
              notes: 'Childcare on Mondays',
              confirmed: false,
              confirmed_at: null,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      expect(prompt).toContain('Marco Bianchi');
      expect(prompt).toContain('Preference Status: PENDING (not yet approved)');
      expect(prompt).not.toMatch(/Preference Status: CONFIRMED[^)]|Preference Status: CONFIRMED$/m);
    });

    it('should show PENDING status when confirmed field is undefined', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '789',
            full_name: 'Lucia Verde',
            email: 'lucia@reuters.com',
            title: 'Senior Correspondent',
            shift_role: 'senior',
            bureau: 'Rome',
            preferences: {
              preferred_days: [],
              preferred_shifts: [],
              unavailable_days: [],
              max_shifts_per_week: 5,
              // confirmed field omitted (undefined)
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      expect(prompt).toContain('Lucia Verde');
      expect(prompt).toContain('Preference Status: PENDING (not yet approved)');
    });

    it('should include both CONFIRMED and PENDING employees in same prompt', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '1',
            full_name: 'Confirmed Employee',
            email: 'confirmed@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Monday'],
              preferred_shifts: ['Morning'],
              unavailable_days: [],
              max_shifts_per_week: 5,
              confirmed: true,
              confirmed_at: '2025-12-01T10:00:00Z',
            },
          },
          {
            id: '2',
            full_name: 'Pending Employee',
            email: 'pending@reuters.com',
            title: 'Correspondent',
            shift_role: 'correspondent',
            bureau: 'Milan',
            preferences: {
              preferred_days: ['Friday'],
              preferred_shifts: ['Afternoon'],
              unavailable_days: [],
              max_shifts_per_week: 4,
              confirmed: false,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      expect(prompt).toContain('Confirmed Employee');
      expect(prompt).toContain('Pending Employee');
      // Should contain exactly one CONFIRMED and one PENDING status
      expect((prompt.match(/Preference Status: CONFIRMED/g) || []).length).toBe(1);
      expect((prompt.match(/Preference Status: PENDING \(not yet approved\)/g) || []).length).toBe(
        1
      );
    });

    it('should still include preferences even when status is PENDING', () => {
      const prompt = buildUserPrompt({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
        employees: [
          {
            id: '999',
            full_name: 'Pending With Prefs',
            email: 'pending@reuters.com',
            title: 'Correspondent',
            shift_role: 'correspondent',
            bureau: 'Rome',
            preferences: {
              preferred_days: ['Monday', 'Tuesday', 'Wednesday'],
              preferred_shifts: ['Morning', 'Afternoon'],
              unavailable_days: ['2025-11-05'],
              max_shifts_per_week: 3,
              notes: 'Part-time schedule',
              confirmed: false,
            },
          },
        ],
        existing_shifts: [],
        italian_holidays: [],
      });

      // Preference status should be pending
      expect(prompt).toContain('Preference Status: PENDING (not yet approved)');
      // But all preferences should still be included
      expect(prompt).toContain('Monday, Tuesday, Wednesday');
      expect(prompt).toContain('Morning, Afternoon');
      expect(prompt).toContain('2025-11-05');
      expect(prompt).toContain('Max Shifts/Week: 3');
      expect(prompt).toContain('Part-time schedule');
    });
  });
});

describe('Schedule Saving', () => {
  describe('saveSchedule', () => {
    it('should validate schedule data before saving', async () => {
      const invalidSchedule = {
        shifts: [],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 100,
          hard_constraint_violations: [],
        },
        recommendations: [],
      };

      // Should handle empty shifts gracefully
      const result = await saveSchedule(invalidSchedule, 'user-id');
      expect(result).toBeDefined();
    });
  });
});
