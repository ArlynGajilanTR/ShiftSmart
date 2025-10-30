'use client';

import { Conflict, User, Shift } from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ConflictPanelProps {
  conflicts: Conflict[];
  users: User[];
  shifts: Shift[];
}

export function ConflictPanel({ conflicts, users, shifts }: ConflictPanelProps) {
  const hardConflicts = conflicts.filter(c => c.severity === 'hard');
  const softConflicts = conflicts.filter(c => c.severity === 'soft');

  const getConflictUser = (conflict: Conflict) => {
    return users.find(u => u.id === conflict.user_id);
  };

  const getConflictShift = (conflict: Conflict) => {
    return shifts.find(s => s.id === conflict.shift_id);
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'double_booking':
      case 'rest_period_violation':
      case 'skill_gap':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'role_imbalance':
      case 'insufficient_coverage':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'preference_violation':
      case 'overtime_risk':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-24">
      <h3 className="font-semibold text-lg mb-4">Scheduling Status</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-700" />
            <span className="text-xs font-medium text-red-700">Hard Conflicts</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{hardConflicts.length}</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-700" />
            <span className="text-xs font-medium text-yellow-700">Soft Warnings</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{softConflicts.length}</div>
        </div>
      </div>

      {/* No Conflicts */}
      {conflicts.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <div className="font-medium text-green-900">All Clear!</div>
            <div className="text-sm text-green-700">No conflicts detected</div>
          </div>
        </div>
      )}

      {/* Conflict List */}
      {conflicts.length > 0 && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {hardConflicts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                Critical Issues ({hardConflicts.length})
              </h4>
              {hardConflicts.map((conflict) => {
                const user = getConflictUser(conflict);
                const shift = getConflictShift(conflict);
                return (
                  <div
                    key={conflict.id}
                    className={`p-3 rounded-lg border mb-2 ${getConflictTypeColor(conflict.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                          {conflict.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm mb-1">{conflict.message}</div>
                        {user && (
                          <div className="text-xs opacity-75">{user.full_name}</div>
                        )}
                        {shift && (
                          <div className="text-xs opacity-75">
                            {format(parseISO(shift.start_time), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {softConflicts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                Warnings ({softConflicts.length})
              </h4>
              {softConflicts.map((conflict) => {
                const user = getConflictUser(conflict);
                const shift = getConflictShift(conflict);
                return (
                  <div
                    key={conflict.id}
                    className={`p-3 rounded-lg border mb-2 ${getConflictTypeColor(conflict.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                          {conflict.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm mb-1">{conflict.message}</div>
                        {user && (
                          <div className="text-xs opacity-75">{user.full_name}</div>
                        )}
                        {shift && (
                          <div className="text-xs opacity-75">
                            {format(parseISO(shift.start_time), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

