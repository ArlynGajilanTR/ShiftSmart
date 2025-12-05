'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
  Filter,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Sparkles,
  Clock,
  Sunrise,
  Sun,
  Moon,
} from 'lucide-react';
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
  startOfQuarter,
  endOfQuarter,
} from 'date-fns';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

// Mock data for shifts as fallback
const mockShifts = [
  {
    id: 1,
    employee: 'Marco Rossi',
    role: 'Senior Editor',
    bureau: 'Milan',
    date: new Date(2025, 9, 30),
    startTime: '08:00',
    endTime: '16:00',
    status: 'confirmed',
  },
  {
    id: 2,
    employee: 'Sofia Romano',
    role: 'Junior Editor',
    bureau: 'Rome',
    date: new Date(2025, 9, 30),
    startTime: '16:00',
    endTime: '00:00',
    status: 'confirmed',
  },
  {
    id: 3,
    employee: 'Luca Ferrari',
    role: 'Lead Editor',
    bureau: 'Milan',
    date: new Date(2025, 9, 31),
    startTime: '00:00',
    endTime: '08:00',
    status: 'pending',
  },
  {
    id: 4,
    employee: 'Giulia Bianchi',
    role: 'Senior Editor',
    bureau: 'Rome',
    date: new Date(2025, 9, 31),
    startTime: '08:00',
    endTime: '16:00',
    status: 'confirmed',
  },
  {
    id: 5,
    employee: 'Alessandro Conti',
    role: 'Junior Editor',
    bureau: 'Milan',
    date: new Date(2025, 9, 31),
    startTime: '16:00',
    endTime: '00:00',
    status: 'confirmed',
  },
];

const employees = [
  { id: 1, name: 'Marco Rossi', role: 'Senior Editor', bureau: 'Milan' },
  { id: 2, name: 'Sofia Romano', role: 'Junior Editor', bureau: 'Rome' },
  { id: 3, name: 'Luca Ferrari', role: 'Lead Editor', bureau: 'Milan' },
  { id: 4, name: 'Giulia Bianchi', role: 'Senior Editor', bureau: 'Rome' },
  { id: 5, name: 'Alessandro Conti', role: 'Junior Editor', bureau: 'Milan' },
];

