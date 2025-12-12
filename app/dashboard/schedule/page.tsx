'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Sparkles,
  Clock,
  Sunrise,
  Sun,
  Moon,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  Building2,
  CheckCircle,
  User,
  Filter,
  X,
} from 'lucide-react';
import {
  Filters,
  type Filter as FilterType,
  type FilterFieldConfig,
} from '@/components/ui/filters';
import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  addWeeks,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

function DraggableShift({
  shift,
  view = 'week',
  justMoved = false,
}: {
  shift: any;
  view?: string;
  justMoved?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shift-${shift.id}`,
    data: { shift },
  });

  // When dragging, hide the original card (we show DragOverlay instead)
  // When not dragging, show the card normally
  const style: React.CSSProperties = isDragging ? { opacity: 0, pointerEvents: 'none' } : {};

  // CSS classes for animations
  const settleClass = justMoved ? 'shift-dropped' : '';
  const draggingClass = isDragging ? 'is-dragging' : '';

  // Placeholder component - shown when card is being dragged
  if (isDragging) {
    return (
      <div className="relative">
        {/* Ghost placeholder showing where card was */}
        <div
          className={`drag-placeholder min-h-[60px] ${view === 'month' ? 'min-h-[40px]' : ''}`}
          style={{
            height: view === 'month' ? '40px' : '72px',
            opacity: 0.6,
          }}
        />
        {/* Hidden original for ref */}
        <div
          ref={setNodeRef}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          {...attributes}
        />
      </div>
    );
  }

  if (view === 'month') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        data-testid="draggable-shift"
        data-shift-id={shift.id}
        tabIndex={0}
        role="button"
        aria-roledescription="draggable shift"
        aria-describedby={`shift-${shift.id}-instructions`}
        className={`draggable-shift-card bg-white border border-primary/20 rounded px-1.5 py-1 text-[10px] cursor-grab active:cursor-grabbing shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settleClass} ${draggingClass}`}
      >
        <span id={`shift-${shift.id}-instructions`} className="sr-only">
          Press Space or Enter to pick up. Use arrow keys to move. Press Space or Enter to drop.
        </span>
        <div className="flex items-center gap-1">
          <GripVertical className="h-2 w-2 text-muted-foreground flex-shrink-0 opacity-40" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate text-foreground">
              {shift.employee.split(' ')[0]}
            </div>
            <div className="text-muted-foreground truncate">{shift.startTime}</div>
          </div>
        </div>
      </div>
    );
  }

  // Default view (used for week, today, and other views)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid="draggable-shift"
      data-shift-id={shift.id}
      tabIndex={0}
      role="button"
      aria-roledescription="draggable shift"
      aria-describedby={`shift-${shift.id}-instructions`}
      className={`draggable-shift-card bg-white border border-primary/20 rounded-lg p-2.5 text-xs cursor-grab active:cursor-grabbing shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settleClass} ${draggingClass}`}
    >
      <span id={`shift-${shift.id}-instructions`} className="sr-only">
        Press Space or Enter to pick up. Use arrow keys to move. Press Space or Enter to drop.
      </span>
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 group-hover:text-muted-foreground transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-foreground">{shift.employee}</div>
          <div className="text-muted-foreground mt-0.5">
            {shift.startTime} - {shift.endTime}
          </div>
          <Badge variant="secondary" className="mt-1.5 text-[10px] h-4">
            {shift.bureau}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function DroppableDay({
  date,
  children,
  isActive,
}: {
  date: Date;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(date, 'yyyy-MM-dd')}`,
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      data-testid="droppable-day"
      data-date={format(date, 'yyyy-MM-dd')}
      className={`droppable-zone border rounded-lg p-3 min-h-[200px] bg-white ${
        isOver ? 'droppable-receiving border-primary' : 'border-border'
      } ${isActive ? 'ring-1 ring-primary/30' : ''}`}
    >
      {children}
    </div>
  );
}

function DroppableMonthDay({
  day,
  children,
  isCurrentMonth,
}: {
  day: Date | null;
  children: React.ReactNode;
  isCurrentMonth?: boolean;
}) {
  const stableId = React.useId();
  const { setNodeRef, isOver } = useDroppable({
    id: day ? `day-${format(day, 'yyyy-MM-dd')}` : `empty-${stableId}`,
    data: { date: day },
    disabled: !day,
  });

  if (!day) {
    return <div className="border border-border/50 rounded-lg p-2 min-h-[120px] bg-muted/10" />;
  }

  return (
    <div
      ref={setNodeRef}
      data-testid="droppable-day"
      data-date={format(day, 'yyyy-MM-dd')}
      className={`droppable-zone border rounded-lg p-2 min-h-[120px] ${
        !isCurrentMonth
          ? 'bg-muted/20 text-muted-foreground border-border/50'
          : 'bg-white border-border'
      } ${isOver ? 'droppable-receiving border-primary' : ''}`}
    >
      {children}
    </div>
  );
}

// Time slot definitions for Today view - enables moving shifts between time periods
const TIME_SLOTS = {
  morning: { label: 'Morning', start: '06:00', end: '12:00' },
  afternoon: { label: 'Afternoon', start: '12:00', end: '18:00' },
  evening: { label: 'Evening/Night', start: '18:00', end: '23:59' },
} as const;

type TimeSlotKey = keyof typeof TIME_SLOTS;

