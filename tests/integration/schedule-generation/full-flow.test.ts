/**
 * Full Flow Integration Tests
 * Test complete schedule generation flow with mock AI
 */

import { generateSchedule, saveSchedule } from '@/lib/ai/scheduler-agent';
import { getMockServer } from '../setup';
import { createValidSchedule, createConversationalResponse } from '../../helpers/schedule-factory';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

// Mock authentication
jest.mock('@/lib/auth/verify', () => ({
  verifyAuth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id', email: 'test@example.com' },
    error: null,
  }),
}));

describe('Schedule Generation - Full Flow Integration', () => {
  let mockServer: any;
  let mockSupabase: any;

  beforeAll(() => {
    mockServer = getMockServer();
  });

  beforeEach(() => {
    // Clear mock responses
    mockServer.clearResponses();
    mockServer.clearHistory();

    // Setup Supabase mock
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
      then: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Authentication → Generate → Parse → Save', () => {
    it('should complete full flow for week schedule', async () => {
      // Setup mock response
      const expectedSchedule = createValidSchedule({ shifts: 14 });
      mockServer.addResponse(/week schedule/, expectedSchedule);

      // Mock employee data
      mockSupabase.then.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            full_name: 'Marco Rossi',
            email: 'marco@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
          },
          {
            id: '2',
            full_name: 'Sara Romano',
            email: 'sara@reuters.com',
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Rome' },
          },
        ],
        error: null,
      });

      // Generate schedule
      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-07',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.shifts.length).toBe(14);

      // Verify API was called
      const history = mockServer.getRequestHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].body.messages[0].content).toContain('2025-11-01');
    });

    it('should handle month schedule with both bureaus', async () => {
      const monthSchedule = createValidSchedule({ shifts: 60, bureau: 'both' });
      mockServer.addResponse(/month.*both/i, monthSchedule);

      // Mock employees from both bureaus
      mockSupabase.then.mockResolvedValueOnce({
        data: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `employee${i}@reuters.com`,
            title: i < 5 ? 'Senior Editor' : 'Editor',
            shift_role: i < 5 ? 'senior' : 'mid',
            bureaus: { name: i % 2 === 0 ? 'Milan' : 'Rome' },
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-11-01',
          end_date: '2025-11-30',
          type: 'month',
        },
        bureau: 'both',
      });

      expect(result.success).toBe(true);
      expect(result.data!.shifts.length).toBe(60);

      // Verify both bureaus are represented
      const milanShifts = result.data!.shifts.filter((s) => s.bureau === 'Milan');
      const romeShifts = result.data!.shifts.filter((s) => s.bureau === 'Rome');
      expect(milanShifts.length).toBeGreaterThan(0);
      expect(romeShifts.length).toBeGreaterThan(0);
    });

    it('should handle quarter schedule', async () => {
      const quarterSchedule = createValidSchedule({ shifts: 180 });
      mockServer.addResponse(/quarter/, quarterSchedule);

      mockSupabase.then.mockResolvedValueOnce({
        data: Array(15)
          .fill(null)
          .map((_, i) => ({
            id: `emp-${i}`,
            full_name: `Employee ${i}`,
            email: `employee${i}@reuters.com`,
            title: 'Editor',
            shift_role: 'mid',
            bureaus: { name: 'Milan' },
          })),
        error: null,
      });

      const result = await generateSchedule({
        period: {
          start_date: '2025-10-01',
          end_date: '2025-12-31',
          type: 'quarter',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data!.shifts.length).toBe(180);
    });
  });

  describe('Different Bureaus', () => {
    it('should filter employees by Milan bureau', async () => {
      mockServer.addResponse(/Milan/, createValidSchedule({ bureau: 'Milan' }));

      // Mock employees - mix of bureaus
      const allEmployees = [
        { id: '1', bureaus: { name: 'Milan' }, full_name: 'Milan 1' },
        { id: '2', bureaus: { name: 'Rome' }, full_name: 'Rome 1' },
        { id: '3', bureaus: { name: 'Milan' }, full_name: 'Milan 2' },
      ];

      mockSupabase.then.mockImplementation((resolve: any) => {
        // Check if bureau filter was applied
        const calls = mockSupabase.eq.mock.calls;
        const hasBureauFilter = calls.some(
          (call: any[]) => call[0] === 'bureau_id' || call[0] === 'bureaus.name'
        );

        // Return filtered or all employees
        const employees = hasBureauFilter
          ? allEmployees.filter((e) => e.bureaus.name === 'Milan')
          : allEmployees;

        return resolve({ data: employees, error: null });
      });

      await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
        bureau: 'Milan',
      });

      // Verify bureau filter was applied
      expect(mockSupabase.eq).toHaveBeenCalled();
    });

    it('should filter employees by Rome bureau', async () => {
      mockServer.addResponse(/Rome/, createValidSchedule({ bureau: 'Rome' }));

      mockSupabase.then.mockResolvedValueOnce({
        data: [{ id: '1', bureaus: { name: 'Rome' }, full_name: 'Rome Employee' }],
        error: null,
      });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
        bureau: 'Rome',
      });

      expect(result.success).toBe(true);
    });

    it('should include all employees when bureau is "both"', async () => {
      mockServer.addResponse(/both/, createValidSchedule({ bureau: 'both' }));

      const employees = [
        { id: '1', bureaus: { name: 'Milan' }, full_name: 'Milan Employee' },
        { id: '2', bureaus: { name: 'Rome' }, full_name: 'Rome Employee' },
      ];

      mockSupabase.then.mockResolvedValueOnce({ data: employees, error: null });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
        bureau: 'both',
      });

      expect(result.success).toBe(true);

      // Should not apply bureau filter when "both"
      const eqCalls = mockSupabase.eq.mock.calls;
      const bureauFilterApplied = eqCalls.some(
        (call: any[]) => call[0] === 'bureau_id' || call[0] === 'bureaus.name'
      );
      expect(bureauFilterApplied).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no employees found', async () => {
      mockSupabase.then.mockResolvedValueOnce({ data: [], error: null });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No employees found');
    });

    it('should handle holidays in schedule', async () => {
      const scheduleWithHolidays = createValidSchedule({ shifts: 14 });
      mockServer.addResponse(/Italian holidays.*2025-12-25/, scheduleWithHolidays);

      mockSupabase.then.mockResolvedValueOnce({
        data: [{ id: '1', full_name: 'Test', bureaus: { name: 'Milan' } }],
        error: null,
      });

      // Christmas period
      const result = await generateSchedule({
        period: {
          start_date: '2025-12-20',
          end_date: '2025-12-31',
          type: 'week',
        },
      });

      expect(result.success).toBe(true);

      // Verify holidays were included in prompt
      const history = mockServer.getRequestHistory();
      expect(history[0].body.messages[0].content).toContain('2025-12-25');
    });

    it('should handle existing shifts when preserving', async () => {
      const scheduleWithExisting = createValidSchedule({ shifts: 10 });
      mockServer.addResponse(/existing shifts/, scheduleWithExisting);

      // Mock existing shifts
      mockSupabase.then
        .mockResolvedValueOnce({
          // Employees
          data: [{ id: '1', full_name: 'Test', bureaus: { name: 'Milan' } }],
          error: null,
        })
        .mockResolvedValueOnce({
          // Existing shifts
          data: [
            {
              date: '2025-11-01',
              start_time: '08:00',
              end_time: '16:00',
              users: { full_name: 'Existing Employee' },
              shift_type: 'Morning',
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
        preserve_existing: true,
      });

      expect(result.success).toBe(true);

      // Verify existing shifts were queried
      expect(mockSupabase.from).toHaveBeenCalledWith('shifts');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch employees');
    });
  });

  describe('Preference Confirmation Status', () => {
    it('should include confirmed field in employee preferences mapping', async () => {
      mockServer.addResponse(/.*/, createValidSchedule({ shifts: 5 }));

      // Mock employees with mixed confirmation status
      mockSupabase.then.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            full_name: 'Confirmed Employee',
            email: 'confirmed@reuters.com',
            title: 'Senior Editor',
            shift_role: 'senior',
            bureaus: { name: 'Milan' },
            shift_preferences: {
              preferred_days: ['Monday', 'Wednesday'],
              preferred_shifts: ['Morning'],
              max_shifts_per_week: 5,
              notes: '',
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
            bureaus: { name: 'Rome' },
            shift_preferences: {
              preferred_days: ['Friday'],
              preferred_shifts: ['Afternoon'],
              max_shifts_per_week: 4,
              notes: 'Childcare Mon-Thu',
              confirmed: false,
              confirmed_at: null,
            },
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
        bureau: 'both',
      });

      expect(result.success).toBe(true);

      // Verify AI was called - the prompt should contain confirmation status
      const history = mockServer.getRequestHistory();
      expect(history.length).toBeGreaterThan(0);

      const promptContent = history[0].body.messages[0].content;
      expect(promptContent).toContain('CONFIRMED');
      expect(promptContent).toContain('PENDING');
    });

    it('should default to pending when shift_preferences is null', async () => {
      mockServer.addResponse(/.*/, createValidSchedule({ shifts: 3 }));

      // Mock employee with no preferences (null)
      mockSupabase.then.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            full_name: 'No Prefs Employee',
            email: 'noprefs@reuters.com',
            title: 'Junior Correspondent',
            shift_role: 'correspondent',
            bureaus: { name: 'Milan' },
            shift_preferences: null, // No preferences set
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);

      // Verify the prompt shows PENDING for employee without preferences
      const history = mockServer.getRequestHistory();
      const promptContent = history[0].body.messages[0].content;
      expect(promptContent).toContain('No Prefs Employee');
      expect(promptContent).toContain('PENDING (not yet approved)');
    });

    it('should include all preferences even when status is pending', async () => {
      mockServer.addResponse(/.*/, createValidSchedule({ shifts: 3 }));

      // Mock employee with pending preferences
      mockSupabase.then.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            full_name: 'Pending With Details',
            email: 'pending@reuters.com',
            title: 'Correspondent',
            shift_role: 'correspondent',
            bureaus: { name: 'Rome' },
            shift_preferences: {
              preferred_days: ['Monday', 'Tuesday', 'Wednesday'],
              preferred_shifts: ['Morning', 'Afternoon'],
              max_shifts_per_week: 3,
              notes: 'Part-time contract',
              confirmed: false,
              confirmed_at: null,
            },
          },
        ],
        error: null,
      });

      const result = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(result.success).toBe(true);

      // Verify all preferences are in the prompt even when pending
      const history = mockServer.getRequestHistory();
      const promptContent = history[0].body.messages[0].content;
      expect(promptContent).toContain('Pending With Details');
      expect(promptContent).toContain('Monday, Tuesday, Wednesday');
      expect(promptContent).toContain('Morning, Afternoon');
      expect(promptContent).toContain('Part-time contract');
      expect(promptContent).toContain('PENDING (not yet approved)');
    });
  });

  describe('Save to Database', () => {
    it('should save generated schedule to database', async () => {
      const schedule = createValidSchedule({ shifts: 5 });
      mockServer.addResponse(/.*/, schedule);

      // Mock successful employee fetch
      mockSupabase.then.mockResolvedValueOnce({
        data: [{ id: '1', full_name: 'Test', bureaus: { name: 'Milan' } }],
        error: null,
      });

      // Generate schedule
      const generateResult = await generateSchedule({
        period: { start_date: '2025-11-01', end_date: '2025-11-07', type: 'week' },
      });

      expect(generateResult.success).toBe(true);

      // Now save it
      // Mock bureau lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'milan-bureau-id', name: 'Milan' },
        error: null,
      });

      // Mock employee lookups
      mockSupabase.then.mockResolvedValueOnce({
        data: schedule.shifts.map((s, i) => ({
          id: `emp-${i}`,
          full_name: s.assigned_to,
        })),
        error: null,
      });

      // Mock shift inserts
      mockSupabase.select.mockReturnThis();
      mockSupabase.then.mockResolvedValueOnce({
        data: schedule.shifts.map((s, i) => ({
          id: `shift-${i}`,
          ...s,
        })),
        error: null,
      });

      // Mock assignment inserts
      mockSupabase.then.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const saveResult = await saveSchedule(generateResult.data!, 'test-user-id');

      expect(saveResult.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('shifts');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});
