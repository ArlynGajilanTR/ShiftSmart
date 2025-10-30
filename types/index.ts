// Core TypeScript type definitions for ShiftSmart

export type UserRole = 'admin' | 'manager' | 'scheduler' | 'staff';

export type ShiftRole = 'senior' | 'junior' | 'lead' | 'support';

export type SchedulePeriodType = 'week' | 'month' | 'quarter' | 'special_event';

export type ConflictSeverity = 'soft' | 'hard';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  shift_role: ShiftRole;
  bureau_id: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface Bureau {
  id: string;
  name: string;
  code: string;
  timezone: string;
  settings: BureauSettings;
  created_at: string;
  updated_at: string;
}

export interface BureauSettings {
  min_senior_per_shift: number;
  max_junior_per_shift: number;
  require_lead: boolean;
  shift_duration_hours: number;
}

export interface Shift {
  id: string;
  bureau_id: string;
  start_time: string;
  end_time: string;
  required_staff: number;
  required_roles: ShiftRoleRequirement[];
  assignments: ShiftAssignment[];
  status: 'draft' | 'published' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ShiftRoleRequirement {
  role: ShiftRole;
  min_count: number;
  max_count?: number;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  user_id: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  assigned_by: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  unavailable_dates: string[];
  preferred_days: number[]; // 0-6 (Sunday-Saturday)
  max_shifts_per_week: number;
  preferred_shift_times: string[];
}

export interface SchedulePeriod {
  id: string;
  bureau_id: string;
  name: string;
  type: SchedulePeriodType;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  shift_id: string;
  user_id?: string;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

export type ConflictType =
  | 'double_booking'
  | 'preference_violation'
  | 'role_imbalance'
  | 'overtime_risk'
  | 'insufficient_coverage'
  | 'rest_period_violation'
  | 'skill_gap';

export interface DragDropShiftData {
  shiftId: string;
  userId: string;
  sourceDate: string;
  targetDate: string;
  sourceShiftTime: string;
  targetShiftTime: string;
}

export interface ScheduleView {
  type: SchedulePeriodType;
  startDate: Date;
  endDate: Date;
  shifts: Shift[];
  conflicts: Conflict[];
}

export interface ValidationResult {
  valid: boolean;
  conflicts: Conflict[];
  warnings: string[];
}

export interface CSVImportRow {
  date: string;
  start_time: string;
  end_time: string;
  staff_name: string;
  staff_email: string;
  role: string;
  bureau: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