function DroppableTimeSlot({
  date,
  slot,
  children,
}: {
  date: Date;
  slot: TimeSlotKey;
  children: React.ReactNode;
}) {
  const slotConfig = TIME_SLOTS[slot];
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${format(date, 'yyyy-MM-dd')}-${slot}`,
    data: {
      date,
      slot,
      startTime: slotConfig.start,
      endTime: slotConfig.end,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-testid="droppable-timeslot"
      data-slot={slot}
      className={`droppable-zone rounded-xl p-4 border ${
        isOver
          ? 'droppable-receiving border-primary'
          : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/60'
      }`}
    >
      {children}
    </div>
  );
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentQuarter, setCurrentQuarter] = useState(new Date());
  const [activeShift, setActiveShift] = useState<any>(null);

  // State for announcements (accessibility)
  const [announcement, setAnnouncement] = useState('');

  // Move history for undo functionality
  interface MoveHistoryEntry {
    shiftId: string;
    previousDate: string;
    previousStartTime: string;
    previousEndTime: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    timestamp: number;
  }

  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);
  const MAX_HISTORY = 10; // Keep last 10 moves
  const [isUndoing, setIsUndoing] = useState(false);

  // AI Schedule Generation state
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [generationConfig, setGenerationConfig] = useState({
    start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    type: 'month' as 'week' | 'month' | 'quarter',
    bureau: 'both' as 'Milan' | 'Rome' | 'both',
    preserve_existing: false,
  });

  // User permission state for schedule generation
  const [canGenerateSchedule, setCanGenerateSchedule] = useState(false);
  const [unconfirmedPrefsCount, setUnconfirmedPrefsCount] = useState(0);

  // Edit/Delete state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag-drop conflict confirmation state
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    shiftId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    shift: any;
    conflicts: any[];
  } | null>(null);
  const [isForceMoving, setIsForceMoving] = useState(false);

  // State for time change confirmation
  const [isTimeChangeDialogOpen, setIsTimeChangeDialogOpen] = useState(false);
  const [pendingTimeChange, setPendingTimeChange] = useState<{
    shiftId: string;
    shift: any;
    newDate: string;
    suggestedStartTime: string;
    suggestedEndTime: string;
  } | null>(null);

  // Track recently moved shifts for settle animation
  const [recentlyMovedShiftId, setRecentlyMovedShiftId] = useState<string | null>(null);

  // Navigation state for Today and Week views
  const [currentDay, setCurrentDay] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Animation state for smooth transitions
  const [dayAnimationKey, setDayAnimationKey] = useState(0);
  const [dayAnimationDirection, setDayAnimationDirection] = useState<'next' | 'prev' | null>(null);
  const [weekAnimationKey, setWeekAnimationKey] = useState(0);
  const [weekAnimationDirection, setWeekAnimationDirection] = useState<'next' | 'prev' | null>(
    null
  );
  const [monthAnimationKey, setMonthAnimationKey] = useState(0);
  const [monthAnimationDirection, setMonthAnimationDirection] = useState<'next' | 'prev' | null>(
    null
  );
  const [quarterAnimationKey, setQuarterAnimationKey] = useState(0);
  const [quarterAnimationDirection, setQuarterAnimationDirection] = useState<
    'next' | 'prev' | null
  >(null);

  // Navigation handlers with animation triggers
  const navigateDay = (direction: 'next' | 'prev') => {
    setDayAnimationDirection(direction);
    setDayAnimationKey((prev) => prev + 1);
    setCurrentDay((prev) => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const navigateToToday = () => {
    setDayAnimationDirection('next');
    setDayAnimationKey((prev) => prev + 1);
    setCurrentDay(new Date());
  };

  const navigateWeek = (direction: 'next' | 'prev') => {
    setWeekAnimationDirection(direction);
    setWeekAnimationKey((prev) => prev + 1);
    setCurrentWeek((prev) => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const navigateToThisWeek = () => {
    setWeekAnimationDirection('next');
    setWeekAnimationKey((prev) => prev + 1);
    setCurrentWeek(new Date());
  };

  const navigateMonth = (direction: 'next' | 'prev') => {
    setMonthAnimationDirection(direction);
    setMonthAnimationKey((prev) => prev + 1);
    setCurrentMonth((prev) => addMonths(prev, direction === 'next' ? 1 : -1));
  };

  const navigateToThisMonth = () => {
    setMonthAnimationDirection('next');
    setMonthAnimationKey((prev) => prev + 1);
    setCurrentMonth(new Date());
  };

  const navigateQuarter = (direction: 'next' | 'prev') => {
    setQuarterAnimationDirection(direction);
    setQuarterAnimationKey((prev) => prev + 1);
    setCurrentQuarter((prev) => addMonths(prev, direction === 'next' ? 3 : -3));
  };

  const navigateToThisQuarter = () => {
    setQuarterAnimationDirection('next');
    setQuarterAnimationKey((prev) => prev + 1);
    setCurrentQuarter(new Date());
  };

  // Helper to get animation class
  const getAnimationClass = (direction: 'next' | 'prev' | null) => {
    if (direction === 'next') return 'schedule-slide-next';
    if (direction === 'prev') return 'schedule-slide-prev';
    return '';
  };

  // DEV ONLY: Reset schedule state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Filter state - using inline Filters component
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  // Fetch employees for filter dropdown
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await api.employees.list();
        setEmployeeList(response.employees || []);
      } catch (error) {
        console.error('Failed to fetch employees for filter:', error);
      }
    }
    fetchEmployees();
  }, []);

  // Fetch user permissions and unconfirmed preferences count
  useEffect(() => {
    async function fetchUserAndPrefs() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Fetch current user permissions
        const { user } = await api.users.getProfile();
        // User can generate if admin or team_leader
        setCanGenerateSchedule(user.role === 'admin' || user.is_team_leader === true);

        // Fetch unconfirmed preferences count
        const prefsResponse = await fetch('/api/team/availability', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          setUnconfirmedPrefsCount(
            (prefsData.stats?.pending || 0) + (prefsData.stats?.missing || 0)
          );
        }
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      }
    }
    fetchUserAndPrefs();
  }, []);

  // Filter field configurations
  const filterFields: FilterFieldConfig[] = [
    {
      key: 'bureau',
      label: 'Bureau',
      icon: <Building2 className="h-3.5 w-3.5" />,
      options: [
        { value: 'Milan', label: 'Milan' },
        { value: 'Rome', label: 'Rome' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      options: [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'pending', label: 'Pending' },
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    {
      key: 'shiftType',
      label: 'Shift Type',
      icon: <Clock className="h-3.5 w-3.5" />,
      options: [
        {
          value: 'morning',
          label: 'Morning (6AM-12PM)',
          icon: <Sunrise className="h-3.5 w-3.5" />,
        },
        {
          value: 'afternoon',
          label: 'Afternoon (12PM-6PM)',
          icon: <Sun className="h-3.5 w-3.5" />,
        },
        { value: 'evening', label: 'Evening (6PM-6AM)', icon: <Moon className="h-3.5 w-3.5" /> },
      ],
    },
    {
      key: 'employee',
      label: 'Employee',
      icon: <User className="h-3.5 w-3.5" />,
      options: employeeList.map((emp) => ({
        value: emp.id,
        label: emp.name,
      })),
    },
  ];

  // Apply filters to shifts
  const filteredShifts = shifts.filter((shift) => {
    for (const filter of activeFilters) {
      if (filter.field === 'bureau' && shift.bureau !== filter.value) {
        return false;
      }
      if (filter.field === 'status' && shift.status !== filter.value) {
        return false;
      }
      if (filter.field === 'shiftType') {
        const hour = parseInt(shift.startTime?.split(':')[0] || '0');
        if (filter.value === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (filter.value === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (filter.value === 'evening' && hour >= 6 && hour < 18) return false;
      }
      if (filter.field === 'employee' && shift.employee_id !== filter.value) {
        return false;
      }
    }
    return true;
  });

  // Check if running on localhost (dev mode)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      setIsLocalhost(host.includes('localhost') || host.includes('127.0.0.1'));
    }
  }, []);

  // DEV ONLY: Reset all shifts
  const handleResetSchedule = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/shifts/reset', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset schedule');
      }

      toast({
        title: 'Schedule reset',
        description: 'All shifts have been deleted. Ready for fresh testing.',
      });

      setIsResetDialogOpen(false);
      setShifts([]);
    } catch (error: any) {
      toast({
        title: 'Failed to reset schedule',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch shifts from API
  const refetchShifts = async () => {
    try {
      const response = await api.shifts.list({
        start_date: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
      });

      // Defensive check: ensure shifts array exists and filter invalid entries
      const shiftsArray = response?.shifts || [];
      const shiftData = shiftsArray
        .filter((shift: any) => shift && (shift.date || shift.start_time))
        .map((shift: any) => ({
          id: shift.id,
          employee: shift.employee || shift.users?.full_name || 'Unassigned',
          employee_id: shift.employee_id || null,
          role: shift.role || shift.users?.title || shift.users?.shift_role || 'Unknown',
          bureau: shift.bureau || shift.bureaus?.name || 'Milan',
          date: new Date(shift.date || shift.start_time),
          startTime:
            shift.startTime ||
            (shift.start_time ? format(new Date(shift.start_time), 'HH:mm') : '00:00'),
          endTime:
            shift.endTime || (shift.end_time ? format(new Date(shift.end_time), 'HH:mm') : '00:00'),
          status: shift.status || 'pending',
        }));

      setShifts(shiftData);
    } catch (error: any) {
      console.error('Failed to fetch shifts:', error);
      toast({
        title: 'Failed to load shifts',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      // Keep empty state - never show fake data in a scheduling app
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchShifts();
  }, []);

  // Handle delete shift
  const handleDeleteShift = async () => {
    if (!selectedShift) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/shifts/${selectedShift.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shift');
      }

      toast({
        title: 'Shift deleted',
        description: 'The shift has been successfully deleted',
      });

      setIsDeleteDialogOpen(false);
      setSelectedShift(null);
      refetchShifts();
    } catch (error: any) {
      toast({
        title: 'Failed to delete shift',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (shift: any) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (shift: any) => {
    setSelectedShift(shift);
    setIsDeleteDialogOpen(true);
  };

  // Check AI configuration when dialog opens
  useEffect(() => {
    async function checkAiStatus() {
      if (isGenerateDialogOpen && aiConfigured === null) {
        try {
          console.log('[Schedule] Checking AI configuration status...');
          const statusResponse = (await api.ai.checkStatus()) as any;
          console.log('[Schedule] AI Status Response:', statusResponse);
          setAiConfigured(statusResponse.ai_enabled);
        } catch (error: any) {
          console.error('[Schedule] Failed to check AI status:', error);
          setAiConfigured(false);
        }
      }
    }

    checkAiStatus();
  }, [isGenerateDialogOpen, aiConfigured]);

  // Handle AI schedule generation
  const handleGenerateSchedule = async () => {
    console.log('[Schedule] Generate button clicked', generationConfig);
    setIsGenerating(true);

    try {
      // First check if AI is configured
      console.log('[Schedule] Checking AI status...');
      const statusResponse = (await api.ai.checkStatus()) as any;
      console.log('[Schedule] AI Status:', statusResponse);

      if (!statusResponse.ai_enabled) {
        toast({
          title: 'AI Not Configured',
          description:
            statusResponse.configuration_status ||
            'Please set ANTHROPIC_API_KEY environment variable and restart the server.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      console.log('[Schedule] Calling AI generate schedule...');
      const response = (await api.ai.generateSchedule({
        start_date: generationConfig.start_date,
        end_date: generationConfig.end_date,
        type: generationConfig.type,
        bureau: generationConfig.bureau,
        preserve_existing: generationConfig.preserve_existing,
        save_to_database: false, // Preview mode
      })) as any;

      console.log('[Schedule] AI Response:', response);

      if (!response.schedule || !response.schedule.shifts) {
        throw new Error('Invalid response from AI: missing schedule data');
      }

      setGeneratedSchedule(response.schedule);
      setShowPreview(true);
      toast({
        title: 'Schedule generated successfully',
        description: `Generated ${response.schedule.shifts.length} shifts`,
      });
    } catch (error: any) {
      console.error('[Schedule] Failed to generate schedule:', error);

      // Handle specific error messages
      let errorMessage = error.message || 'Failed to generate schedule';
      let errorTitle = 'Generation Failed';
      let showDebugOption = false;

      if (error.message?.includes('not configured') || error.message?.includes('API key')) {
        errorTitle = 'AI Not Configured';
        errorMessage =
          'AI scheduling requires ANTHROPIC_API_KEY. Please contact your administrator to configure it.';
      } else if (
        error.message?.includes('No employees found') ||
        error.message?.includes('No authentication token')
      ) {
        errorMessage = error.message;
      } else if (error.message?.includes('Unauthorized')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Please log out and log back in.';
      } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
        errorTitle = 'AI Response Error';
        errorMessage =
          'The AI generated an invalid response. This has been logged for debugging. Please try again with a different date range or fewer days.';
        showDebugOption = true;
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Request Timeout';
        errorMessage =
          'The schedule generation took too long. Try generating a shorter period (e.g., one week instead of a month).';
      } else if (error.message?.includes('rate limit')) {
        errorTitle = 'Rate Limit Exceeded';
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        action: showDebugOption ? (
          <button
            onClick={async () => {
              try {
                const debugResponse = await fetch('/api/ai/debug-last-response');
                const debugData = await debugResponse.json();
                console.log('[Debug] Last failed responses:', debugData);
                toast({
                  title: 'Debug Info',
                  description: `Retrieved ${debugData.count || 0} failed responses. Check browser console for details.`,
                });
              } catch (e) {
                console.error('[Debug] Failed to fetch debug info:', e);
              }
            }}
            className="text-xs underline"
          >
            View Debug Info
          </button>
        ) : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // State for conflict handling
  const [saveConflicts, setSaveConflicts] = useState<any[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Handle saving generated schedule to database
  const handleSaveSchedule = async (forceWithConflicts: boolean = false) => {
    if (!generatedSchedule) {
      toast({
        title: 'No schedule to save',
        description: 'Please generate a schedule first',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save the ALREADY GENERATED schedule (don't regenerate!)
      const response = (await api.ai.saveSchedule({
        schedule: generatedSchedule,
        skip_conflict_check: forceWithConflicts, // Skip check if forcing
      })) as any;

      toast({
        title: 'Schedule saved successfully',
        description: `Successfully added ${response.saved_shifts || 0} shifts to calendar${forceWithConflicts ? ' (conflicts logged for review)' : ''}`,
      });

      // Close dialog and reset state
      setIsGenerateDialogOpen(false);
      setShowPreview(false);
      setGeneratedSchedule(null);
      setSaveConflicts([]);
      setShowConflictWarning(false);

      // Refresh the calendar
      await refetchShifts();
    } catch (error: any) {
      console.error('Failed to save schedule:', error);

      // Get conflict details from error object (set by api client)
      const conflicts = error.conflicts || [];
      const conflictCount = error.conflict_count || conflicts.length;

      // Check if it's a conflict error
      if (error.message?.includes('conflict') || conflictCount > 0) {
        setSaveConflicts(conflicts);
        setShowConflictWarning(true);
        toast({
          title: 'Schedule has conflicts',
          description: `Found ${conflictCount} scheduling conflict(s). These are typically rest period violations (less than 11h between shifts). You can save anyway or regenerate.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to save schedule',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset dialog state when closing
  const handleCloseGenerateDialog = () => {
    setIsGenerateDialogOpen(false);
    setShowPreview(false);
    setGeneratedSchedule(null);
    setIsGenerating(false);
    setIsSaving(false);
    setAiConfigured(null); // Reset AI check for next time
  };

  // Custom keyboard coordinate getter for grid navigation
  const customKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
    const GRID_CELL_WIDTH = 150; // Approximate day column width
    const GRID_CELL_HEIGHT = 50; // Approximate shift height

    switch (event.code) {
      case 'ArrowRight':
        return { ...currentCoordinates, x: currentCoordinates.x + GRID_CELL_WIDTH };
      case 'ArrowLeft':
        return { ...currentCoordinates, x: currentCoordinates.x - GRID_CELL_WIDTH };
      case 'ArrowDown':
        return { ...currentCoordinates, y: currentCoordinates.y + GRID_CELL_HEIGHT };
      case 'ArrowUp':
        return { ...currentCoordinates, y: currentCoordinates.y - GRID_CELL_HEIGHT };
      default:
        return undefined;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: customKeyboardCoordinates,
    })
  );

  const weekStart = startOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay();
  const monthCalendarDays = [...Array(firstDayOfMonth).fill(null), ...monthDays];

  const quarterStart = startOfQuarter(currentQuarter);
  const quarterEnd = endOfQuarter(currentQuarter);
  const quarterMonths = [quarterStart, addMonths(quarterStart, 1), addMonths(quarterStart, 2)];

  const getShiftsForDate = (date: Date) => {
    return filteredShifts.filter(
      (shift) => format(shift.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getShiftCountForDate = (date: Date) => {
    return filteredShifts.filter(
      (shift) => format(shift.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).length;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const shift = event.active.data.current?.shift;
    setActiveShift(shift);
    setAnnouncement(`Picked up shift for ${shift?.employee}. Use arrow keys to move.`);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShift(null);

    if (!over) return;

    const shiftId = active.data.current?.shift?.id;
    const shift = active.data.current?.shift;

    // Check if dropped on a time slot (Today view - changes time, not date)
    const isTimeSlotDrop = over.id.toString().startsWith('timeslot-');

    if (isTimeSlotDrop) {
      const newDate = over.data.current?.date;
      const newStartTime = over.data.current?.startTime;
      const newEndTime = over.data.current?.endTime;

      if (shiftId && newDate) {
        const formattedDate = format(newDate, 'yyyy-MM-dd');

        // Check if shift is already in this time slot (no change needed)
        if (shift.startTime === newStartTime && shift.endTime === newEndTime) {
          return; // No change needed
        }

        try {
          // Move shift to new time slot (same date, different time)
          await api.shifts.move(shiftId, formattedDate, newStartTime, newEndTime);

          // Record move for undo
          setMoveHistory((prev) => {
            const entry: MoveHistoryEntry = {
              shiftId: String(shiftId),
              previousDate: format(shift.date, 'yyyy-MM-dd'),
              previousStartTime: shift.startTime,
              previousEndTime: shift.endTime,
              newDate: formattedDate,
              newStartTime: newStartTime,
              newEndTime: newEndTime,
              timestamp: Date.now(),
            };
            return [entry, ...prev].slice(0, MAX_HISTORY);
          });

          // Update local state with new times
          setShifts((prevShifts) =>
            prevShifts.map((s) =>
              String(s.id) === String(shiftId)
                ? { ...s, date: new Date(newDate), startTime: newStartTime, endTime: newEndTime }
                : s
            )
          );

          // Trigger settle animation
          setRecentlyMovedShiftId(String(shiftId));
          setTimeout(() => setRecentlyMovedShiftId(null), 2500);

          setAnnouncement(`Shift moved to ${over.data.current?.slot} slot`);

          toast({
            title: 'Shift moved',
            description: `Shift moved to ${TIME_SLOTS[over.data.current?.slot as TimeSlotKey]?.label} (${newStartTime} - ${newEndTime})`,
          });
        } catch (error: any) {
          // Handle conflicts
          if (
            error.message?.includes('conflicts') ||
            error.message?.includes('Move would create')
          ) {
            try {
              const validationResult = await api.shifts.validateMove(
                shiftId,
                formattedDate,
                newStartTime,
                newEndTime
              );

              if (!validationResult.valid && validationResult.conflicts?.length > 0) {
                setPendingMove({
                  shiftId,
                  newDate: formattedDate,
                  newStartTime: newStartTime,
                  newEndTime: newEndTime,
                  shift,
                  conflicts: validationResult.conflicts,
                });
                setIsConflictDialogOpen(true);
                return;
              }
            } catch (validationError) {
              console.error('Validation error:', validationError);
            }
          }

          toast({
            title: 'Failed to move shift',
            description: error.message || 'An error occurred while moving the shift',
            variant: 'destructive',
          });
        }
      }
      return;
    }

    // Day drop logic (Week/Month views - changes date)
    const newDate = over.data.current?.date;

    if (shiftId && newDate) {
      const formattedDate = format(newDate, 'yyyy-MM-dd');

      try {
        // Attempt to move via API (will return 409 if conflicts exist)
        await api.shifts.move(shiftId, formattedDate);

        // Record move for undo
        setMoveHistory((prev) => {
          const entry: MoveHistoryEntry = {
            shiftId: String(shiftId),
            previousDate: format(shift.date, 'yyyy-MM-dd'),
            previousStartTime: shift.startTime,
            previousEndTime: shift.endTime,
            newDate: formattedDate,
            newStartTime: shift.startTime,
            newEndTime: shift.endTime,
            timestamp: Date.now(),
          };
          return [entry, ...prev].slice(0, MAX_HISTORY);
        });

        // Success - update local state
        setShifts((prevShifts) =>
          prevShifts.map((s) =>
            String(s.id) === String(shiftId) ? { ...s, date: new Date(newDate) } : s
          )
        );

        // Trigger settle animation
        setRecentlyMovedShiftId(String(shiftId));
        setTimeout(() => setRecentlyMovedShiftId(null), 2500); // Clear after animation

        setAnnouncement(`Shift dropped on ${formattedDate}`);

        toast({
          title: 'Shift moved',
          description: 'Shift has been successfully moved to the new date',
        });
      } catch (error: any) {
        // Check if this is a conflict response (409)
        // The error message from apiCall includes the JSON error field
        if (error.message?.includes('conflicts') || error.message?.includes('Move would create')) {
          // Need to fetch the full conflict details
          try {
            const validationResult = await api.shifts.validateMove(
              shiftId,
              formattedDate,
              shift.startTime,
              shift.endTime
            );

            if (!validationResult.valid && validationResult.conflicts?.length > 0) {
              // Open conflict confirmation dialog
              setPendingMove({
                shiftId,
                newDate: formattedDate,
                newStartTime: shift.startTime,
                newEndTime: shift.endTime,
                shift,
                conflicts: validationResult.conflicts,
              });
              setIsConflictDialogOpen(true);
              return;
            }
          } catch (validationError) {
            // If validation also fails, show the original error
            console.error('Validation error:', validationError);
          }
        }

        // Generic error handling
        toast({
          title: 'Failed to move shift',
          description: error.message || 'An error occurred while moving the shift',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle force move (when user confirms despite conflicts)
  const handleForceMove = async () => {
    if (!pendingMove) return;

    setIsForceMoving(true);
    try {
      // Capture values before API call
      const movedShiftId = pendingMove.shiftId;
      const conflictCount = pendingMove.conflicts.length;
      const newDate = pendingMove.newDate;
      const newStartTime = pendingMove.newStartTime;
      const newEndTime = pendingMove.newEndTime;
      const originalShift = pendingMove.shift;

      // Call move with force=true to override conflict warnings
      // Use the intended times from pendingMove, not the original shift times
      await api.shifts.move(
        movedShiftId,
        newDate,
        newStartTime,
        newEndTime,
        true // force = true
      );

      // Record move for undo (Bug 2 fix: force moves should also be undoable)
      setMoveHistory((prev) => {
        const entry: MoveHistoryEntry = {
          shiftId: String(movedShiftId),
          previousDate: format(originalShift.date, 'yyyy-MM-dd'),
          previousStartTime: originalShift.startTime,
          previousEndTime: originalShift.endTime,
          newDate: newDate,
          newStartTime: newStartTime,
          newEndTime: newEndTime,
          timestamp: Date.now(),
        };
        return [entry, ...prev].slice(0, MAX_HISTORY);
      });

      // Update local state with the intended times (Bug 1 fix: preserve slot times)
      setShifts((prevShifts) =>
        prevShifts.map((s) =>
          String(s.id) === String(movedShiftId)
            ? { ...s, date: new Date(newDate), startTime: newStartTime, endTime: newEndTime }
            : s
        )
      );

      // Close dialog and reset state FIRST
      setIsConflictDialogOpen(false);
      setPendingMove(null);

      // Trigger settle animation AFTER dialog closes (small delay for React to re-render)
      const shiftIdForAnimation = String(movedShiftId);
      setTimeout(() => {
        setRecentlyMovedShiftId(shiftIdForAnimation);
        // Clear animation after it completes
        setTimeout(() => setRecentlyMovedShiftId(null), 2500);
      }, 200);

      toast({
        title: 'Shift moved with override',
        description: `Shift moved despite ${conflictCount} conflict(s). These have been logged for review.`,
        variant: 'default',
      });

      // Refetch shifts to ensure sync with database
      setTimeout(() => refetchShifts(), 500);
    } catch (error: any) {
      toast({
        title: 'Failed to move shift',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsForceMoving(false);
    }
  };

  // Cancel the pending move
  const handleCancelMove = () => {
    setIsConflictDialogOpen(false);
    setPendingMove(null);
    toast({
      title: 'Move cancelled',
      description: 'The shift remains in its original position',
    });
  };

  // Handle undo functionality
  const handleUndo = async () => {
    if (moveHistory.length === 0 || isUndoing) return;

    const lastMove = moveHistory[0];
    setIsUndoing(true);

    try {
      await api.shifts.move(
        lastMove.shiftId,
        lastMove.previousDate,
        lastMove.previousStartTime,
        lastMove.previousEndTime,
        true // force to avoid conflict checks on undo
      );

      // Update local state
      setShifts((prevShifts) =>
        prevShifts.map((s) =>
          String(s.id) === lastMove.shiftId
            ? {
                ...s,
                date: new Date(lastMove.previousDate),
                startTime: lastMove.previousStartTime,
                endTime: lastMove.previousEndTime,
              }
            : s
        )
      );

      // Remove from history
      setMoveHistory((prev) => prev.slice(1));

      // Trigger animation
      setRecentlyMovedShiftId(lastMove.shiftId);
      setTimeout(() => setRecentlyMovedShiftId(null), 2500);

      toast({
        title: 'Undo successful',
        description: 'Shift returned to previous position',
      });
    } catch (error: any) {
      toast({
        title: 'Undo failed',
        description: error.message || 'Could not undo the last move',
        variant: 'destructive',
      });
    } finally {
      setIsUndoing(false);
    }
  };

  // Keyboard shortcut for undo (Ctrl/Cmd + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHistory, isUndoing]);

  // Handle time change confirmation
  const handleConfirmTimeChange = async (updateTimes: boolean) => {
    if (!pendingTimeChange) return;

    const { shiftId, shift, newDate, suggestedStartTime, suggestedEndTime } = pendingTimeChange;

    try {
      await api.shifts.move(
        shiftId,
        newDate,
        updateTimes ? suggestedStartTime : shift.startTime,
        updateTimes ? suggestedEndTime : shift.endTime
      );

      // Record move for undo
      setMoveHistory((prev) => {
        const entry: MoveHistoryEntry = {
          shiftId: String(shiftId),
          previousDate: format(shift.date, 'yyyy-MM-dd'),
          previousStartTime: shift.startTime,
          previousEndTime: shift.endTime,
          newDate: newDate,
          newStartTime: updateTimes ? suggestedStartTime : shift.startTime,
          newEndTime: updateTimes ? suggestedEndTime : shift.endTime,
          timestamp: Date.now(),
        };
        return [entry, ...prev].slice(0, MAX_HISTORY);
      });

      setShifts((prevShifts) =>
        prevShifts.map((s) =>
          String(s.id) === String(shiftId)
            ? {
                ...s,
                date: new Date(newDate),
                startTime: updateTimes ? suggestedStartTime : shift.startTime,
                endTime: updateTimes ? suggestedEndTime : shift.endTime,
              }
            : s
        )
      );

      setRecentlyMovedShiftId(String(shiftId));
      setTimeout(() => setRecentlyMovedShiftId(null), 2500);

      toast({
        title: 'Shift moved',
        description: updateTimes
          ? `Moved to ${newDate} (${suggestedStartTime} - ${suggestedEndTime})`
          : `Moved to ${newDate}`,
      });
    } catch (error: any) {
      // Handle conflicts
      if (error.message?.includes('conflicts') || error.message?.includes('Move would create')) {
        try {
          const validationResult = await api.shifts.validateMove(
            shiftId,
            newDate,
            updateTimes ? suggestedStartTime : shift.startTime,
            updateTimes ? suggestedEndTime : shift.endTime
          );

          if (!validationResult.valid && validationResult.conflicts?.length > 0) {
            const intendedStartTime = updateTimes ? suggestedStartTime : shift.startTime;
            const intendedEndTime = updateTimes ? suggestedEndTime : shift.endTime;
            setPendingMove({
              shiftId,
              newDate,
              newStartTime: intendedStartTime,
              newEndTime: intendedEndTime,
              shift,
              conflicts: validationResult.conflicts,
            });
            setIsConflictDialogOpen(true);
            setIsTimeChangeDialogOpen(false);
            setPendingTimeChange(null);
            return;
          }
        } catch (validationError) {
          console.error('Validation error:', validationError);
        }
      }

      toast({
        title: 'Failed to move shift',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsTimeChangeDialogOpen(false);
      setPendingTimeChange(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <p className="text-muted-foreground">Create and manage shift assignments</p>
          </div>
          <div className="flex items-center gap-2">
            {/* DEV ONLY: Reset Schedule Button - only visible on localhost */}
            {isLocalhost && (
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(true)}
                className="border-dashed border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                DEV: Reset
              </Button>
            )}
            {canGenerateSchedule && (
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Schedule
              </Button>
            )}
            {moveHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={isUndoing}
                className="gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${isUndoing ? 'animate-spin' : ''}`} />
                Undo
                {moveHistory.length > 1 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {moveHistory.length}
                  </Badge>
                )}
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                  <DialogDescription>Add a new shift assignment to the schedule</DialogDescription>
                </DialogHeader>
                <ShiftForm onClose={() => setIsAddDialogOpen(false)} onSuccess={refetchShifts} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI Schedule Generation Dialog */}
        <Dialog open={isGenerateDialogOpen} onOpenChange={handleCloseGenerateDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {showPreview ? 'Review Generated Schedule' : 'Generate AI Schedule'}
              </DialogTitle>
              <DialogDescription>
                {showPreview
                  ? 'Review the AI-generated schedule and approve to save it to the calendar'
                  : 'Configure parameters for AI-powered schedule generation'}
              </DialogDescription>
            </DialogHeader>

            {!showPreview ? (
              // Configuration Form
              <div className="space-y-4 py-4">
                {/* AI Status Alert */}
                {aiConfigured === false && (
                  <Alert variant="destructive">
                    <AlertTitle>AI Not Configured</AlertTitle>
                    <AlertDescription>
                      AI scheduling requires the ANTHROPIC_API_KEY environment variable to be set.
                      Please contact your system administrator to configure Claude AI integration.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Unconfirmed Preferences Warning */}
                {unconfirmedPrefsCount > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Unconfirmed Preferences</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      {unconfirmedPrefsCount} employee(s) have preferences that haven't been
                      reviewed.{' '}
                      <a
                        href="/dashboard/team"
                        className="font-medium underline hover:text-yellow-900"
                      >
                        Review Team Availability
                      </a>{' '}
                      before generating to ensure accurate scheduling.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={generationConfig.start_date}
                      onChange={(e) =>
                        setGenerationConfig({ ...generationConfig, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={generationConfig.end_date}
                      onChange={(e) =>
                        setGenerationConfig({ ...generationConfig, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period_type">Period Type</Label>
                  <Select
                    value={generationConfig.type}
                    onValueChange={(value: 'week' | 'month' | 'quarter') =>
                      setGenerationConfig({ ...generationConfig, type: value })
                    }
                  >
                    <SelectTrigger id="period_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="quarter">Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bureau">Bureau</Label>
                  <Select
                    value={generationConfig.bureau}
                    onValueChange={(value: 'Milan' | 'Rome' | 'both') =>
                      setGenerationConfig({ ...generationConfig, bureau: value })
                    }
                  >
                    <SelectTrigger id="bureau">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Bureaus</SelectItem>
                      <SelectItem value="Milan">Milan Only</SelectItem>
                      <SelectItem value="Rome">Rome Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve_existing"
                    checked={generationConfig.preserve_existing}
                    onCheckedChange={(checked) =>
                      setGenerationConfig({
                        ...generationConfig,
                        preserve_existing: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="preserve_existing" className="cursor-pointer">
                    Keep existing shifts and fill gaps only
                  </Label>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>AI-Powered Scheduling</AlertTitle>
                  <AlertDescription>
                    Claude Haiku 4.5 will analyze employee preferences, recent shift history, and
                    Italian holidays to generate a fair and compliant schedule (2x faster,
                    near-frontier performance).
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseGenerateDialog}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateSchedule}
                    disabled={isGenerating || aiConfigured === false || aiConfigured === null}
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        Generating...
                      </>
                    ) : aiConfigured === null ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        Checking AI...
                      </>
                    ) : aiConfigured === false ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Not Available
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Preview
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Preview Display
              <div className="space-y-4 py-4">
                {generatedSchedule && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Total Shifts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {generatedSchedule.shifts.length}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Preference Satisfaction</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {Math.round(
                              (generatedSchedule.fairness_metrics.preference_satisfaction_rate ||
                                0) * 100
                            )}
                            %
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Fairness Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Fairness Metrics</CardTitle>
                        <CardDescription>Distribution of shifts across the team</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Weekend Shifts per Person</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(
                              generatedSchedule.fairness_metrics.weekend_shifts_per_person || {}
                            )
                              .slice(0, 6)
                              .map(([name, count]) => (
                                <div key={name} className="flex justify-between">
                                  <span className="text-muted-foreground">{name}</span>
                                  <Badge variant="secondary">{count as number}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Night Shifts per Person</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(
                              generatedSchedule.fairness_metrics.night_shifts_per_person || {}
                            )
                              .slice(0, 6)
                              .map(([name, count]) => (
                                <div key={name} className="flex justify-between">
                                  <span className="text-muted-foreground">{name}</span>
                                  <Badge variant="secondary">{count as number}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>

                        {generatedSchedule.fairness_metrics.hard_constraint_violations?.length >
                          0 && (
                          <Alert variant="destructive">
                            <AlertTitle>Constraint Violations</AlertTitle>
                            <AlertDescription>
                              {generatedSchedule.fairness_metrics.hard_constraint_violations.join(
                                ', '
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* AI Recommendations */}
                    {generatedSchedule.recommendations &&
                      generatedSchedule.recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>AI Recommendations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {generatedSchedule.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="text-sm flex gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                    {/* Shifts Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Generated Shifts Preview</CardTitle>
                        <CardDescription>
                          Showing {Math.min(10, generatedSchedule.shifts.length)} of{' '}
                          {generatedSchedule.shifts.length} shifts
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Bureau</TableHead>
                              <TableHead>Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generatedSchedule.shifts
                              .slice(0, 10)
                              .map((shift: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{shift.date}</TableCell>
                                  <TableCell className="font-medium">{shift.assigned_to}</TableCell>
                                  <TableCell>
                                    {shift.start_time} - {shift.end_time}
                                  </TableCell>
                                  <TableCell>{shift.bureau}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{shift.shift_type}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Conflict Warning */}
                    {showConflictWarning && saveConflicts.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Scheduling Conflicts Detected</AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">
                            The AI generated {saveConflicts.length} conflict(s). These are typically
                            rest period violations (less than 11 hours between shifts) which can
                            happen with 24/7 coverage.
                          </p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium">
                              View conflict details
                            </summary>
                            <ul className="mt-2 space-y-1 text-xs">
                              {saveConflicts.slice(0, 5).map((c: any, i: number) => (
                                <li key={i} className="bg-destructive/10 p-2 rounded">
                                  <strong>{c.type}</strong>: {c.description}
                                  <br />
                                  Shift 1: {c.shift1?.date} {c.shift1?.start}-{c.shift1?.end}
                                  <br />
                                  Shift 2: {c.shift2?.date} {c.shift2?.start}-{c.shift2?.end}
                                </li>
                              ))}
                              {saveConflicts.length > 5 && (
                                <li className="text-muted-foreground">
                                  ... and {saveConflicts.length - 5} more
                                </li>
                              )}
                            </ul>
                          </details>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPreview(false);
                          setShowConflictWarning(false);
                          setSaveConflicts([]);
                        }}
                        disabled={isSaving}
                      >
                        Back
                      </Button>
                      {showConflictWarning ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleSaveSchedule(true)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save Anyway (Log Conflicts)'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPreview(false);
                              setShowConflictWarning(false);
                              setSaveConflicts([]);
                              handleGenerateSchedule();
                            }}
                            disabled={isSaving}
                          >
                            Regenerate Schedule
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => handleSaveSchedule(false)} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                              Saving...
                            </>
                          ) : (
                            'Approve & Save to Calendar'
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Inline Filters */}
        <div className="flex items-center justify-between">
          <Filters filters={activeFilters} fields={filterFields} onChange={setActiveFilters} />
          {activeFilters.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Showing {filteredShifts.length} of {shifts.length} shifts
            </span>
          )}
        </div>

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="month">Monthly View</TabsTrigger>
            <TabsTrigger value="quarter">Quarterly View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>

          {/* Today View */}
          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1" />
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">
                        {format(currentDay, 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                      {isToday(currentDay) && (
                        <Badge className="bg-[#FF6600] hover:bg-[#e55a00]">Today</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 flex justify-end">
                    {!isToday(currentDay) && (
                      <Button variant="outline" onClick={navigateToToday}>
                        Today
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div key={dayAnimationKey} className={getAnimationClass(dayAnimationDirection)}>
                  {(() => {
                    const todayShifts = getShiftsForDate(currentDay);

                    // Group shifts by time slot
                    const morningShifts = todayShifts.filter(
                      (s) =>
                        parseInt(s.startTime.split(':')[0]) >= 6 &&
                        parseInt(s.startTime.split(':')[0]) < 12
                    );
                    const afternoonShifts = todayShifts.filter(
                      (s) =>
                        parseInt(s.startTime.split(':')[0]) >= 12 &&
                        parseInt(s.startTime.split(':')[0]) < 18
                    );
                    const eveningShifts = todayShifts.filter(
                      (s) =>
                        parseInt(s.startTime.split(':')[0]) >= 18 ||
                        parseInt(s.startTime.split(':')[0]) < 6
                    );

                    const TimeSlotSection = ({
                      title,
                      shiftList,
                      icon: Icon,
                      slot,
                    }: {
                      title: string;
                      shiftList: typeof todayShifts;
                      icon: React.ComponentType<{ className?: string }>;
                      slot: TimeSlotKey;
                    }) => (
                      <DroppableTimeSlot date={currentDay} slot={slot}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-5 w-5 text-[#FF6600]" />
                          <h3 className="font-semibold">{title}</h3>
                          <Badge variant="secondary">{shiftList.length}</Badge>
                        </div>
                        {shiftList.length > 0 ? (
                          <div className="space-y-2">
                            {shiftList.map((shift) => (
                              <DraggableShift
                                key={shift.id}
                                shift={shift}
                                view="week"
                                justMoved={recentlyMovedShiftId === String(shift.id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm border border-dashed rounded-lg">
                            Drop shifts here
                          </div>
                        )}
                      </DroppableTimeSlot>
                    );

                    if (todayShifts.length === 0) {
                      return (
                        <div className="space-y-4">
                          <div className="text-center py-6 text-gray-500">
                            <Clock className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">No shifts scheduled</p>
                            <p className="text-sm mt-1">Drop shifts into a time slot below</p>
                          </div>
                          <TimeSlotSection
                            title="Morning (6AM - 12PM)"
                            shiftList={[]}
                            icon={Sunrise}
                            slot="morning"
                          />
                          <TimeSlotSection
                            title="Afternoon (12PM - 6PM)"
                            shiftList={[]}
                            icon={Sun}
                            slot="afternoon"
                          />
                          <TimeSlotSection
                            title="Evening/Night (6PM - 12AM)"
                            shiftList={[]}
                            icon={Moon}
                            slot="evening"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <span className="text-3xl font-bold text-[#FF6600]">
                            {todayShifts.length}
                          </span>
                          <span className="text-gray-600 ml-2">total shifts today</span>
                        </div>

                        <TimeSlotSection
                          title="Morning (6AM - 12PM)"
                          shiftList={morningShifts}
                          icon={Sunrise}
                          slot="morning"
                        />
                        <TimeSlotSection
                          title="Afternoon (12PM - 6PM)"
                          shiftList={afternoonShifts}
                          icon={Sun}
                          slot="afternoon"
                        />
                        <TimeSlotSection
                          title="Evening/Night (6PM - 12AM)"
                          shiftList={eveningShifts}
                          icon={Moon}
                          slot="evening"
                        />
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Week View */}
          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                      {format(weekStart, 'MMMM dd')} -{' '}
                      {format(addDays(weekStart, 6), 'MMMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={navigateToThisWeek}>
                      This Week
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div key={weekAnimationKey} className={getAnimationClass(weekAnimationDirection)}>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const dayShifts = getShiftsForDate(day);
                      return (
                        <DroppableDay key={day.toISOString()} date={day}>
                          <div className="font-semibold text-sm mb-2">
                            {format(day, 'EEE')}
                            <div className="text-xs text-muted-foreground">
                              {format(day, 'MMM dd')}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {dayShifts.map((shift) => (
                              <DraggableShift
                                key={shift.id}
                                shift={shift}
                                view="week"
                                justMoved={recentlyMovedShiftId === String(shift.id)}
                              />
                            ))}
                          </div>
                        </DroppableDay>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monthly Schedule</CardTitle>
                    <CardDescription>{format(currentMonth, 'MMMM yyyy')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={navigateToThisMonth}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div key={monthAnimationKey} className={getAnimationClass(monthAnimationDirection)}>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center font-semibold text-sm py-2">
                        {day}
                      </div>
                    ))}
                    {monthCalendarDays.map((day, index) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="border rounded-lg p-2 min-h-[120px] bg-muted/20"
                          />
                        );
                      }
                      const dayShifts = getShiftsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      return (
                        <DroppableMonthDay
                          key={day.toISOString()}
                          day={day}
                          isCurrentMonth={isCurrentMonth}
                        >
                          <div className="font-semibold text-sm mb-2">{format(day, 'd')}</div>
                          <div className="space-y-1">
                            {dayShifts.slice(0, 3).map((shift) => (
                              <DraggableShift
                                key={shift.id}
                                shift={shift}
                                view="month"
                                justMoved={recentlyMovedShiftId === String(shift.id)}
                              />
                            ))}
                            {dayShifts.length > 3 && (
                              <div className="text-[10px] text-muted-foreground text-center">
                                +{dayShifts.length - 3} more
                              </div>
                            )}
                          </div>
                        </DroppableMonthDay>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarter" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quarterly Schedule</CardTitle>
                    <CardDescription>
                      Q{Math.floor(quarterStart.getMonth() / 3) + 1} {format(quarterStart, 'yyyy')}{' '}
                      ({format(quarterStart, 'MMM')} - {format(quarterEnd, 'MMM')})
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateQuarter('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={navigateToThisQuarter}>
                      Current Quarter
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigateQuarter('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  key={quarterAnimationKey}
                  className={getAnimationClass(quarterAnimationDirection)}
                >
                  <div className="grid grid-cols-3 gap-4">
                    {quarterMonths.map((month) => {
                      const monthStart = startOfMonth(month);
                      const monthEnd = endOfMonth(month);
                      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
                      const firstDay = monthStart.getDay();
                      const calendarDays = [...Array(firstDay).fill(null), ...monthDays];

                      return (
                        <Card key={month.toISOString()}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {format(month, 'MMMM yyyy')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div
                                  key={`${month}-${day}-${i}`}
                                  className="text-center text-[10px] font-semibold py-1"
                                >
                                  {day}
                                </div>
                              ))}
                              {calendarDays.map((day, index) => {
                                if (!day) {
                                  return (
                                    <div
                                      key={`empty-${month}-${index}`}
                                      className="aspect-square"
                                    />
                                  );
                                }
                                const shiftCount = getShiftCountForDate(day);
                                return (
                                  <div
                                    key={day.toISOString()}
                                    className={`aspect-square flex items-center justify-center text-[10px] rounded cursor-pointer hover:bg-muted transition-colors ${
                                      shiftCount > 0
                                        ? 'bg-primary/10 border border-primary/20 font-semibold'
                                        : 'border'
                                    }`}
                                  >
                                    <div className="text-center">
                                      <div>{format(day, 'd')}</div>
                                      {shiftCount > 0 && (
                                        <div className="text-[8px] text-primary">{shiftCount}</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Shifts</CardTitle>
                    <CardDescription>
                      {activeFilters.length > 0
                        ? `Showing ${filteredShifts.length} of ${shifts.length} shifts`
                        : 'Complete list of scheduled shifts'}
                    </CardDescription>
                  </div>
                  {activeFilters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>
                      <X className="mr-1 h-3 w-3" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredShifts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No shifts match your filters</p>
                    <p className="text-sm mt-1">
                      {shifts.length > 0
                        ? 'Try adjusting your filter criteria'
                        : 'No shifts scheduled yet'}
                    </p>
                    {activeFilters.length > 0 && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveFilters([])}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Bureau</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.employee}</TableCell>
                          <TableCell>{shift.role}</TableCell>
                          <TableCell>{shift.bureau}</TableCell>
                          <TableCell>{format(shift.date, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {shift.startTime} - {shift.endTime}
                          </TableCell>
                          <TableCell>
                            <Badge variant={shift.status === 'confirmed' ? 'default' : 'secondary'}>
                              {shift.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(shift)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => openDeleteDialog(shift)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grid" className="space-y-4">
            {filteredShifts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No shifts match your filters</p>
                    <p className="text-sm mt-1">
                      {shifts.length > 0
                        ? 'Try adjusting your filter criteria'
                        : 'No shifts scheduled yet'}
                    </p>
                    {activeFilters.length > 0 && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveFilters([])}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredShifts.map((shift) => (
                  <Card key={shift.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{shift.employee}</CardTitle>
                          <CardDescription>{shift.role}</CardDescription>
                        </div>
                        <Badge variant={shift.status === 'confirmed' ? 'default' : 'secondary'}>
                          {shift.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bureau:</span>
                        <span className="font-medium">{shift.bureau}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{format(shift.date, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => openEditDialog(shift)}
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent text-destructive"
                          onClick={() => openDeleteDialog(shift)}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DragOverlay
          dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {activeShift ? (
            <div className="drag-overlay-card text-sm min-w-[180px] max-w-[220px]">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-primary/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {activeShift.employee}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {activeShift.startTime} - {activeShift.endTime}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[10px] h-5 px-2">
                    {activeShift.bureau}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* ARIA live region for screen readers */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shift</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this shift for {selectedShift?.employee}? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteShift}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Shift Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Shift</DialogTitle>
              <DialogDescription>Modify the shift details</DialogDescription>
            </DialogHeader>
            {selectedShift && (
              <EditShiftForm
                shift={selectedShift}
                onClose={() => {
                  setIsEditDialogOpen(false);
                  setSelectedShift(null);
                }}
                onSuccess={refetchShifts}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Conflict Confirmation Dialog for Drag-and-Drop */}
        <AlertDialog open={isConflictDialogOpen} onOpenChange={setIsConflictDialogOpen}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Scheduling Conflict Detected
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    Moving this shift would create {pendingMove?.conflicts?.length || 0} scheduling
                    conflict{(pendingMove?.conflicts?.length || 0) !== 1 ? 's' : ''}:
                  </p>

                  {/* Conflict Details */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {pendingMove?.conflicts?.map((conflict: any, index: number) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-3 ${
                          conflict.severity === 'high'
                            ? 'border-red-200 bg-red-50'
                            : conflict.severity === 'medium'
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {conflict.severity === 'high' ? (
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-foreground">
                                {conflict.type}
                              </span>
                              <Badge
                                variant={conflict.severity === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {conflict.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{conflict.description}</p>
                            {conflict.employee && (
                              <p className="text-sm font-medium text-foreground mt-1">
                                Employee: {conflict.employee}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning about proceeding */}
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium text-foreground">What happens if you proceed?</p>
                    <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-1">
                      <li>The shift will be moved to {pendingMove?.newDate}</li>
                      <li>Conflicts will be logged for review in Schedule Health</li>
                      <li>Affected employees may need manual notification</li>
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleCancelMove} disabled={isForceMoving}>
                Cancel Move
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleForceMove}
                disabled={isForceMoving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isForceMoving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Moving...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Move Anyway
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Time Change Confirmation Dialog */}
        <Dialog open={isTimeChangeDialogOpen} onOpenChange={setIsTimeChangeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Shift Time?</DialogTitle>
              <DialogDescription>
                You moved this shift to {pendingTimeChange?.newDate}. Would you like to adjust the
                times?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={pendingTimeChange?.suggestedStartTime || ''}
                    onChange={(e) =>
                      setPendingTimeChange((prev) =>
                        prev ? { ...prev, suggestedStartTime: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={pendingTimeChange?.suggestedEndTime || ''}
                    onChange={(e) =>
                      setPendingTimeChange((prev) =>
                        prev ? { ...prev, suggestedEndTime: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Original time: {pendingTimeChange?.shift?.startTime} -{' '}
                {pendingTimeChange?.shift?.endTime}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  handleConfirmTimeChange(false);
                }}
              >
                Keep Original Times
              </Button>
              <Button onClick={() => handleConfirmTimeChange(true)}>Update Times</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DEV ONLY: Reset Schedule Confirmation Dialog */}
        {isLocalhost && (
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent className="border-orange-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                  Reset Schedule (DEV ONLY)
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      This will <strong>permanently delete ALL shifts</strong> and shift assignments
                      from the database.
                    </p>
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm">
                      <p className="font-medium text-orange-800">This action:</p>
                      <ul className="mt-1 list-disc list-inside text-orange-700 space-y-1">
                        <li>Deletes all shifts</li>
                        <li>Deletes all shift assignments</li>
                        <li>Clears all scheduling conflicts</li>
                        <li>Cannot be undone</li>
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This button only appears on localhost for development/testing purposes.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetSchedule}
                  disabled={isResetting}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  {isResetting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Yes, Reset Everything
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </DndContext>
  );
}

function ShiftForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    bureau: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '16:00',
    status: 'draft',
  });

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await api.employees.list();
        setEmployeeList(response.employees || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    }
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bureau || !formData.date || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in bureau, date, and time fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // API expects bureau name, date, start_time, end_time separately
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          bureau: formData.bureau,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          employee_id: formData.employee_id || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shift');
      }

      toast({
        title: 'Shift created',
        description: 'The shift has been successfully created',
      });

      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Failed to create shift',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Employee (Optional)</Label>
        <Select
          value={formData.employee_id}
          onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
        >
          <SelectTrigger id="employee">
            <SelectValue placeholder="Select employee (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {employeeList.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name} - {emp.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bureau">Bureau *</Label>
        <Select
          value={formData.bureau}
          onValueChange={(value) => setFormData({ ...formData, bureau: value })}
        >
          <SelectTrigger id="bureau">
            <SelectValue placeholder="Select bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Milan">Milan</SelectItem>
            <SelectItem value="Rome">Rome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Shift'}
        </Button>
      </div>
    </form>
  );
}

function EditShiftForm({
  shift,
  onClose,
  onSuccess,
}: {
  shift: any;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    employee_id: shift.employee_id || '',
    bureau: shift.bureau || '',
    date: format(shift.date, 'yyyy-MM-dd'),
    start_time: shift.startTime || '08:00',
    end_time: shift.endTime || '16:00',
    status: shift.status || 'draft',
  });

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await api.employees.list();
        setEmployeeList(response.employees || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    }
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bureau || !formData.date || !formData.start_time || !formData.end_time) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in bureau, date, and time fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          bureau: formData.bureau,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          employee_id: formData.employee_id || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update shift');
      }

      toast({
        title: 'Shift updated',
        description: 'The shift has been successfully updated',
      });

      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Failed to update shift',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-employee">Employee (Optional)</Label>
        <Select
          value={formData.employee_id}
          onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
        >
          <SelectTrigger id="edit-employee">
            <SelectValue placeholder="Select employee (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {employeeList.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name} - {emp.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-bureau">Bureau *</Label>
        <Select
          value={formData.bureau}
          onValueChange={(value) => setFormData({ ...formData, bureau: value })}
        >
          <SelectTrigger id="edit-bureau">
            <SelectValue placeholder="Select bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Milan">Milan</SelectItem>
            <SelectItem value="Rome">Rome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-date">Date *</Label>
        <Input
          id="edit-date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-startTime">Start Time *</Label>
          <Input
            id="edit-startTime"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-endTime">End Time *</Label>
          <Input
            id="edit-endTime"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger id="edit-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
