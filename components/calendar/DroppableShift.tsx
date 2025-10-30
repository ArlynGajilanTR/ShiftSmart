'use client';

import { useDroppable } from '@dnd-kit/core';
import { Shift, ShiftAssignment, User } from '@/types';
import { format, parseISO } from 'date-fns';
import { Clock, Users, X } from 'lucide-react';

interface DroppableShiftProps {
  shift: Shift;
  assignments: ShiftAssignment[];
  users: User[];
  isHovered: boolean;
  onHover: () => void;
  onUnassign: (assignmentId: string) => void;
  children?: React.ReactNode;
}

export function DroppableShift({
  shift,
  assignments,
  users,
  isHovered,
  onHover,
  onUnassign,
  children
}: DroppableShiftProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: shift.id,
  });

  const assignedUsers = assignments
    .map(a => users.find(u => u.id === a.user_id))
    .filter(Boolean) as User[];

  const isFull = assignments.length >= shift.required_staff;
  const isEmpty = assignments.length === 0;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'junior': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={onHover}
      className={`border-2 rounded-lg p-4 transition-all ${
        isOver
          ? 'border-[#FF6600] bg-orange-50 scale-[1.02]'
          : isEmpty
          ? 'border-gray-200 bg-gray-50'
          : isFull
          ? 'border-green-300 bg-green-50'
          : 'border-yellow-300 bg-yellow-50'
      }`}
    >
      {/* Shift Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4" />
          <span className="font-medium">
            {format(parseISO(shift.start_time), 'h:mm a')} -{' '}
            {format(parseISO(shift.end_time), 'h:mm a')}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          <span className={`font-medium ${
            isFull ? 'text-green-700' : isEmpty ? 'text-gray-500' : 'text-yellow-700'
          }`}>
            {assignments.length} / {shift.required_staff}
          </span>
        </div>
      </div>

      {/* Assigned Users */}
      {assignedUsers.length > 0 ? (
        <div className="space-y-2">
          {assignedUsers.map((user, idx) => {
            const assignment = assignments[idx];
            return (
              <div
                key={user.id}
                className="flex items-center justify-between bg-white p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF6600] font-semibold text-sm">
                    {user.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{user.full_name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(user.shift_role)}`}>
                      {user.shift_role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUnassign(assignment.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-600 transition"
                  title="Remove assignment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed rounded">
          Drop staff here to assign
        </div>
      )}

      {/* Children (conflicts, etc.) */}
      {children}
    </div>
  );
}

