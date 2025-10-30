'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shift, User, ShiftAssignment, Conflict, SchedulePeriodType, Bureau } from '@/types';
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar';
import { ViewSelector } from '@/components/ui/ViewSelector';
import { BureauToggle } from '@/components/ui/BureauToggle';
import { ConflictPanel } from '@/components/ui/ConflictPanel';
import { validateShiftAssignment, validateRoleBalance } from '@/lib/validation/conflicts';
import { getDateRangeForPeriod } from '@/lib/scheduling/scheduler';
import { format, addWeeks, addMonths, addQuarters, subWeeks, subMonths, subQuarters } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Upload, Save } from 'lucide-react';

export default function DashboardPage() {
  const [view, setView] = useState<SchedulePeriodType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBureau, setSelectedBureau] = useState<string>('');
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBureau) {
      loadScheduleData();
    }
  }, [selectedBureau, view, currentDate]);

  async function loadInitialData() {
    try {
      // Load bureaus
      const { data: bureauData } = await supabase
        .from('bureaus')
        .select('*')
        .order('name');

      setBureaus(bureauData || []);

      // Get selected bureau from session or use first
      const storedBureau = sessionStorage.getItem('selectedBureau');
      if (storedBureau) {
        setSelectedBureau(storedBureau);
      } else if (bureauData && bureauData.length > 0) {
        setSelectedBureau(bureauData[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadScheduleData() {
    setLoading(true);
    try {
      const dateRange = getDateRangeForPeriod(
        { type: view } as any,
        currentDate
      );

      // Load users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('bureau_id', selectedBureau)
        .eq('active', true);

      setUsers(userData || []);

      // Load shifts
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .eq('bureau_id', selectedBureau)
        .gte('start_time', dateRange.startDate.toISOString())
        .lte('end_time', dateRange.endDate.toISOString())
        .order('start_time');

      setShifts(shiftData || []);

      // Load assignments
      if (shiftData && shiftData.length > 0) {
        const shiftIds = shiftData.map(s => s.id);
        const { data: assignmentData } = await supabase
          .from('shift_assignments')
          .select('*')
          .in('shift_id', shiftIds);

        setAssignments(assignmentData || []);

        // Load conflicts
        const { data: conflictData } = await supabase
          .from('conflicts')
          .select('*')
          .in('shift_id', shiftIds)
          .eq('resolved', false);

        setConflicts(conflictData || []);
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignUser(shiftId: string, userId: string) {
    const shift = shifts.find(s => s.id === shiftId);
    const user = users.find(u => u.id === userId);

    if (!shift || !user) return;

    // Validate assignment
    const validation = await validateShiftAssignment(
      shift,
      user,
      assignments,
      shifts
    );

    // Create assignment
    const newAssignment: ShiftAssignment = {
      id: crypto.randomUUID(),
      shift_id: shiftId,
      user_id: userId,
      status: 'assigned',
      assigned_by: 'current-user', // TODO: Get from auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAssignments([...assignments, newAssignment]);

    // Add new conflicts
    if (validation.conflicts.length > 0) {
      setConflicts([...conflicts, ...validation.conflicts]);
    }

    // Validate role balance
    const updatedAssignments = [...assignments, newAssignment];
    const roleConflicts = validateRoleBalance(shift, updatedAssignments, users);
    if (roleConflicts.length > 0) {
      setConflicts([...conflicts, ...validation.conflicts, ...roleConflicts]);
    }
  }

  async function handleUnassignUser(assignmentId: string) {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    
    // Re-validate conflicts
    // TODO: Recalculate conflicts after removal
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save assignments to database
      for (const assignment of assignments) {
        await supabase.from('shift_assignments').upsert(assignment);
      }

      // Save conflicts
      for (const conflict of conflicts) {
        await supabase.from('conflicts').upsert(conflict);
      }

      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule');
    } finally {
      setSaving(false);
    }
  }

  function navigatePeriod(direction: 'prev' | 'next') {
    const delta = direction === 'next' ? 1 : -1;
    
    switch (view) {
      case 'week':
        setCurrentDate(addWeeks(currentDate, delta));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, delta));
        break;
      case 'quarter':
        setCurrentDate(addQuarters(currentDate, delta));
        break;
    }
  }

  const dateRange = getDateRangeForPeriod({ type: view } as any, currentDate);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ShiftSmart</h1>
              <p className="text-sm text-gray-500">Reuters Editorial Scheduling</p>
            </div>

            <div className="flex items-center gap-4">
              <BureauToggle
                bureaus={bureaus}
                selectedBureau={selectedBureau}
                onSelectBureau={setSelectedBureau}
              />

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white px-4 py-2 rounded-md transition disabled:opacity-50 font-medium"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigatePeriod('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-lg font-semibold">
                {format(dateRange.startDate, 'MMM d')} - {format(dateRange.endDate, 'MMM d, yyyy')}
              </div>

              <button
                onClick={() => navigatePeriod('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm text-[#FF6600] hover:text-[#E65C00] font-medium transition"
              >
                Today
              </button>
            </div>

            <ViewSelector view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <ScheduleCalendar
              shifts={shifts}
              users={users}
              assignments={assignments}
              conflicts={conflicts}
              onAssignUser={handleAssignUser}
              onUnassignUser={handleUnassignUser}
            />
          </div>

          <div className="xl:col-span-1">
            <ConflictPanel conflicts={conflicts} users={users} shifts={shifts} />
          </div>
        </div>
      </div>
    </div>
  );
}

