import { Shift, ShiftAssignment, User, Conflict, ConflictSeverity, ValidationResult } from '@/types';
import { differenceInHours, parseISO, isWithinInterval, addHours } from 'date-fns';

/**
 * Validates a shift assignment and detects conflicts
 */
export async function validateShiftAssignment(
  shift: Shift,
  user: User,
  existingAssignments: ShiftAssignment[],
  allShifts: Shift[]
): Promise<ValidationResult> {
  const conflicts: Conflict[] = [];
  const warnings: string[] = [];

  // Check for double booking
  const doubleBooking = checkDoubleBooking(shift, user, existingAssignments, allShifts);
  if (doubleBooking) {
    conflicts.push(doubleBooking);
  }

  // Check user preferences
  const preferenceViolations = checkPreferenceViolations(shift, user);
  conflicts.push(...preferenceViolations);

  // Check rest period violations
  const restViolation = checkRestPeriod(shift, user, existingAssignments, allShifts);
  if (restViolation) {
    conflicts.push(restViolation);
  }

  // Check overtime risk
  const overtimeRisk = checkOvertimeRisk(shift, user, existingAssignments, allShifts);
  if (overtimeRisk) {
    conflicts.push(overtimeRisk);
  }

  return {
    valid: conflicts.filter(c => c.severity === 'hard').length === 0,
    conflicts,
    warnings
  };
}

/**
 * Validates role balance for a shift
 */
export function validateRoleBalance(
  shift: Shift,
  assignments: ShiftAssignment[],
  users: User[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  
  const assignedUsers = assignments
    .filter(a => a.shift_id === shift.id)
    .map(a => users.find(u => u.id === a.user_id))
    .filter(Boolean) as User[];

  // Count roles
  const roleCounts = {
    senior: assignedUsers.filter(u => u.shift_role === 'senior').length,
    junior: assignedUsers.filter(u => u.shift_role === 'junior').length,
    lead: assignedUsers.filter(u => u.shift_role === 'lead').length,
    support: assignedUsers.filter(u => u.shift_role === 'support').length,
  };

  // Check required roles
  if (shift.required_roles && Array.isArray(shift.required_roles)) {
    shift.required_roles.forEach(req => {
      const actual = roleCounts[req.role] || 0;
      
      if (actual < req.min_count) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'role_imbalance',
          severity: 'hard',
          shift_id: shift.id,
          message: `Insufficient ${req.role} staff: need ${req.min_count}, have ${actual}`,
          details: { required: req, actual: roleCounts },
          resolved: false,
          created_at: new Date().toISOString()
        });
      }

      if (req.max_count && actual > req.max_count) {
        conflicts.push({
          id: crypto.randomUUID(),
          type: 'role_imbalance',
          severity: 'soft',
          shift_id: shift.id,
          message: `Too many ${req.role} staff: max ${req.max_count}, have ${actual}`,
          details: { required: req, actual: roleCounts },
          resolved: false,
          created_at: new Date().toISOString()
        });
      }
    });
  }

  // Check for all-junior shifts (critical safety issue)
  if (roleCounts.junior > 0 && roleCounts.senior === 0 && roleCounts.lead === 0) {
    conflicts.push({
      id: crypto.randomUUID(),
      type: 'skill_gap',
      severity: 'hard',
      shift_id: shift.id,
      message: 'Shift has only junior staff - at least one senior or lead required',
      details: { roleCounts },
      resolved: false,
      created_at: new Date().toISOString()
    });
  }

  // Check insufficient coverage
  if (assignedUsers.length < shift.required_staff) {
    conflicts.push({
      id: crypto.randomUUID(),
      type: 'insufficient_coverage',
      severity: 'hard',
      shift_id: shift.id,
      message: `Understaffed: need ${shift.required_staff}, have ${assignedUsers.length}`,
      details: { required: shift.required_staff, actual: assignedUsers.length },
      resolved: false,
      created_at: new Date().toISOString()
    });
  }

  return conflicts;
}

function checkDoubleBooking(
  shift: Shift,
  user: User,
  existingAssignments: ShiftAssignment[],
  allShifts: Shift[]
): Conflict | null {
  const userAssignments = existingAssignments.filter(a => a.user_id === user.id);
  
  for (const assignment of userAssignments) {
    const otherShift = allShifts.find(s => s.id === assignment.shift_id);
    if (!otherShift) continue;

    // Check for time overlap
    const shiftStart = parseISO(shift.start_time);
    const shiftEnd = parseISO(shift.end_time);
    const otherStart = parseISO(otherShift.start_time);
    const otherEnd = parseISO(otherShift.end_time);

    const hasOverlap = 
      (shiftStart >= otherStart && shiftStart < otherEnd) ||
      (shiftEnd > otherStart && shiftEnd <= otherEnd) ||
      (shiftStart <= otherStart && shiftEnd >= otherEnd);

    if (hasOverlap) {
      return {
        id: crypto.randomUUID(),
        type: 'double_booking',
        severity: 'hard',
        shift_id: shift.id,
        user_id: user.id,
        message: `${user.full_name} is already assigned to another shift during this time`,
        details: { 
          conflicting_shift_id: otherShift.id,
          shift_time: `${shift.start_time} - ${shift.end_time}`,
          conflict_time: `${otherShift.start_time} - ${otherShift.end_time}`
        },
        resolved: false,
        created_at: new Date().toISOString()
      };
    }
  }

  return null;
}

