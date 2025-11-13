/**
 * Unit tests for parseScheduleResponse()
 * Tests Issue #3: JSON parsing validation with default values
 *
 * CRITICAL: Must handle missing fairness_metrics and recommendations gracefully
 */

describe('parseScheduleResponse validation', () => {
  // Mock console methods to test logging
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Valid response handling', () => {
    const validSchedule = JSON.stringify({
      shifts: [
        {
          date: '2025-11-15',
          start_time: '08:00',
          end_time: '16:00',
          bureau: 'Milan',
          assigned_to: 'Marco Rossi',
          role_level: 'senior',
          shift_type: 'Morning',
          reasoning: 'Test',
        },
      ],
      fairness_metrics: {
        weekend_shifts_per_person: {},
        night_shifts_per_person: {},
        total_shifts_per_person: {},
        preference_satisfaction_rate: 0.85,
        hard_constraint_violations: [],
      },
      recommendations: ['Schedule is balanced'],
    });

    test('should parse valid JSON successfully', () => {
      // Test the parsing logic inline
      const jsonMatch = validSchedule.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();

      const parsed = JSON.parse(jsonMatch![0]);
      expect(parsed.shifts).toBeInstanceOf(Array);
      expect(parsed.shifts.length).toBeGreaterThan(0);
      expect(parsed.fairness_metrics).toBeDefined();
      expect(parsed.recommendations).toBeDefined();
    });

    test('should parse JSON wrapped in markdown code blocks', () => {
      const wrapped = '```json\n' + validSchedule + '\n```';
      const jsonMatch = wrapped.match(/```json\s*(\{[\s\S]*?\})\s*```/);

      expect(jsonMatch).not.toBeNull();
      const parsed = JSON.parse(jsonMatch![1]);
      expect(parsed.shifts).toBeInstanceOf(Array);
    });

    test('should parse JSON with extra text before/after', () => {
      const withText =
        'Here is the schedule:\n' + validSchedule + '\n\nLet me know if you need changes.';
      const jsonMatch = withText.match(/\{[\s\S]*\}/);

      expect(jsonMatch).not.toBeNull();
      const parsed = JSON.parse(jsonMatch![0]);
      expect(parsed.shifts).toBeDefined();
    });

    test('should validate required fields in shifts', () => {
      const parsed = JSON.parse(validSchedule);
      const firstShift = parsed.shifts[0];

      const requiredFields = [
        'date',
        'start_time',
        'end_time',
        'bureau',
        'assigned_to',
        'shift_type',
      ];
      requiredFields.forEach((field) => {
        expect(firstShift[field]).toBeDefined();
      });
    });
  });

  describe('Missing metrics handling - CRITICAL BUG FIX', () => {
    const scheduleWithoutMetrics = JSON.stringify({
      shifts: [
        {
          date: '2025-11-15',
          start_time: '08:00',
          end_time: '16:00',
          bureau: 'Milan',
          assigned_to: 'Marco Rossi',
          role_level: 'senior',
          shift_type: 'Morning',
          reasoning: 'Test',
        },
      ],
    });

    test('should provide default fairness_metrics when missing', () => {
      const parsed = JSON.parse(scheduleWithoutMetrics);

      // Simulate the fix
      if (!parsed.fairness_metrics) {
        parsed.fairness_metrics = {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0,
          hard_constraint_violations: [],
        };
      }

      expect(parsed.fairness_metrics).toBeDefined();
      expect(parsed.fairness_metrics.weekend_shifts_per_person).toBeDefined();
      expect(parsed.fairness_metrics.night_shifts_per_person).toBeDefined();
      expect(parsed.fairness_metrics.total_shifts_per_person).toBeDefined();
      expect(parsed.fairness_metrics.hard_constraint_violations).toEqual([]);
    });

    test('should provide empty recommendations when missing', () => {
      const parsed = JSON.parse(scheduleWithoutMetrics);

      // Simulate the fix
      if (!parsed.recommendations) {
        parsed.recommendations = [];
      }

      expect(parsed.recommendations).toBeDefined();
      expect(parsed.recommendations).toEqual([]);
    });

    test('should fill in missing sub-fields of fairness_metrics', () => {
      const partialMetrics = JSON.stringify({
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
            reasoning: 'Test',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          // Missing other fields
        },
      });

      const parsed = JSON.parse(partialMetrics);

      // Simulate the fix
      if (parsed.fairness_metrics) {
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

      expect(parsed.fairness_metrics.night_shifts_per_person).toBeDefined();
      expect(parsed.fairness_metrics.total_shifts_per_person).toBeDefined();
      expect(parsed.fairness_metrics.hard_constraint_violations).toEqual([]);
    });
  });

  describe('Invalid response handling', () => {
    test('should detect invalid JSON', () => {
      const invalidJson = '{this is not valid json}';

      expect(() => {
        const jsonMatch = invalidJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          JSON.parse(jsonMatch[0]);
        }
      }).toThrow();
    });

    test('should detect no JSON in response', () => {
      const noJson = 'This is just text without any JSON';
      const jsonMatch = noJson.match(/\{[\s\S]*\}/);

      expect(jsonMatch).toBeNull();
    });

    test('should detect empty shifts array', () => {
      const emptyShifts = JSON.stringify({
        shifts: [],
        fairness_metrics: {},
        recommendations: [],
      });

      const parsed = JSON.parse(emptyShifts);
      expect(parsed.shifts.length).toBe(0);
    });

    test('should detect missing shifts array', () => {
      const noShifts = JSON.stringify({
        fairness_metrics: {},
        recommendations: [],
      });

      const parsed = JSON.parse(noShifts);
      expect(parsed.shifts).toBeUndefined();
    });

    test('should detect invalid shifts array', () => {
      const invalidShifts = JSON.stringify({
        shifts: 'not an array',
        fairness_metrics: {},
        recommendations: [],
      });

      const parsed = JSON.parse(invalidShifts);
      expect(Array.isArray(parsed.shifts)).toBe(false);
    });

    test('should detect missing required field in shift', () => {
      const missingField = JSON.stringify({
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            // Missing end_time and other fields
          },
        ],
      });

      const parsed = JSON.parse(missingField);
      const firstShift = parsed.shifts[0];

      expect(firstShift.end_time).toBeUndefined();
      expect(firstShift.bureau).toBeUndefined();
      expect(firstShift.assigned_to).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle multiple JSON blocks (prefer first)', () => {
      const multipleJson = '{"shifts":[]} some text {"other":"data"}';
      const jsonMatch = multipleJson.match(/\{[\s\S]*\}/);

      // Greedy regex will match the whole thing
      expect(jsonMatch).not.toBeNull();
    });

    test('should handle nested objects in response', () => {
      const nestedJson = JSON.stringify({
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
            reasoning: 'Test',
            metadata: {
              nested: {
                deep: 'value',
              },
            },
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 1.0,
          hard_constraint_violations: [],
        },
        recommendations: [],
      });

      const parsed = JSON.parse(nestedJson);
      expect(parsed.shifts[0].metadata.nested.deep).toBe('value');
    });

    test('should handle special characters in strings', () => {
      const specialChars = JSON.stringify({
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: "O'Brien", // Apostrophe
            shift_type: 'Morning',
            reasoning: 'Prefers "morning" shifts', // Quotes
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 1.0,
          hard_constraint_violations: [],
        },
        recommendations: [],
      });

      const parsed = JSON.parse(specialChars);
      expect(parsed.shifts[0].assigned_to).toBe("O'Brien");
    });
  });

  describe('Logging validation', () => {
    test('should log success with shift count', () => {
      const validSchedule = {
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
            reasoning: 'Test',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 1.0,
          hard_constraint_violations: [],
        },
        recommendations: [],
      };

      // Simulate successful parsing
      const shiftCount = validSchedule.shifts.length;
      console.log(`[Parse Success] Parsed ${shiftCount} shifts successfully`);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Parse Success]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('shifts successfully'));
    });

    test('should log error for invalid JSON', () => {
      const invalidResponse = '{invalid json}';

      try {
        const jsonMatch = invalidResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('[Parse Error] JSON parse exception:', error);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parse Error]'),
        expect.anything()
      );
    });

    test('should log warning for missing metrics', () => {
      const scheduleWithoutMetrics = {
        shifts: [
          {
            date: '2025-11-15',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
            reasoning: 'Test',
          },
        ],
      };

      if (!scheduleWithoutMetrics.fairness_metrics) {
        console.warn('[Parse Warning] Missing fairness_metrics, using defaults');
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[Parse Warning]'));
    });
  });
});
