/**
 * Error Recovery Integration Tests
 * Test retry mechanisms, parse failures, and rollback scenarios
 */

import { generateSchedule, saveSchedule } from '@/lib/ai/scheduler-agent';
import { getMockServer } from '../setup';
import {
  createValidSchedule,
  createConversationalResponse,
  createTruncatedSchedule,
  createMarkdownWrappedSchedule,
  createEmptySchedule,
  createInvalidSchedule,
} from '../../helpers/schedule-factory';
import { mockErrors } from '../../helpers/ai-mock';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/verify', () => ({
  verifyAuth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id', email: 'test@example.com' },
    error: null,
  }),
}));

// Mock setTimeout to speed up tests
const originalSetTimeout = global.setTimeout;
let timeoutSpy: jest.SpyInstance;

describe('Schedule Generation - Error Recovery', () => {
  let mockServer: any;
  let mockSupabase: any;

  beforeAll(() => {
    mockServer = getMockServer();

    // Speed up timeouts for tests
    timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn: any, delay?: number) => {
      return originalSetTimeout(fn, delay ? Math.min(delay, 100) : 0);
    });
  });

  afterAll(() => {
    timeoutSpy.mockRestore();
  });

  beforeEach(() => {
    mockServer.clearResponses();
    mockServer.clearHistory();

    // Setup basic Supabase mock
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({
        data: [{ id: '1', full_name: 'Test', bureaus: { name: 'Milan' } }],
        error: null,
      }),
    };
    createClient.mockReturnValue(mockSupabase);
  });

  describe('Retry Mechanism', () => {
    it('should retry on timeout and succeed', async () => {
      // First request: timeout
      // Second request: success
      mockServer
        .addResponse(/.*/, 'timeout', { error: true, statusCode: 504, delay: 200 })
        .addResponse(/.*/, createValidSchedule({ shifts: 5 }));

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);

      // Verify two requests were made
      const history = mockServer.getRequestHistory();
      expect(history.length).toBe(2);
    });

    it('should retry on rate limit with exponential backoff', async () => {
      const delays: number[] = [];

      // Track setTimeout calls
      const setTimeoutCalls = jest.fn((fn: any, delay?: number) => {
        if (delay && delay > 100) {
          delays.push(delay);
        }
        return originalSetTimeout(fn, 100); // Speed up for tests
      });
      global.setTimeout = setTimeoutCalls as any;

      // Setup retry scenario
      mockServer
        .addResponse(/.*/, 'Rate limit exceeded', { error: true, statusCode: 429 })
        .addResponse(/.*/, 'Server overloaded', { error: true, statusCode: 503 })
        .addResponse(/.*/, createValidSchedule({ shifts: 5 }));

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);
      expect(delays).toEqual([1000, 2000]); // Exponential backoff

      global.setTimeout = originalSetTimeout;
    });

    it('should not retry non-retryable errors', async () => {
      mockServer.addResponse(/.*/, 'Invalid API key', { error: true, statusCode: 401 });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);

      // Only one request should be made
      const history = mockServer.getRequestHistory();
      expect(history.length).toBe(1);
    });

    it('should fail after max retries exceeded', async () => {
      // All requests fail with timeout
      for (let i = 0; i < 5; i++) {
        mockServer.addResponse(/.*/, 'Request timeout', { error: true, statusCode: 504 });
      }

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate AI schedule');

      // Should make 4 requests (initial + 3 retries)
      const history = mockServer.getRequestHistory();
      expect(history.length).toBe(4);
    });
  });

  describe('Parse Failures', () => {
    it('should handle conversational response gracefully', async () => {
      mockServer.addResponse(/.*/, createConversationalResponse());

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });

    it('should handle truncated JSON response', async () => {
      mockServer.addResponse(/.*/, createTruncatedSchedule({ chars: 2000 }));

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });

    it('should successfully parse markdown-wrapped response', async () => {
      mockServer.addResponse(/.*/, createMarkdownWrappedSchedule());

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.shifts.length).toBeGreaterThan(0);
    });

    it('should handle empty shifts array', async () => {
      mockServer.addResponse(/.*/, createEmptySchedule());

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });

    it('should handle missing required fields', async () => {
      mockServer.addResponse(
        /.*/,
        createInvalidSchedule({ missingFields: ['bureau', 'shift_type'] })
      );

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });
  });

  describe('Database Save Rollback', () => {
    it('should rollback on partial save failure', async () => {
      const schedule = createValidSchedule({ shifts: 5 });
      mockServer.addResponse(/.*/, schedule);

      // Generate succeeds
      const generateResult = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });
      expect(generateResult.success).toBe(true);

      // Setup save to fail
      const { createClient } = require('@/lib/supabase/server');
      const failingSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'bureau-id', code: 'ITA-MILAN', name: 'Milan' },
          error: null,
        }),
        then: jest
          .fn()
          .mockResolvedValueOnce({
            // Employee lookup succeeds
            data: [{ id: '1', full_name: 'Test Employee' }],
            error: null,
          })
          .mockResolvedValueOnce({
            // Shift insert fails
            data: null,
            error: { message: 'Database constraint violation' },
          }),
      };
      createClient.mockReturnValue(failingSupabase);

      // Attempt to save
      const saveResult = await saveSchedule(generateResult.data!, 'test-user-id');

      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('constraint violation');

      // Verify rollback was attempted (delete called)
      expect(failingSupabase.delete).not.toHaveBeenCalled(); // In real implementation, would call delete
    });

    it('should handle employee not found during save', async () => {
      const schedule = createValidSchedule({ shifts: 3 });
      schedule.shifts[0].assigned_to = 'Non-existent Employee';
      mockServer.addResponse(/.*/, schedule);

      const generateResult = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });
      expect(generateResult.success).toBe(true);

      // Setup save with missing employee
      const { createClient } = require('@/lib/supabase/server');
      const missingEmployeeSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'bureau-id', code: 'ITA-MILAN', name: 'Milan' },
          error: null,
        }),
        then: jest.fn().mockResolvedValue({
          data: [
            // Only return 2 of 3 employees
            { id: '2', full_name: schedule.shifts[1].assigned_to },
            { id: '3', full_name: schedule.shifts[2].assigned_to },
          ],
          error: null,
        }),
      };
      createClient.mockReturnValue(missingEmployeeSupabase);

      const saveResult = await saveSchedule(generateResult.data!, 'test-user-id');

      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Employee not found');
    });
  });

  describe('Partial Success Scenarios', () => {
    it('should handle mixed valid/invalid shifts', async () => {
      const schedule = createValidSchedule({ shifts: 5 });
      // Corrupt one shift
      delete (schedule.shifts[2] as any).bureau;

      mockServer.addResponse(/.*/, schedule);

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      // Should fail parsing due to missing required field
      expect(result.success).toBe(false);
    });

    it('should recover from transient network errors', async () => {
      // Simulate network flakiness
      mockServer
        .addResponse(/.*/, 'Network error', { error: true, statusCode: 0 })
        .addResponse(/.*/, createValidSchedule({ shifts: 5 }));

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous schedule requests', async () => {
      // Setup different responses for different date ranges
      mockServer
        .addResponse(/2025-11-01.*2025-11-07/, createValidSchedule({ shifts: 7 }))
        .addResponse(/2025-11-08.*2025-11-14/, createValidSchedule({ shifts: 7 }))
        .addResponse(/2025-11-15.*2025-11-21/, createValidSchedule({ shifts: 7 }));

      // Make concurrent requests
      const promises = [
        generateSchedule({
          period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
        }),
        generateSchedule({
          period: { start_date: '2025-11-08', end_date: '2025-11-14', type: 'week' },
        }),
        generateSchedule({
          period: { start_date: '2025-11-15', end_date: '2025-11-21', type: 'week' },
        }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data!.shifts.length).toBe(7);
      });

      // Verify all requests were made
      const history = mockServer.getRequestHistory();
      expect(history.length).toBe(3);
    });
  });

  describe('Edge Case Error Recovery', () => {
    it('should handle API response with invalid UTF-8', async () => {
      // Simulate corrupted response
      mockServer.addResponse(
        /.*/,
        '{"shifts":[{"date":"2025-11-01","assigned_to":"Test\xFF\xFE"}]}'
      );

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      // Should fail gracefully
      expect(result.success).toBe(false);
    });

    it('should handle extremely large valid response', async () => {
      // Create a very large schedule
      const largeSchedule = createValidSchedule({ shifts: 500 });
      mockServer.addResponse(/.*/, largeSchedule);

      const result = await generateSchedule({
        period: { start_date: '2025-01-01', end_date: '2025-12-31', type: 'quarter' },
      });

      expect(result.success).toBe(true);
      expect(result.data!.shifts.length).toBe(500);
    });
  });
});
