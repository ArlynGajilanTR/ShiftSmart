/**
 * Response Parser Tests - 50+ AI response edge cases
 * Comprehensive testing of all possible AI response formats
 */

import { parseScheduleResponse } from '@/lib/ai/scheduler-agent';
import * as fs from 'fs';
import * as path from 'path';

describe('AI Response Parser - Comprehensive Tests', () => {
  // Mock console to prevent noise during tests
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

  describe('Valid JSON Responses', () => {
    it('should parse minimal valid schedule', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test User',
            shift_type: 'Morning',
            reasoning: 'Test',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: { 'Test User': 1 },
          preference_satisfaction_rate: 1.0,
          hard_constraint_violations: [],
        },
        recommendations: [],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.shifts.length).toBe(1);
    });

    it('should parse large schedule with 100+ shifts', () => {
      const shifts = Array(100)
        .fill(null)
        .map((_, i) => ({
          date: `2025-11-${String(Math.floor(i / 3) + 1).padStart(2, '0')}`,
          start_time: '08:00',
          end_time: '16:00',
          bureau: i % 2 === 0 ? 'Milan' : 'Rome',
          assigned_to: `Employee ${i % 10}`,
          shift_type: 'Morning',
          reasoning: 'Test',
        }));

      const response = JSON.stringify({
        shifts,
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0.8,
          hard_constraint_violations: [],
        },
        recommendations: [],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.shifts.length).toBe(100);
    });
  });

  describe('Conversational Response Detection', () => {
    const conversationalResponses = [
      "I'll help you create a schedule for the team.",
      'Let me generate a schedule for you.',
      'I would need more information about the employees.',
      'I need to clarify which bureau you want.',
      'To create an optimal schedule, I need to know...',
      'Before I can generate the schedule, could you tell me...',
      'What time zone should I use for the shifts?',
      'Which employees are available during this period?',
      'How many night shifts should each person have?',
      'Could you clarify if weekend coverage is needed?',
      'Can you specify the preferred shift patterns?',
      'Would you like me to include public holidays?',
      'I understand you need a schedule. Let me ask...',
      "Here's what I need to know to create the schedule:",
      'Question: Should I prioritize senior employees?',
      "I'm missing some information about the team structure.",
      'To ensure fairness, I need to understand...',
    ];

    conversationalResponses.forEach((response, index) => {
      it(`should detect conversational pattern ${index + 1}: "${response.substring(0, 30)}..."`, () => {
        const result = parseScheduleResponse(response);
        expect(result).toBeNull();
      });
    });
  });

  describe('JSON Extraction Patterns', () => {
    it('should extract JSON from markdown with triple backticks', () => {
      const response = '```json\n{"shifts":[]}\n```';
      const validResponse = response.replace(
        '"shifts":[]',
        `"shifts":[{
        "date":"2025-11-01",
        "start_time":"08:00",
        "end_time":"16:00",
        "bureau":"Milan",
        "assigned_to":"Test",
        "shift_type":"Morning"
      }]`
      );

      const result = parseScheduleResponse(validResponse);
      expect(result).not.toBeNull();
    });

    it('should extract JSON with text before', () => {
      const response = 'Here is your schedule: {"shifts":[]}';
      const validResponse = response.replace(
        '"shifts":[]',
        `"shifts":[{
        "date":"2025-11-01",
        "start_time":"08:00",
        "end_time":"16:00",
        "bureau":"Milan",
        "assigned_to":"Test",
        "shift_type":"Morning"
      }]`
      );

      const result = parseScheduleResponse(validResponse);
      expect(result).not.toBeNull();
    });

    it('should extract JSON with text after', () => {
      const response = '{"shifts":[]} This schedule ensures fair distribution.';
      const validResponse = response.replace(
        '"shifts":[]',
        `"shifts":[{
        "date":"2025-11-01",
        "start_time":"08:00",
        "end_time":"16:00",
        "bureau":"Milan",
        "assigned_to":"Test",
        "shift_type":"Morning"
      }]`
      );

      const result = parseScheduleResponse(validResponse);
      expect(result).not.toBeNull();
    });

    it('should extract JSON surrounded by explanation', () => {
      const response = `
        I've analyzed the requirements and created this schedule:

        {"shifts":[]}

        This ensures balanced coverage across both bureaus.
      `;
      const validResponse = response.replace(
        '"shifts":[]',
        `"shifts":[{
        "date":"2025-11-01",
        "start_time":"08:00",
        "end_time":"16:00",
        "bureau":"Milan",
        "assigned_to":"Test",
        "shift_type":"Morning"
      }]`
      );

      const result = parseScheduleResponse(validResponse);
      expect(result).not.toBeNull();
    });

    it('should extract JSON with language tag variations', () => {
      const variations = [
        '```JSON\n{"shifts":[]}\n```',
        '```Json\n{"shifts":[]}\n```',
        '``` json\n{"shifts":[]}\n```',
        '```javascript\n{"shifts":[]}\n```',
      ];

      variations.forEach((template) => {
        const response = template.replace(
          '"shifts":[]',
          `"shifts":[{
          "date":"2025-11-01",
          "start_time":"08:00",
          "end_time":"16:00",
          "bureau":"Milan",
          "assigned_to":"Test",
          "shift_type":"Morning"
        }]`
        );

        const result = parseScheduleResponse(response);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('Truncation Detection', () => {
    it('should detect missing closing brace', () => {
      const truncated = `{"shifts":[{"date":"2025-11-01","start_time":"08:00","end_time":"16:00","bureau":"Milan","assigned_to":"Test","shift_type":"Morning"}],"fairness_metrics":{"weekend_shifts_per_person":{`;

      const result = parseScheduleResponse(truncated);
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('JSON might be truncated')
      );
    });

    it('should detect incomplete array', () => {
      const truncated = `{"shifts":[{"date":"2025-11-01","start_time":"08:00","end_time":"16:00","bureau":"Milan","assigned_to":"Test","shift_type":"Morning"},{"date":"2025-11-02","start_time":"08:00"`;

      const result = parseScheduleResponse(truncated);
      expect(result).toBeNull();
    });

    it('should detect missing end of object', () => {
      const truncated = `{"shifts":[{"date":"2025-11-01","start_time":"08:00","end_time":"16:00","bureau":"Milan","assigned_to":"Test","shift_type":"Morning"}],"fairness_metrics":{"weekend_shifts_per_person":{},"night_shifts_per_person":{},"total_shifts_per_person":{"Test":1},"preference_satisfaction_rate":0.8,"hard_constraint_violations":[`;

      const result = parseScheduleResponse(truncated);
      expect(result).toBeNull();
    });
  });

  describe('Missing Field Handling', () => {
    it('should add default fairness_metrics when completely missing', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
          },
        ],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.fairness_metrics).toEqual({
        weekend_shifts_per_person: {},
        night_shifts_per_person: {},
        total_shifts_per_person: {},
        preference_satisfaction_rate: 0,
        hard_constraint_violations: [],
      });
    });

    it('should fill missing sub-fields in fairness_metrics', () => {
      const partialMetrics = [
        { weekend_shifts_per_person: { Test: 1 } },
        { night_shifts_per_person: { Test: 0 } },
        { total_shifts_per_person: { Test: 5 } },
        { preference_satisfaction_rate: 0.7 },
        { hard_constraint_violations: ['Test violation'] },
      ];

      partialMetrics.forEach((partial) => {
        const response = JSON.stringify({
          shifts: [
            {
              date: '2025-11-01',
              start_time: '08:00',
              end_time: '16:00',
              bureau: 'Milan',
              assigned_to: 'Test',
              shift_type: 'Morning',
            },
          ],
          fairness_metrics: partial,
        });

        const result = parseScheduleResponse(response);
        expect(result).not.toBeNull();
        expect(result!.fairness_metrics.weekend_shifts_per_person).toBeDefined();
        expect(result!.fairness_metrics.night_shifts_per_person).toBeDefined();
        expect(result!.fairness_metrics.total_shifts_per_person).toBeDefined();
        expect(result!.fairness_metrics.preference_satisfaction_rate).toBeDefined();
        expect(result!.fairness_metrics.hard_constraint_violations).toBeDefined();
      });
    });

    it('should add empty recommendations array when missing', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0,
          hard_constraint_violations: [],
        },
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.recommendations).toEqual([]);
    });
  });

  describe('Invalid JSON Structures', () => {
    const invalidStructures = [
      { json: '{"shifts": "not an array"}', error: 'invalid shifts array' },
      { json: '{"shifts": null}', error: 'invalid shifts array' },
      { json: '{"shifts": 123}', error: 'invalid shifts array' },
      { json: '{"shifts": true}', error: 'invalid shifts array' },
      { json: '{}', error: 'Missing or invalid shifts array' },
      { json: '{"other": "data"}', error: 'Missing or invalid shifts array' },
      { json: '[]', error: 'No JSON found' },
      { json: 'null', error: 'No JSON found' },
      { json: 'true', error: 'No JSON found' },
      { json: '123', error: 'No JSON found' },
      { json: '"string"', error: 'No JSON found' },
    ];

    invalidStructures.forEach(({ json, error }, index) => {
      it(`should reject invalid structure ${index + 1}: ${json}`, () => {
        const result = parseScheduleResponse(json);
        expect(result).toBeNull();
      });
    });
  });

  describe('Malformed JSON', () => {
    const malformedJson = [
      '{shifts: []}', // Missing quotes on key
      "{'shifts': []}", // Single quotes
      '{"shifts": [}', // Mismatched brackets
      '{"shifts": [,]}', // Extra comma
      '{"shifts": [{"date": }]}', // Missing value
      '{"shifts": [{"date": "2025-11-01",}]}', // Trailing comma
      '{"shifts": undefined}', // Undefined value
      '{"shifts": [{"date": "2025-11-01"]; }', // Semicolon instead of comma
    ];

    malformedJson.forEach((json, index) => {
      it(`should reject malformed JSON ${index + 1}`, () => {
        const result = parseScheduleResponse(json);
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Parse Error]'),
          expect.any(String)
        );
      });
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle employee names with special characters', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: "Marco O'Brien-Müller",
            shift_type: 'Morning',
            reasoning: 'Senior staff with "special" requirements',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: { "Marco O'Brien-Müller": 0 },
          night_shifts_per_person: {},
          total_shifts_per_person: { "Marco O'Brien-Müller": 1 },
          preference_satisfaction_rate: 0.9,
          hard_constraint_violations: [],
        },
        recommendations: ['Consider José García for next shift'],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.shifts[0].assigned_to).toBe("Marco O'Brien-Müller");
    });

    it('should handle unicode characters', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: '李明 (Li Ming)',
            shift_type: 'Morning',
            reasoning: 'Coverage needed',
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: { '李明 (Li Ming)': 1 },
          preference_satisfaction_rate: 0.85,
          hard_constraint_violations: [],
        },
        recommendations: ['Schedule looks good 👍'],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
      expect(result!.shifts[0].assigned_to).toBe('李明 (Li Ming)');
    });
  });

  describe('Edge Cases for Shift Validation', () => {
    it('should reject shifts with some but not all required fields', () => {
      const incompleteShifts = [
        { date: '2025-11-01' }, // Only date
        { date: '2025-11-01', start_time: '08:00' }, // Missing end_time
        { date: '2025-11-01', start_time: '08:00', end_time: '16:00' }, // Missing bureau
        { date: '2025-11-01', start_time: '08:00', end_time: '16:00', bureau: 'Milan' }, // Missing assigned_to
        { start_time: '08:00', end_time: '16:00', bureau: 'Milan', assigned_to: 'Test' }, // Missing date
      ];

      incompleteShifts.forEach((shift) => {
        const response = JSON.stringify({
          shifts: [shift],
          fairness_metrics: {},
          recommendations: [],
        });

        const result = parseScheduleResponse(response);
        expect(result).toBeNull();
      });
    });

    it('should accept shifts with extra fields', () => {
      const response = JSON.stringify({
        shifts: [
          {
            date: '2025-11-01',
            start_time: '08:00',
            end_time: '16:00',
            bureau: 'Milan',
            assigned_to: 'Test',
            shift_type: 'Morning',
            reasoning: 'Test',
            // Extra fields
            custom_field: 'value',
            priority: 1,
            tags: ['urgent', 'coverage'],
          },
        ],
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0.8,
          hard_constraint_violations: [],
        },
        recommendations: [],
      });

      const result = parseScheduleResponse(response);
      expect(result).not.toBeNull();
    });
  });

  describe('Performance and Large Responses', () => {
    it('should handle very large valid response efficiently', () => {
      const shifts = Array(500)
        .fill(null)
        .map((_, i) => ({
          date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          start_time: '08:00',
          end_time: '16:00',
          bureau: i % 2 === 0 ? 'Milan' : 'Rome',
          assigned_to: `Employee ${i % 50}`,
          shift_type: ['Morning', 'Afternoon', 'Night'][i % 3],
          reasoning: `Rotation ${i}`,
        }));

      const response = JSON.stringify({
        shifts,
        fairness_metrics: {
          weekend_shifts_per_person: {},
          night_shifts_per_person: {},
          total_shifts_per_person: {},
          preference_satisfaction_rate: 0.75,
          hard_constraint_violations: [],
        },
        recommendations: ['Large schedule generated successfully'],
      });

      const start = Date.now();
      const result = parseScheduleResponse(response);
      const duration = Date.now() - start;

      expect(result).not.toBeNull();
      expect(result!.shifts.length).toBe(500);
      expect(duration).toBeLessThan(100); // Should parse in under 100ms
    });
  });
});
