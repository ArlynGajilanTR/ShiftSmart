'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  Users,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  Moon,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  subQuarters,
} from 'date-fns';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

// Type definitions
interface Shift {
  id: string;
  employee: string;
  employee_id: string;
  role: string;
  bureau: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

// Mock data as fallback
const mockUpcomingShifts = [
  {
    id: 1,
    employee: 'Marco Rossi',
    role: 'Senior Editor',
    bureau: 'Milan',
    date: '2025-10-30',
    time: '08:00 - 16:00',
    status: 'confirmed',
  },
  {
    id: 2,
    employee: 'Sofia Romano',
    role: 'Junior Editor',
    bureau: 'Rome',
    date: '2025-10-30',
    time: '16:00 - 00:00',
    status: 'confirmed',
  },
  {
    id: 3,
    employee: 'Luca Ferrari',
    role: 'Lead Editor',
    bureau: 'Milan',
    date: '2025-10-31',
    time: '00:00 - 08:00',
    status: 'pending',
  },
  {
    id: 4,
    employee: 'Giulia Bianchi',
    role: 'Senior Editor',
    bureau: 'Rome',
    date: '2025-10-31',
    time: '08:00 - 16:00',
    status: 'confirmed',
  },
  {
    id: 5,
    employee: 'Alessandro Conti',
    role: 'Junior Editor',
    bureau: 'Milan',
    date: '2025-11-01',
    time: '08:00 - 16:00',
    status: 'confirmed',
  },
  {
    id: 6,
    employee: 'Francesca Marino',
    role: 'Senior Editor',
    bureau: 'Rome',
    date: '2025-11-01',
    time: '16:00 - 00:00',
    status: 'confirmed',
  },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeShifts: 0,
    openConflicts: 0,
    coverageRate: '0%',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate date range for fetching shifts based on current view
  const getDateRange = () => {
    // Get the start of the current week (Monday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    // Get the end of the current quarter
    const quarterEnd = endOfQuarter(currentDate);

    // Fetch from start of current week to end of quarter (covers all views)
    return {
      start_date: format(weekStart, 'yyyy-MM-dd'),
      end_date: format(quarterEnd, 'yyyy-MM-dd'),
    };
  };

  // Fetch dashboard data on mount and when currentDate changes
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const dateRange = getDateRange();

        // Fetch all data in parallel
        const [statsData, shiftsData] = await Promise.all([
          api.dashboard.getStats(),
          api.shifts.list({
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
          }),
        ]);

        // Update stats (with defensive checks)
        setStats({
          totalEmployees: statsData?.stats?.totalEmployees || 0,
          activeShifts: statsData?.stats?.upcomingShifts || 0,
          openConflicts: statsData?.stats?.unresolvedConflicts || 0,
          coverageRate: statsData?.stats?.coverageRate ? `${statsData.stats.coverageRate}%` : '0%',
        });

        // Transform shifts data to match expected format
        const transformedShifts = (shiftsData.shifts || [])
          .filter((shift: any) => shift && (shift.date || shift.start_time))
          .map((shift: any) => {
            // Safely parse dates
            const startDate = shift.start_time ? new Date(shift.start_time) : null;
            const endDate = shift.end_time ? new Date(shift.end_time) : null;

            return {
              id: shift.id,
              employee: shift.employee || shift.users?.full_name || 'Unassigned',
              employee_id: shift.employee_id || null,
              role: shift.role || shift.users?.title || shift.users?.shift_role || 'Unknown',
              bureau: shift.bureau || shift.bureaus?.name || 'Milan',
              date: shift.date || (startDate ? format(startDate, 'yyyy-MM-dd') : ''),
              startTime: shift.startTime || (startDate ? format(startDate, 'HH:mm') : '00:00'),
              endTime: shift.endTime || (endDate ? format(endDate, 'HH:mm') : '00:00'),
              status: shift.status || 'pending',
            };
          });

        // Update shifts
        setUpcomingShifts(transformedShifts);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: 'Failed to load dashboard',
          description: error.message || 'Using cached data',
          variant: 'destructive',
        });
        // Use mock data as fallback
        setUpcomingShifts(mockUpcomingShifts as any);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast, currentDate]);

  const statsDisplay = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees.toString(),
      icon: Users,
      change: 'Breaking News Team',
      color: 'border-l-4 border-l-black',
    },
    {
      label: 'Active Shifts',
      value: stats.activeShifts.toString(),
      icon: CalendarIcon,
      change: 'This week',
      color: 'border-l-4 border-l-black',
    },
    {
      label: 'Open Conflicts',
      value: stats.openConflicts.toString(),
      icon: AlertCircle,
      change: stats.openConflicts === 0 ? 'All clear' : 'Needs attention',
      color: `border-l-4 ${stats.openConflicts === 0 ? 'border-l-green-500' : 'border-l-red-500'}`,
    },
    {
      label: 'Coverage Rate',
      value: stats.coverageRate,
      icon: Clock,
      change: 'Milan & Rome',
      color: `border-l-4 ${stats.coverageRate === '100%' ? 'border-l-green-500' : 'border-l-red-500'}`,
      progressColor: stats.coverageRate === '100%' ? 'bg-green-500' : 'bg-red-500',
      showProgress: true,
    },
  ];

  const getShiftsForDate = (date: Date) => {
    return upcomingShifts.filter((shift) => {
      const shiftDate = shift.date;
      return format(new Date(shiftDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-bold text-lg">
            {format(weekStart, 'MMM dd')} -{' '}
            {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const shifts = getShiftsForDate(day);
            return (
              <div
                key={day.toISOString()}
                className="border rounded-lg p-3 min-h-[200px] bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-bold text-sm mb-2">
                  {format(day, 'EEE')}
                  <div className="text-xl font-semibold">{format(day, 'dd')}</div>
                </div>
                <div className="space-y-2">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="bg-white border-l-4 border-l-[#FF6600] rounded p-2 text-xs shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="font-semibold text-[#FF6600]">{shift.employee}</div>
                      <div className="text-gray-600 font-medium">
                        {shift.startTime} - {shift.endTime}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {shift.bureau}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-bold text-xl">{format(currentDate, 'MMMM yyyy')}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-bold text-sm p-2">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const shifts = getShiftsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={day.toISOString()}
                className={`border rounded p-2 min-h-[100px] shadow-sm hover:shadow-md transition-all ${isCurrentMonth ? 'bg-white' : 'bg-gray-100'}`}
              >
                <div
                  className={`text-sm font-bold mb-1 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {shifts.slice(0, 2).map((shift) => (
                    <div
                      key={shift.id}
                      className="bg-[#FF6600] text-white rounded px-1 py-0.5 text-xs truncate font-medium hover:bg-[#e55a00] transition-colors cursor-pointer"
                      title={`${shift.employee} - ${shift.startTime} to ${shift.endTime}`}
                    >
                      {shift.employee.split(' ')[0]}
                    </div>
                  ))}
                  {shifts.length > 2 && (
                    <div className="text-xs text-gray-600 font-medium">
                      +{shifts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const QuarterView = () => {
    const quarterStart = startOfQuarter(currentDate);
    const months = [quarterStart, addMonths(quarterStart, 1), addMonths(quarterStart, 2)];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subQuarters(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-bold text-xl">
            Q{Math.floor(currentDate.getMonth() / 3) + 1} {format(currentDate, 'yyyy')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addQuarters(currentDate, 1))}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start: startDate, end: endDate });

            return (
              <div
                key={month.toISOString()}
                className="border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="font-bold mb-2 text-lg">{format(month, 'MMMM')}</h4>
                <div className="grid grid-cols-7 gap-0.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-bold p-1">
                      {day}
                    </div>
                  ))}
                  {days.map((day) => {
                    const shifts = getShiftsForDate(day);
                    const isCurrentMonth = isSameMonth(day, month);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`text-center text-xs p-1 rounded transition-all ${
                          isCurrentMonth
                            ? shifts.length > 0
                              ? 'bg-[#FF6600] text-white font-bold hover:bg-[#e55a00] cursor-pointer'
                              : 'bg-gray-50 hover:bg-gray-100'
                            : 'text-gray-300'
                        }`}
                        title={shifts.length > 0 ? `${shifts.length} shift(s)` : ''}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TodayView = () => {
    const today = new Date();
    const todayShifts = getShiftsForDate(today);

    // Group shifts by time slot
    const morningShifts = todayShifts.filter((s) => parseInt(s.startTime.split(':')[0]) < 12);
    const afternoonShifts = todayShifts.filter(
      (s) => parseInt(s.startTime.split(':')[0]) >= 12 && parseInt(s.startTime.split(':')[0]) < 18
    );
    const eveningShifts = todayShifts.filter(
      (s) => parseInt(s.startTime.split(':')[0]) >= 18 || parseInt(s.startTime.split(':')[0]) < 6
    );

    const ShiftCard = ({ shift }: { shift: Shift }) => (
      <div className="bg-white border-l-4 border-l-[#FF6600] rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="font-bold text-[#FF6600] text-lg">{shift.employee}</div>
            <div className="text-gray-600 font-medium">{shift.role}</div>
          </div>
          <Badge variant="secondary" className="text-sm font-semibold">
            {shift.bureau}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-4">
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

    const TimeSlotSection = ({
      title,
      shifts,
      icon: Icon,
    }: {
      title: string;
      shifts: Shift[];
      icon: React.ComponentType<{ className?: string }>;
    }) => (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#FF6600]" />
          <h4 className="font-bold text-gray-700">{title}</h4>
          <Badge variant="outline" className="ml-auto">
            {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {shifts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
            No shifts scheduled
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-3">
          <h3 className="font-bold text-2xl">{format(today, 'EEEE, MMMM d, yyyy')}</h3>
          {isToday(today) && <Badge className="bg-[#FF6600] hover:bg-[#e55a00]">Today</Badge>}
        </div>

        {todayShifts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No shifts scheduled for today</p>
            <p className="text-sm mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-3xl font-bold text-[#FF6600]">{todayShifts.length}</span>
              <span className="text-gray-600 ml-2">total shifts today</span>
            </div>

            <TimeSlotSection title="Morning (6AM - 12PM)" shifts={morningShifts} icon={Sunrise} />
            <TimeSlotSection title="Afternoon (12PM - 6PM)" shifts={afternoonShifts} icon={Sun} />
            <TimeSlotSection title="Evening/Night (6PM - 6AM)" shifts={eveningShifts} icon={Moon} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((stat) => (
          <Card
            key={stat.label}
            className={`${stat.color} shadow-sm hover:shadow-md transition-all hover:scale-[1.02] h-full`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 min-h-[72px]">
              <CardTitle className="text-sm font-semibold">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col">
              <div className={stat.showProgress ? 'mb-4' : ''}>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">{stat.change}</p>
              </div>
              {stat.showProgress && (
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stat.progressColor} transition-all duration-500`}
                    style={{ width: stat.value }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Overview */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div>
            <CardTitle className="text-xl font-bold">Schedule Overview</CardTitle>
            <CardDescription className="font-medium">View shift assignments</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="today" className="font-semibold">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="font-semibold">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="font-semibold">
                Month
              </TabsTrigger>
              <TabsTrigger value="quarter" className="font-semibold">
                Quarter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              <TodayView />
            </TabsContent>

            <TabsContent value="week">
              <WeekView />
            </TabsContent>

            <TabsContent value="month">
              <MonthView />
            </TabsContent>

            <TabsContent value="quarter">
              <QuarterView />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
