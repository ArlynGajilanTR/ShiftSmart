import { createClient } from '@/lib/supabase/server';

/**
 * Audit action types
 */
export type AuditAction =
  | 'shift_created'
  | 'shift_moved'
  | 'shift_updated'
  | 'shift_deleted'
  | 'shift_assigned'
  | 'shift_unassigned'
  | 'conflict_resolved'
  | 'conflict_force_moved'
  | 'schedule_generated'
  | 'preference_updated'
  | 'time_off_created'
  | 'time_off_deleted';

/**
 * Entity types for audit logging
 */
export type AuditEntityType =
  | 'shift'
  | 'conflict'
  | 'schedule'
  | 'preference'
  | 'time_off'
  | 'user';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  changes: Record<string, any>;
  ip_address?: string;
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request): string | null {
  // Try various headers that might contain the client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  return null;
}

/**
 * Log an action to the audit trail
 *
 * @param entry - The audit log entry to record
 * @returns Promise<boolean> - True if logged successfully, false otherwise
 *
 * @example
 * ```ts
 * await logAudit({
 *   user_id: user.id,
 *   action: 'shift_moved',
 *   entity_type: 'shift',
 *   entity_id: shiftId,
 *   changes: {
 *     from: { date: '2025-12-10', start_time: '08:00', end_time: '16:00' },
 *     to: { date: '2025-12-11', start_time: '06:00', end_time: '12:00' },
 *   },
 *   ip_address: getClientIP(request),
 * });
 * ```
 */
export async function logAudit(entry: AuditLogEntry): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      changes: entry.changes,
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Audit log error:', error);
      return false;
    }

    return true;
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Audit log exception:', error);
    return false;
  }
}

/**
 * Helper to create a shift move audit entry
 */
export function createShiftMoveAudit(
  userId: string,
  shiftId: string,
  previousState: {
    date: string;
    start_time: string;
    end_time: string;
    employee_id?: string;
    employee_name?: string;
  },
  newState: {
    date: string;
    start_time: string;
    end_time: string;
  },
  options?: {
    forced?: boolean;
    ip_address?: string | null;
  }
): AuditLogEntry {
  return {
    user_id: userId,
    action: options?.forced ? 'conflict_force_moved' : 'shift_moved',
    entity_type: 'shift',
    entity_id: shiftId,
    changes: {
      from: {
        date: previousState.date,
        start_time: previousState.start_time,
        end_time: previousState.end_time,
        ...(previousState.employee_name && { employee: previousState.employee_name }),
      },
      to: {
        date: newState.date,
        start_time: newState.start_time,
        end_time: newState.end_time,
      },
      ...(options?.forced && { force_move: true }),
    },
    ip_address: options?.ip_address || undefined,
  };
}
