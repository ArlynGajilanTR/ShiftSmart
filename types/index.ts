// Core TypeScript type definitions for ShiftSmart

export type UserRole = 'admin' | 'manager' | 'scheduler' | 'staff';

export type ShiftRole = 'editor' | 'senior' | 'correspondent';

export type SchedulePeriodType = 'week' | 'month' | 'quarter' | 'special_event';

// Internal conflict severity (used by validation logic)
export type ConflictSeverityInternal = 'soft' | 'hard';

// Database/UI conflict severity (matches schema CHECK constraint)
export type ConflictSeverity = 'high' | 'medium' | 'low';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  shift_role: ShiftRole;
  bureau_id: string;
  is_team_leader: boolean;
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

export interface ShiftPreferences {
  id: string;
  user_id: string;
  preferred_days: string[]; // Day names: ['Monday', 'Tuesday']
  preferred_shifts: string[]; // ['Morning', 'Afternoon', 'Evening', 'Night']
  max_shifts_per_week: number;
  notes?: string;
  confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
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

// Conflict type stored in database (matches schema CHECK constraint)
export type ConflictTypeDB =
  | 'Double Booking'
  | 'Rest Period Violation'
  | 'Skill Gap'
  | 'Understaffed'
  | 'Overtime Warning'
  | 'Cross-Bureau Conflict'
  | 'Preference Violation';

// Internal conflict type (used by validation logic)
export type ConflictTypeInternal =
  | 'double_booking'
  | 'preference_violation'
  | 'role_imbalance'
  | 'overtime_risk'
  | 'insufficient_coverage'
  | 'rest_period_violation'
  | 'skill_gap';

// Alias for backward compatibility in validation code
export type ConflictType = ConflictTypeInternal;

// Conflict status (matches schema CHECK constraint)
export type ConflictStatus = 'unresolved' | 'acknowledged' | 'resolved';

// Internal conflict interface (used by validation logic)
export interface ConflictInternal {
  id: string;
  type: ConflictTypeInternal;
  severity: ConflictSeverityInternal;
  shift_id: string;
  user_id?: string;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

// Alias for backward compatibility in validation code
export interface Conflict extends ConflictInternal {}

// Database conflict interface (matches schema)
export interface ConflictDB {
  id: string;
  type: ConflictTypeDB;
  severity: ConflictSeverity;
  status: ConflictStatus;
  shift_id?: string;
  user_id?: string;
  description: string;
  date: string;
  details: Record<string, any>;
  detected_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

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

export interface TimeOffRequest {
  id: string;
  user_id: string;
  start_date: string; // ISO date format (YYYY-MM-DD)
  end_date: string; // ISO date format (YYYY-MM-DD)
  type: 'vacation' | 'personal' | 'sick' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}