function DraggableShift({ shift, view = 'week' }: { shift: any; view?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shift-${shift.id}`,
    data: { shift },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  if (view === 'month') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-primary/10 border border-primary/20 rounded px-1.5 py-1 text-[10px] cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-all hover:shadow-sm"
      >
        <div className="flex items-center gap-1">
          <GripVertical className="h-2 w-2 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{shift.employee.split(' ')[0]}</div>
            <div className="text-muted-foreground truncate">{shift.startTime}</div>
          </div>
        </div>
      </div>
    );
  }

  // Today view - larger cards with full details
  if (view === 'today') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-white border-l-4 border-l-[#FF6600] rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 opacity-50 hover:opacity-100 transition-opacity" />
            <div className="space-y-1">
              <div className="font-bold text-[#FF6600] text-lg">{shift.employee}</div>
              <div className="text-gray-600 font-medium">{shift.role}</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-semibold">
            {shift.bureau}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-4 ml-7">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">
              {shift.startTime} - {shift.endTime}
            </span>
          </div>
          <Badge
            variant={shift.status === 'confirmed' ? 'default' : 'secondary'}
            className="font-semibold"
          >
            {shift.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-primary/10 border border-primary/20 rounded p-2 text-xs cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-all hover:shadow-md group"
    >
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{shift.employee}</div>
          <div className="text-muted-foreground">
            {shift.startTime} - {shift.endTime}
          </div>
          <Badge variant="secondary" className="mt-1 text-[10px] h-4">
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
      className={`border rounded-lg p-3 min-h-[200px] transition-all ${
        isOver ? 'bg-primary/5 border-primary ring-2 ring-primary/20' : ''
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
    return <div className="border rounded-lg p-2 min-h-[120px] bg-muted/20" />;
  }

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-2 min-h-[120px] transition-all ${
        !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
      } ${isOver ? 'bg-primary/5 border-primary ring-2 ring-primary/20' : ''}`}
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

  // Edit/Delete state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        description: error.message || 'Using cached data',
        variant: 'destructive',
      });
      // Fallback to mock data
      setShifts(mockShifts);
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

  // Handle saving generated schedule to database
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      const response = (await api.ai.generateSchedule({
        start_date: generationConfig.start_date,
        end_date: generationConfig.end_date,
        type: generationConfig.type,
        bureau: generationConfig.bureau,
        preserve_existing: generationConfig.preserve_existing,
        save_to_database: true, // Save mode
      })) as any;

      toast({
        title: 'Schedule saved successfully',
        description: `Successfully added ${response.shift_ids?.length || 0} shifts to calendar`,
      });

      // Close dialog and reset state
      setIsGenerateDialogOpen(false);
      setShowPreview(false);
      setGeneratedSchedule(null);

      // Refresh the calendar
      await refetchShifts();
    } catch (error: any) {
      console.error('Failed to save schedule:', error);
      toast({
        title: 'Failed to save schedule',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekStart = startOfWeek(new Date());
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
    return shifts.filter(
      (shift) => format(shift.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getShiftCountForDate = (date: Date) => {
    return shifts.filter((shift) => format(shift.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      .length;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const shift = event.active.data.current?.shift;
    setActiveShift(shift);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShift(null);

    if (!over) return;

    const shiftId = active.data.current?.shift?.id;
    const newDate = over.data.current?.date;

    if (shiftId && newDate) {
      try {
        // Update via API
        await api.shifts.move(shiftId, format(newDate, 'yyyy-MM-dd'));

        // Update local state
        setShifts((prevShifts) =>
          prevShifts.map((shift) =>
            shift.id === shiftId ? { ...shift, date: new Date(newDate) } : shift
          )
        );

        toast({
          title: 'Shift moved',
          description: 'Shift has been successfully moved to the new date',
        });
      } catch (error: any) {
        toast({
          title: 'Failed to move shift',
          description: error.message,
          variant: 'destructive',
        });
      }
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
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Schedule
            </Button>
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

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(false)}
                        disabled={isSaving}
                      >
                        Back
                      </Button>
                      <Button onClick={handleSaveSchedule} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                            Saving...
                          </>
                        ) : (
                          'Approve & Save to Calendar'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                <div className="flex items-center justify-center gap-3">
                  <CardTitle className="text-2xl">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <Badge className="bg-[#FF6600] hover:bg-[#e55a00]">Today</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <DroppableDay date={new Date()}>
                  {(() => {
                    const today = new Date();
                    const todayShifts = getShiftsForDate(today);

                    // Group shifts by time slot
                    const morningShifts = todayShifts.filter(
                      (s) => parseInt(s.startTime.split(':')[0]) < 12
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
                    }: {
                      title: string;
                      shiftList: typeof todayShifts;
                      icon: React.ComponentType<{ className?: string }>;
                    }) => (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-[#FF6600]" />
                          <h4 className="font-bold text-gray-700">{title}</h4>
                          <Badge variant="outline" className="ml-auto">
                            {shiftList.length} shift{shiftList.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {shiftList.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {shiftList.map((shift) => (
                              <DraggableShift key={shift.id} shift={shift} view="today" />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                            No shifts scheduled
                          </div>
                        )}
                      </div>
                    );

                    if (todayShifts.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">No shifts scheduled for today</p>
                          <p className="text-sm mt-1">
                            Drag shifts from other views or enjoy your day off!
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-[#FF6600]">
                            {todayShifts.length}
                          </span>
                          <span className="text-gray-600 ml-2">total shifts today</span>
                        </div>

                        <TimeSlotSection
                          title="Morning (6AM - 12PM)"
                          shiftList={morningShifts}
                          icon={Sunrise}
                        />
                        <TimeSlotSection
                          title="Afternoon (12PM - 6PM)"
                          shiftList={afternoonShifts}
                          icon={Sun}
                        />
                        <TimeSlotSection
                          title="Evening/Night (6PM - 6AM)"
                          shiftList={eveningShifts}
                          icon={Moon}
                        />
                      </div>
                    );
                  })()}
                </DroppableDay>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Week View */}
          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  {format(weekStart, 'MMMM dd')} - {format(addDays(weekStart, 6), 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                            <DraggableShift key={shift.id} shift={shift} view="week" />
                          ))}
                        </div>
                      </DroppableDay>
                    );
                  })}
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                            <DraggableShift key={shift.id} shift={shift} view="month" />
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuarter(addMonths(currentQuarter, -3))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentQuarter(new Date())}>
                      Current Quarter
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuarter(addMonths(currentQuarter, 3))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                          <CardTitle className="text-base">{format(month, 'MMMM yyyy')}</CardTitle>
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
                                  <div key={`empty-${month}-${index}`} className="aspect-square" />
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Shifts</CardTitle>
                <CardDescription>Complete list of scheduled shifts</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {shifts.map((shift) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shifts.map((shift) => (
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
          </TabsContent>
        </Tabs>

        <DragOverlay>
          {activeShift ? (
            <div className="bg-primary/20 border-2 border-primary rounded p-2 text-xs shadow-lg rotate-3">
              <div className="font-medium">{activeShift.employee}</div>
              <div className="text-muted-foreground">
                {activeShift.startTime} - {activeShift.endTime}
              </div>
              <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                {activeShift.bureau}
              </Badge>
            </div>
          ) : null}
        </DragOverlay>

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
