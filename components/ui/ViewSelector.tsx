'use client';

import { SchedulePeriodType } from '@/types';
import { Calendar, CalendarDays, CalendarRange, Star } from 'lucide-react';

interface ViewSelectorProps {
  view: SchedulePeriodType;
  onViewChange: (view: SchedulePeriodType) => void;
}

export function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  const views: { value: SchedulePeriodType; label: string; icon: React.ReactNode }[] = [
    { value: 'week', label: 'Week', icon: <Calendar className="w-4 h-4" /> },
    { value: 'month', label: 'Month', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'quarter', label: 'Quarter', icon: <CalendarRange className="w-4 h-4" /> },
    { value: 'special_event', label: 'Event', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="inline-flex bg-gray-100 rounded-md p-1">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onViewChange(v.value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            view === v.value
              ? 'bg-white text-[#FF6600] shadow-sm font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {v.icon}
          <span className="text-sm">{v.label}</span>
        </button>
      ))}
    </div>
  );
}

