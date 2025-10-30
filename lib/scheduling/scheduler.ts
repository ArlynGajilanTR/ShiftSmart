import { Shift, User, ShiftAssignment, SchedulePeriod } from '@/types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, eachDayOfInterval, parseISO, format } from 'date-fns';

/**
 * Generate time slots for a given day
 */
export function generateTimeSlots(
  startHour: number = 0,
  endHour: number = 24,
  intervalHours: number = 8
): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour += intervalHours) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
  }
  return slots;
}

/**
 * Get date range for a schedule period
 */
export function getDateRangeForPeriod(
  period: SchedulePeriod,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const refDate = referenceDate;

  switch (period.type) {
    case 'week':
      return {
        startDate: startOfWeek(refDate, { weekStartsOn: 0 }), // Sunday
        endDate: endOfWeek(refDate, { weekStartsOn: 0 })
      };
    
    case 'month':
      return {
        startDate: startOfMonth(refDate),
        endDate: endOfMonth(refDate)
      };
    
    case 'quarter':
      return {
        startDate: startOfQuarter(refDate),
        endDate: endOfQuarter(refDate)
      };
    
    case 'special_event':
      return {
        startDate: parseISO(period.start_date),
        endDate: parseISO(period.end_date)
      };
    
    default:
      return {
        startDate: startOfWeek(refDate),
        endDate: endOfWeek(refDate)
      };
  }
}

/**
 * Get all dates in a period
 */
export function getDatesInPeriod(startDate: Date, endDate: Date): Date[] {
  return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Group shifts by date
 */
export function groupShiftsByDate(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>();

  for (const shift of shifts) {
    const date = format(parseISO(shift.start_time), 'yyyy-MM-dd');
    const existing = grouped.get(date) || [];
    existing.push(shift);
    grouped.set(date, existing);
  }

  return grouped;
}

/**
 * Auto-assign shifts based on availability and role requirements
 */
export function autoAssignShifts(
  shifts: Shift[],
  users: User[],
  existingAssignments: ShiftAssignment[]
): ShiftAssignment[] {
  const newAssignments: ShiftAssignment[] = [];

  for (const shift of shifts) {
    const assignedToShift = existingAssignments.filter(a => a.shift_id === shift.id);
    
    if (assignedToShift.length >= shift.required_staff) {
      continue; // Already fully staffed
    }

    // Get role requirements
    const roleRequirements = shift.required_roles || [];
    const availableUsers = users.filter(u => 
      !assignedToShift.some(a => a.user_id === u.id) &&
      u.bureau_id === shift.bureau_id
    );

    // First, assign required roles
    for (const roleReq of roleRequirements) {
      const usersWithRole = availableUsers.filter(u => u.shift_role === roleReq.role);
      const needed = roleReq.min_count - assignedToShift.filter(a => {
        const user = users.find(u => u.id === a.user_id);
        return user?.shift_role === roleReq.role;
      }).length;

      for (let i = 0; i < needed && i < usersWithRole.length; i++) {
        newAssignments.push({
          id: crypto.randomUUID(),
          shift_id: shift.id,
          user_id: usersWithRole[i].id,
          status: 'assigned',
          assigned_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Fill remaining spots with available users
    const stillNeeded = shift.required_staff - (assignedToShift.length + newAssignments.filter(a => a.shift_id === shift.id).length);
    const remainingUsers = availableUsers.filter(u => 
      !newAssignments.some(a => a.user_id === u.id)
    );

    for (let i = 0; i < stillNeeded && i < remainingUsers.length; i++) {
      newAssignments.push({
        id: crypto.randomUUID(),
        shift_id: shift.id,
        user_id: remainingUsers[i].id,
        status: 'assigned',
        assigned_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  return newAssignments;
}

/**
 * Calculate workload distribution across users
 */
export function calculateWorkloadDistribution(
  users: User[],
  assignments: ShiftAssignment[],
  shifts: Shift[]
): Map<string, { hours: number; shiftCount: number; user: User }> {
  const distribution = new Map<string, { hours: number; shiftCount: number; user: User }>();

  for (const user of users) {
    const userAssignments = assignments.filter(a => a.user_id === user.id);
    let totalHours = 0;

    for (const assignment of userAssignments) {
      const shift = shifts.find(s => s.id === assignment.shift_id);
      if (shift) {
        const start = parseISO(shift.start_time);
        const end = parseISO(shift.end_time);
        totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    }

    distribution.set(user.id, {
      hours: totalHours,
      shiftCount: userAssignments.length,
      user
    });
  }

  return distribution;
}

/**
 * Balance shift assignments across users
 */
export function balanceShiftAssignments(
  users: User[],
  shifts: Shift[],
  assignments: ShiftAssignment[]
): ShiftAssignment[] {
  const workload = calculateWorkloadDistribution(users, assignments, shifts);
  
  // Sort users by current workload (ascending)
  const sortedUsers = Array.from(workload.entries())
    .sort((a, b) => a[1].hours - b[1].hours)
    .map(([userId]) => users.find(u => u.id === userId)!)
    .filter(Boolean);

  // Redistribute unassigned shifts
  const unassignedShifts = shifts.filter(shift => {
    const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
    return shiftAssignments.length < shift.required_staff;
  });

  const newAssignments: ShiftAssignment[] = [...assignments];
  let userIndex = 0;

  for (const shift of unassignedShifts) {
    const needed = shift.required_staff - assignments.filter(a => a.shift_id === shift.id).length;
    
    for (let i = 0; i < needed; i++) {
      const user = sortedUsers[userIndex % sortedUsers.length];
      
      newAssignments.push({
        id: crypto.randomUUID(),
        shift_id: shift.id,
        user_id: user.id,
        status: 'assigned',
        assigned_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      userIndex++;
    }
  }

  return newAssignments;
}

