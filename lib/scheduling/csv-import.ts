import { createClient } from '@/lib/supabase/client';
import { CSVImportRow } from '@/types';
import { parse } from 'csv-parse/sync';
import { format, parse as parseDate } from 'date-fns';

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): CSVImportRow[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row: any) => ({
    date: row.date || row.Date,
    start_time: row.start_time || row['Start Time'],
    end_time: row.end_time || row['End Time'],
    staff_name: row.staff_name || row['Staff Name'] || row.Name,
    staff_email: row.staff_email || row['Staff Email'] || row.Email,
    role: row.role || row.Role,
    bureau: row.bureau || row.Bureau || row.Department,
  }));
}

/**
 * Seed database from CSV data
 */
export async function seedFromCSV(data: CSVImportRow[], bureauId: string) {
  const supabase = await createClient();
  const results = {
    users: 0,
    shifts: 0,
    assignments: 0,
    errors: [] as string[],
  };

  try {
    // Group by unique users
    const uniqueUsers = new Map<string, CSVImportRow>();
    data.forEach((row) => {
      if (row.staff_email && !uniqueUsers.has(row.staff_email)) {
        uniqueUsers.set(row.staff_email, row);
      }
    });

    // Insert users
    for (const [email, row] of uniqueUsers) {
      const { error } = await supabase.from('users').upsert(
        {
          email,
          full_name: row.staff_name,
          role: 'staff',
          shift_role: normalizeRole(row.role),
          bureau_id: bureauId,
        },
        {
          onConflict: 'email',
        }
      );

      if (error) {
        results.errors.push(`User ${email}: ${error.message}`);
      } else {
        results.users++;
      }
    }

    // Get user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', Array.from(uniqueUsers.keys()));

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const userMap = new Map(users?.map((u) => [u.email, u.id]) || []);

    // Group by shifts (date + time)
    const shiftMap = new Map<string, CSVImportRow[]>();
    data.forEach((row) => {
      const key = `${row.date}_${row.start_time}_${row.end_time}`;
      const existing = shiftMap.get(key) || [];
      existing.push(row);
      shiftMap.set(key, existing);
    });

    // Insert shifts and assignments
    for (const [key, rows] of shiftMap) {
      const firstRow = rows[0];

      // Parse date and time
      const shiftDate = parseDate(firstRow.date, 'yyyy-MM-dd', new Date());
      const [startHour, startMin] = firstRow.start_time.split(':');
      const [endHour, endMin] = firstRow.end_time.split(':');

      const startTime = new Date(shiftDate);
      startTime.setHours(parseInt(startHour), parseInt(startMin));

      const endTime = new Date(shiftDate);
      endTime.setHours(parseInt(endHour), parseInt(endMin));

      // Create shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          bureau_id: bureauId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          required_staff: rows.length,
          status: 'draft',
        })
        .select()
        .single();

      if (shiftError) {
        results.errors.push(`Shift ${key}: ${shiftError.message}`);
        continue;
      }

      results.shifts++;

      // Create assignments
      for (const row of rows) {
        const userId = userMap.get(row.staff_email);
        if (!userId) {
          results.errors.push(`User not found: ${row.staff_email}`);
          continue;
        }

        const { error: assignError } = await supabase.from('shift_assignments').insert({
          shift_id: shift.id,
          user_id: userId,
          status: 'assigned',
          assigned_by: 'system',
        });

        if (assignError) {
          results.errors.push(`Assignment ${row.staff_email} to ${key}: ${assignError.message}`);
        } else {
          results.assignments++;
        }
      }
    }

    return results;
  } catch (error) {
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return results;
  }
}

/**
 * Normalize role name from CSV
 */
function normalizeRole(role: string): 'senior' | 'junior' | 'lead' | 'support' {
  const normalized = role.toLowerCase().trim();

  if (normalized.includes('senior') || normalized.includes('sr')) {
    return 'senior';
  }
  if (normalized.includes('lead') || normalized.includes('supervisor')) {
    return 'lead';
  }
  if (normalized.includes('junior') || normalized.includes('jr')) {
    return 'junior';
  }
  return 'support';
}

/**
 * Export shifts to CSV
 */
export function exportToCSV(shifts: any[], assignments: any[], users: any[]): string {
  const rows: string[] = [];

  // Header
  rows.push('Date,Start Time,End Time,Staff Name,Staff Email,Role,Status');

  // Data
  for (const shift of shifts) {
    const shiftAssignments = assignments.filter((a) => a.shift_id === shift.id);

    if (shiftAssignments.length === 0) {
      // Empty shift
      const startDate = new Date(shift.start_time);
      rows.push(
        [
          format(startDate, 'yyyy-MM-dd'),
          format(startDate, 'HH:mm'),
          format(new Date(shift.end_time), 'HH:mm'),
          'UNASSIGNED',
          '',
          '',
          shift.status,
        ].join(',')
      );
    } else {
      // Assigned shifts
      for (const assignment of shiftAssignments) {
        const user = users.find((u) => u.id === assignment.user_id);
        const startDate = new Date(shift.start_time);

        rows.push(
          [
            format(startDate, 'yyyy-MM-dd'),
            format(startDate, 'HH:mm'),
            format(new Date(shift.end_time), 'HH:mm'),
            user?.full_name || 'Unknown',
            user?.email || '',
            user?.shift_role || '',
            assignment.status,
          ].join(',')
        );
      }
    }
  }

  return rows.join('\n');
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  const rows = [
    'date,start_time,end_time,staff_name,staff_email,role,bureau',
    '2025-11-01,09:00,17:00,John Doe,john@example.com,senior,Main Office',
    '2025-11-01,09:00,17:00,Jane Smith,jane@example.com,junior,Main Office',
    '2025-11-01,17:00,01:00,Bob Johnson,bob@example.com,lead,Main Office',
  ];

  return rows.join('\n');
}
