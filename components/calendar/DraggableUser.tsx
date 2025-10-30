'use client';

import { useDraggable } from '@dnd-kit/core';
import { User } from '@/types';
import { GripVertical } from 'lucide-react';

interface DraggableUserProps {
  user: User;
  isAssigned: boolean;
  assignmentCount: number;
}

export function DraggableUser({ user, isAssigned, assignmentCount }: DraggableUserProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: user.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

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
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition ${
        isDragging
          ? 'opacity-50 scale-95'
          : 'hover:border-indigo-300 hover:shadow-md'
      } ${
        isAssigned
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{user.full_name}</div>
        <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${getRoleBadgeColor(user.shift_role)}`}>
          {user.shift_role}
        </span>
      </div>

      {isAssigned && (
        <div className="flex-shrink-0 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
          {assignmentCount}
        </div>
      )}
    </div>
  );
}

