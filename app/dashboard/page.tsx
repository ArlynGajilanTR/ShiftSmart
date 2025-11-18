'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  Users,
  AlertCircle,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfQuarter,
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

interface Conflict {
  id: string;
  type: string;
  employee?: string;
  date: string;
  severity: string;
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

const mockRecentConflicts = [
  {
    id: '1',
    type: 'Double Booking',
    employee: 'Marco Rossi',
    date: '2025-11-02',
    severity: 'high',
  },
  {
    id: '2',
    type: 'Rest Period Violation',
    employee: 'Sofia Romano',
    date: '2025-11-03',
    severity: 'medium',
  },
  {
    id: '3',
    type: 'Skill Gap',
    date: '2025-11-05',
    severity: 'low',
  },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [recentConflicts, setRecentConflicts] = useState<Conflict[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeShifts: 0,
    openConflicts: 0,
    coverageRate: '0%',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all data in parallel
        const [statsData, shiftsData, conflictsData] = await Promise.all([
          api.dashboard.getStats(),
          api.shifts.upcoming(7),
          api.conflicts.list({ status: 'unresolved', limit: 5 }),
        ]);

        // Update stats (with defensive checks)
        setStats({
          totalEmployees: statsData?.stats?.totalEmployees || 0,
          activeShifts: statsData?.stats?.upcomingShifts || 0,
          openConflicts: statsData?.stats?.unresolvedConflicts || 0,
          coverageRate: statsData?.stats?.coverageRate ? `${statsData.stats.coverageRate}%` : '0%',
        });

        // Update shifts
        setUpcomingShifts(shiftsData.shifts || []);

        // Update conflicts
        setRecentConflicts(conflictsData.conflicts || []);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: 'Failed to load dashboard',
          description: error.message || 'Using cached data',
          variant: 'destructive',
        });
        // Use mock data as fallback
        setUpcomingShifts(mockUpcomingShifts as any);
        setRecentConflicts(mockRecentConflicts);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  const statsDisplay = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees.toString(),
      icon: Users,
      change: 'Breaking News Team',
      color: 'border-l-4 border-l-charcoal',
    },
    {
      label: 'Active Shifts',
      value: stats.activeShifts.toString(),
      icon: CalendarIcon,
      change: 'This week',
      color: 'border-l-4 border-l-primary',
    },
    {
      label: 'Open Conflicts',
      value: stats.openConflicts.toString(),
      icon: AlertCircle,
      change: 'Needs attention',
      color: 'border-l-4 border-l-red-500',
    },
    {
      label: 'Coverage Rate',
      value: stats.coverageRate,
      icon: Clock,
      change: 'Milan & Rome',
      color: 'border-l-4 border-l-green-500',
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
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
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
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
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
              <div className="mb-4">
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">{stat.change}</p>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: stat.label === 'Coverage Rate' ? stat.value : '75%' }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Section */}
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Schedule Overview</CardTitle>
                <CardDescription className="font-medium">
                  View and manage shift assignments
                </CardDescription>
              </div>
              <Button className="hover:scale-105 transition-transform">
                <Plus className="mr-2 h-4 w-4" />
                Add Shift
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="w-full">
              <TabsList className="mb-4">
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

        {/* Recent Conflicts */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Conflicts</CardTitle>
            <CardDescription className="font-medium">Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      conflict.severity === 'high'
                        ? 'text-red-500'
                        : conflict.severity === 'medium'
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold">{conflict.type}</p>
                    {conflict.employee && (
                      <p className="text-sm text-muted-foreground font-medium">
                        {conflict.employee}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-medium">
                      {format(new Date(conflict.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      conflict.severity === 'high'
                        ? 'destructive'
                        : conflict.severity === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                    className="font-semibold"
                  >
                    {conflict.severity}
                  </Badge>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 bg-transparent hover:bg-primary hover:text-primary-foreground transition-colors font-semibold"
            >
              View All Conflicts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Shifts Table */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Upcoming Shifts</CardTitle>
          <CardDescription className="font-medium">Next 7 days of scheduled shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Employee</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold">Bureau</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Time</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingShifts.map((shift) => (
                <TableRow key={shift.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-bold">{shift.employee}</TableCell>
                  <TableCell className="font-medium">{shift.role}</TableCell>
                  <TableCell className="font-medium">{shift.bureau}</TableCell>
                  <TableCell className="font-medium">
                    {format(new Date(shift.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {shift.startTime} - {shift.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={shift.status === 'confirmed' ? 'default' : 'secondary'}
                      className="font-semibold"
                    >
                      {shift.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
