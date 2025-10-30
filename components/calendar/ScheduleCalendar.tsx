'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Shift, User, ShiftAssignment, Conflict } from '@/types';
import { format, parseISO } from 'date-fns';
import { DroppableShift } from './DroppableShift';
import { DraggableUser } from './DraggableUser';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ScheduleCalendarProps {
  shifts: Shift[];
  users: User[];
  assignments: ShiftAssignment[];
  conflicts: Conflict[];
  onAssignUser: (shiftId: string, userId: string) => void;
  onUnassignUser: (assignmentId: string) => void;
}

export function ScheduleCalendar({
  shifts,
  users,
  assignments,
  conflicts,
  onAssignUser,
  onUnassignUser
}: ScheduleCalendarProps) {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [hoveredShift, setHoveredShift] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const userId = event.active.id as string;
    const user = users.find(u => u.id === userId);
    setActiveUser(user || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const userId = active.id as string;
      const shiftId = over.id as string;
      
      // Check if it's a shift (not unassignment)
      if (shifts.some(s => s.id === shiftId)) {
        onAssignUser(shiftId, userId);
      }
    }

    setActiveUser(null);
    setHoveredShift(null);
  };

  const getShiftConflicts = (shiftId: string) => {
    return conflicts.filter(c => c.shift_id === shiftId);
  };

  const getShiftAssignments = (shiftId: string) => {
    return assignments.filter(a => a.shift_id === shiftId);
  };

  const getUserForAssignment = (assignment: ShiftAssignment) => {
    return users.find(u => u.id === assignment.user_id);
  };

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = format(parseISO(shift.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Available Staff Panel */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-lg mb-4">Available Staff</h3>
          <div className="space-y-2">
            {users.map(user => {
              const userAssignments = assignments.filter(a => a.user_id === user.id);
              const isAssigned = userAssignments.length > 0;
              
              return (
                <DraggableUser
                  key={user.id}
                  user={user}
                  isAssigned={isAssigned}
                  assignmentCount={userAssignments.length}
                />
              );
            })}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {Object.entries(shiftsByDate).map(([date, dateShifts]) => (
              <div key={date} className="border-b pb-6 last:border-b-0">
                <h3 className="font-semibold text-lg mb-4">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                
                <div className="space-y-3">
                  {dateShifts.map(shift => {
                    const shiftAssignments = getShiftAssignments(shift.id);
                    const shiftConflicts = getShiftConflicts(shift.id);
                    const hardConflicts = shiftConflicts.filter(c => c.severity === 'hard');
                    const softConflicts = shiftConflicts.filter(c => c.severity === 'soft');

                    return (
                      <DroppableShift
                        key={shift.id}
                        shift={shift}
                        assignments={shiftAssignments}
                        users={users}
                        isHovered={hoveredShift === shift.id}
                        onHover={() => setHoveredShift(shift.id)}
                        onUnassign={onUnassignUser}
                      >
                        {/* Conflict Indicators */}
                        {(hardConflicts.length > 0 || softConflicts.length > 0) && (
                          <div className="mt-2 space-y-1">
                            {hardConflicts.map(conflict => (
                              <div
                                key={conflict.id}
                                className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded"
                              >
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{conflict.message}</span>
                              </div>
                            ))}
                            {softConflicts.map(conflict => (
                              <div
                                key={conflict.id}
                                className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded"
                              >
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{conflict.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </DroppableShift>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeUser && (
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="font-medium">{activeUser.full_name}</div>
            <div className="text-xs opacity-90">{activeUser.shift_role}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

