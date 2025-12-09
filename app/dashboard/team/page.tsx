'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Users,
  Check,
  X,
  Edit,
  Save,
  Loader2,
  Shield,
  Building2,
  CalendarX,
  Calendar,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  title: string;
  shift_role: string;
  is_team_leader: boolean;
  bureau_id: string;
  bureau_name: string;
  preferences: {
    preferred_days: string[];
    preferred_shifts: string[];
    max_shifts_per_week: number;
    notes: string;
    confirmed: boolean;
    confirmed_by: string | null;
    confirmed_by_name: string | null;
    confirmed_at: string | null;
  };
  status: 'confirmed' | 'pending' | 'missing';
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  missing: number;
}

interface TeamTimeOffEntry {
  id: string;
  user_id: string;
  employee_name: string;
  employee_email: string;
  employee_title: string;
  employee_role: string;
  bureau_id: string | null;
  bureau_name: string;
  start_date: string;
  end_date: string;
  type: 'vacation' | 'personal' | 'sick' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface TimeOffStats {
  total_requests: number;
  employees_with_time_off: number;
  by_type: {
    vacation: number;
    personal: number;
    sick: number;
    other: number;
  };
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function TeamAvailabilityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, pending: 0, missing: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBureau, setFilterBureau] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Edit dialog state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editPreferences, setEditPreferences] = useState({
    preferred_days: [] as string[],
    preferred_shifts: [] as string[],
    max_shifts_per_week: 5,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Confirm all dialog
  const [showConfirmAllDialog, setShowConfirmAllDialog] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  // Track individual confirm in progress
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Team time-off state
  const [timeOffEntries, setTimeOffEntries] = useState<TeamTimeOffEntry[]>([]);
  const [timeOffStats, setTimeOffStats] = useState<TimeOffStats | null>(null);
  const [isLoadingTimeOff, setIsLoadingTimeOff] = useState(true);
  const [activeTab, setActiveTab] = useState('availability');

  // Fetch team availability data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await api.team.getAvailability();
      setEmployees(data.employees || []);
      setStats(data.stats || { total: 0, confirmed: 0, pending: 0, missing: 0 });
    } catch (error: any) {
      console.error('Error fetching team availability:', error);
      // Handle 403 access denied
      if (error.message?.includes('403') || error.message?.includes('team leader')) {
        toast({
          title: 'Access Denied',
          description: 'Only team leaders and administrators can access this page.',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }
      toast({
        title: 'Error loading data',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch team time-off data
  const fetchTimeOff = async () => {
    setIsLoadingTimeOff(true);
    try {
      // Default to next 30 days
      const today = new Date();
      const endDate = addDays(today, 30);

      const data = await api.team.getTimeOff({
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      setTimeOffEntries(data.time_off_requests || []);
      setTimeOffStats(data.stats || null);
    } catch (error: any) {
      console.error('Error fetching team time-off:', error);
      // Don't show error toast - time-off feature might not be initialized
      if (!error.message?.includes('migration')) {
        toast({
          title: 'Error loading time-off data',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingTimeOff(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTimeOff();
  }, [router, toast]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBureau, filterStatus]);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBureau = filterBureau === 'all' || emp.bureau_name === filterBureau;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesBureau && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pagedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Confirm single employee preferences
  const confirmPreferences = async (employeeId: string) => {
    setConfirmingId(employeeId);
    try {
      const data = await api.employees.confirmPreferences(employeeId);
      toast({
        title: 'Preferences confirmed',
        description: data.message,
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error confirming preferences:', error);
      toast({
        title: 'Failed to confirm',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setConfirmingId(null);
    }
  };

  // Confirm all pending preferences
  const confirmAll = async () => {
    setIsConfirmingAll(true);
    try {
      const data = await api.team.confirmAll();
      toast({
        title: 'All preferences confirmed',
        description: data.message,
      });

      setShowConfirmAllDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error confirming all:', error);
      toast({
        title: 'Failed to confirm all',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingAll(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditPreferences({
      preferred_days: employee.preferences.preferred_days,
      preferred_shifts: employee.preferences.preferred_shifts,
      max_shifts_per_week: employee.preferences.max_shifts_per_week,
      notes: employee.preferences.notes,
    });
  };

  // Save edited preferences
  const savePreferences = async (autoConfirm: boolean) => {
    if (!editingEmployee) return;

    setIsSaving(true);
    try {
      await api.employees.updatePreferences(editingEmployee.id, {
        ...editPreferences,
        auto_confirm: autoConfirm,
      });

      toast({
        title: autoConfirm ? 'Preferences saved and confirmed' : 'Preferences saved',
        description: `Updated preferences for ${editingEmployee.full_name}`,
      });

      setEditingEmployee(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Failed to save',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle day in edit form
  const toggleEditDay = (day: string) => {
    setEditPreferences((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  // Toggle shift in edit form
  const toggleEditShift = (shift: string) => {
    setEditPreferences((prev) => ({
      ...prev,
      preferred_shifts: prev.preferred_shifts.includes(shift)
        ? prev.preferred_shifts.filter((s) => s !== shift)
        : [...prev.preferred_shifts, shift],
    }));
  };

  // Get unique bureaus for filter
  const bureaus = [...new Set(employees.map((e) => e.bureau_name))];

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'missing':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Missing
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Helper for time-off type badge
  const getTimeOffTypeBadge = (type: string) => {
    switch (type) {
      case 'vacation':
        return <Badge variant="default">Vacation</Badge>;
      case 'personal':
        return <Badge variant="secondary">Personal</Badge>;
      case 'sick':
        return <Badge variant="destructive">Sick</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  // Format date range for display
  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (start === end) {
      return format(startDate, 'MMM d, yyyy');
    }
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Review availability and time-off for your team</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="time-off" className="flex items-center gap-2">
            <CalendarX className="h-4 w-4" />
            Time Off
            {timeOffStats && timeOffStats.total_requests > 0 && (
              <Badge variant="secondary" className="ml-1">
                {timeOffStats.total_requests}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowConfirmAllDialog(true)}
              disabled={stats.pending === 0 && stats.missing === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm All Pending
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{stats.confirmed}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{stats.missing}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterBureau} onValueChange={setFilterBureau}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Bureau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bureaus</SelectItem>
                    {bureaus.map((bureau) => (
                      <SelectItem key={bureau} value={bureau}>
                        {bureau}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Preferred Days</TableHead>
                    <TableHead>Preferred Shifts</TableHead>
                    <TableHead>Max/Week</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {employee.full_name}
                            {employee.is_team_leader && (
                              <span title="Team Leader">
                                <Shield className="h-3 w-3 text-primary" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{employee.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.bureau_name}</TableCell>
                      <TableCell>
                        {employee.preferences.preferred_days.length > 0 ? (
                          <span className="text-sm">
                            {employee.preferences.preferred_days
                              .map((d) => d.slice(0, 3))
                              .join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.preferences.preferred_shifts.length > 0 ? (
                          <span className="text-sm">
                            {employee.preferences.preferred_shifts.join(', ')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{employee.preferences.max_shifts_per_week}</TableCell>
                      <TableCell>
                        <StatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {employee.status !== 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmPreferences(employee.id)}
                              disabled={confirmingId === employee.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {confirmingId === employee.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No employees match your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {filteredEmployees.length > pageSize && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, filteredEmployees.length)} of{' '}
                    {filteredEmployees.length} employees
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="time-off" className="space-y-6">
          {/* Time Off Stats */}
          {timeOffStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timeOffStats.total_requests}</div>
                  <p className="text-xs text-muted-foreground">Next 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employees Off
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timeOffStats.employees_with_time_off}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    Vacation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {timeOffStats.by_type.vacation}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                    Sick Leave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{timeOffStats.by_type.sick}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Time Off Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarX className="h-5 w-5" />
                Upcoming Time Off
              </CardTitle>
              <CardDescription>
                Team members' scheduled time off for the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimeOff ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : timeOffEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No time-off scheduled in the next 30 days</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeOffEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.employee_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.employee_title}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.bureau_name}</TableCell>
                        <TableCell className="font-medium">
                          {formatDateRange(entry.start_date, entry.end_date)}
                        </TableCell>
                        <TableCell>{getTimeOffTypeBadge(entry.type)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {entry.notes || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Preferences: {editingEmployee?.full_name}</DialogTitle>
            <DialogDescription>
              {editingEmployee?.bureau_name} Bureau • {editingEmployee?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preferred Days */}
            <div className="space-y-2">
              <Label>Preferred Days</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-sm ${
                      editPreferences.preferred_days.includes(day)
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleEditDay(day)}
                  >
                    <Checkbox
                      checked={editPreferences.preferred_days.includes(day)}
                      onCheckedChange={() => toggleEditDay(day)}
                    />
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Shifts */}
            <div className="space-y-2">
              <Label>Preferred Shifts</Label>
              <div className="flex flex-wrap gap-2">
                {shiftTypes.map((shift) => (
                  <div
                    key={shift}
                    className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-sm ${
                      editPreferences.preferred_shifts.includes(shift)
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleEditShift(shift)}
                  >
                    <Checkbox
                      checked={editPreferences.preferred_shifts.includes(shift)}
                      onCheckedChange={() => toggleEditShift(shift)}
                    />
                    {shift}
                  </div>
                ))}
              </div>
            </div>

            {/* Max Shifts */}
            <div className="space-y-2">
              <Label>Max Shifts Per Week</Label>
              <Select
                value={editPreferences.max_shifts_per_week.toString()}
                onValueChange={(value) =>
                  setEditPreferences((prev) => ({
                    ...prev,
                    max_shifts_per_week: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} shifts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editPreferences.notes}
                onChange={(e) =>
                  setEditPreferences((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional constraints or preferences..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingEmployee(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => savePreferences(false)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
            <Button onClick={() => savePreferences(true)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save & Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm All Dialog */}
      <AlertDialog open={showConfirmAllDialog} onOpenChange={setShowConfirmAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm All Pending Preferences</AlertDialogTitle>
            <AlertDialogDescription>
              This will confirm preferences for all {stats.pending + stats.missing} employee(s) with
              pending or missing preferences. Employees with missing preferences will have default
              values applied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAll} disabled={isConfirmingAll}>
              {isConfirmingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirming...
                </>
              ) : (
                'Confirm All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