function checkPreferenceViolations(shift: Shift, user: User): Conflict[] {
  const conflicts: Conflict[] = [];

  if (!user.preferences) return conflicts;

  const shiftStart = parseISO(shift.start_time);
  const shiftDate = shiftStart.toISOString().split('T')[0];
  const shiftDay = shiftStart.getDay();

  // Check unavailable dates
  if (user.preferences.unavailable_dates?.includes(shiftDate)) {
    conflicts.push({
      id: crypto.randomUUID(),
      type: 'preference_violation',
      severity: 'soft',
      shift_id: shift.id,
      user_id: user.id,
      message: `${user.full_name} marked ${shiftDate} as unavailable`,
      details: { date: shiftDate },
      resolved: false,
      created_at: new Date().toISOString()
    });
  }

  // Check preferred days
  if (user.preferences.preferred_days && user.preferences.preferred_days.length > 0) {
    if (!user.preferences.preferred_days.includes(shiftDay)) {
      conflicts.push({
        id: crypto.randomUUID(),
        type: 'preference_violation',
        severity: 'soft',
        shift_id: shift.id,
        user_id: user.id,
        message: `${user.full_name} prefers not to work on this day of the week`,
        details: { day: shiftDay },
        resolved: false,
        created_at: new Date().toISOString()
      });
    }
  }

  return conflicts;
}

function checkRestPeriod(
  shift: Shift,
  user: User,
  existingAssignments: ShiftAssignment[],
  allShifts: Shift[]
): Conflict | null {
  const MINIMUM_REST_HOURS = 11; // Standard rest period

  const userAssignments = existingAssignments.filter(a => a.user_id === user.id);
  const shiftStart = parseISO(shift.start_time);

  for (const assignment of userAssignments) {
    const otherShift = allShifts.find(s => s.id === assignment.shift_id);
    if (!otherShift) continue;

    const otherEnd = parseISO(otherShift.end_time);
    const hoursBetween = differenceInHours(shiftStart, otherEnd);

    if (hoursBetween >= 0 && hoursBetween < MINIMUM_REST_HOURS) {
      return {
        id: crypto.randomUUID(),
        type: 'rest_period_violation',
        severity: 'hard',
        shift_id: shift.id,
        user_id: user.id,
        message: `${user.full_name} has insufficient rest period (${hoursBetween.toFixed(1)}h, need ${MINIMUM_REST_HOURS}h)`,
        details: { 
          hours_between: hoursBetween,
          minimum_required: MINIMUM_REST_HOURS,
          previous_shift_end: otherShift.end_time
        },
        resolved: false,
        created_at: new Date().toISOString()
      };
    }
  }

  return null;
}

function checkOvertimeRisk(
  shift: Shift,
  user: User,
  existingAssignments: ShiftAssignment[],
  allShifts: Shift[]
): Conflict | null {
  const MAX_HOURS_PER_WEEK = user.preferences?.max_shifts_per_week 
    ? user.preferences.max_shifts_per_week * 8 
    : 40;

  const userAssignments = existingAssignments.filter(a => a.user_id === user.id);
  const shiftStart = parseISO(shift.start_time);
  
  // Calculate week boundaries
  const weekStart = new Date(shiftStart);
  weekStart.setDate(shiftStart.getDate() - shiftStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = addHours(weekStart, 7 * 24);

  // Calculate hours already scheduled this week
  let totalHours = 0;
  for (const assignment of userAssignments) {
    const otherShift = allShifts.find(s => s.id === assignment.shift_id);
    if (!otherShift) continue;

    const otherStart = parseISO(otherShift.start_time);
    if (isWithinInterval(otherStart, { start: weekStart, end: weekEnd })) {
      const shiftHours = differenceInHours(
        parseISO(otherShift.end_time),
        parseISO(otherShift.start_time)
      );
      totalHours += shiftHours;
    }
  }

  // Add this shift's hours
  const thisShiftHours = differenceInHours(
    parseISO(shift.end_time),
    parseISO(shift.start_time)
  );
  totalHours += thisShiftHours;

  if (totalHours > MAX_HOURS_PER_WEEK) {
    return {
      id: crypto.randomUUID(),
      type: 'overtime_risk',
      severity: 'soft',
      shift_id: shift.id,
      user_id: user.id,
      message: `${user.full_name} would exceed weekly hour limit (${totalHours}h / ${MAX_HOURS_PER_WEEK}h)`,
      details: { 
        total_hours: totalHours,
        max_hours: MAX_HOURS_PER_WEEK,
        week_start: weekStart.toISOString()
      },
      resolved: false,
      created_at: new Date().toISOString()
    };
  }

  return null;
}

