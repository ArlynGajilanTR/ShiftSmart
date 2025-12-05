'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save, Mail, Phone, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bureau: string;
  status: string;
  shiftsThisMonth: number;
  initials: string;
  preferences: {
    preferredDays: string[];
    preferredShifts: string[];
    maxShiftsPerWeek: number;
    notes: string;
  } | null;
}

interface ShiftHistory {
  id: string;
  date: string;
  shiftType: string;
  bureau: string;
  status: string;
  startTime: string;
  endTime: string;
}

// Default employee structure for when data is loading
const defaultEmployee: Employee = {
  id: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  bureau: '',
  status: 'active',
  shiftsThisMonth: 0,
  initials: '??',
  preferences: {
    preferredDays: [],
    preferredShifts: [],
    maxShiftsPerWeek: 5,
    notes: '',
  },
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params is now a Promise - use React.use() in client components
  const { id } = use(params);

  const router = useRouter();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee>(defaultEmployee);
  const [originalEmployee, setOriginalEmployee] = useState<Employee>(defaultEmployee);
  const [shiftHistory, setShiftHistory] = useState<ShiftHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night'];

  // Fetch employee data from API
  useEffect(() => {
    const fetchEmployee = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch employee details
        const response = await fetch(`/api/employees/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Employee not found');
          }
          throw new Error('Failed to fetch employee');
        }

        const data = await response.json();

        // Map API response to component state
        const employeeData: Employee = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role || '',
          bureau: data.bureau || '',
          status: data.status || 'active',
          shiftsThisMonth: data.shiftsThisMonth || 0,
          initials:
            data.initials ||
            data.name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase() ||
            '??',
          preferences: data.preferences || {
            preferredDays: [],
            preferredShifts: [],
            maxShiftsPerWeek: 5,
            notes: '',
          },
        };

        setEmployee(employeeData);
        setOriginalEmployee(employeeData);

        // Fetch shift history
        await fetchShiftHistory(token);
      } catch (error: any) {
        console.error('Error fetching employee:', error);
        setLoadError(error.message || 'Failed to load employee');
        toast({
          title: 'Error loading employee',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, router, toast]);

  // Fetch shift history for employee
  const fetchShiftHistory = async (token: string) => {
    try {
      const response = await fetch(`/api/shifts?employee_id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const shifts = (data.shifts || []).map((shift: any) => {
          const startTime = new Date(shift.start_time);
          const endTime = new Date(shift.end_time);
          const hour = startTime.getHours();

          // Determine shift type based on start time
          let shiftType = 'Morning';
          if (hour >= 12 && hour < 17) shiftType = 'Afternoon';
          else if (hour >= 17 && hour < 21) shiftType = 'Evening';
          else if (hour >= 21 || hour < 6) shiftType = 'Night';

          return {
            id: shift.id,
            date: startTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            shiftType,
            bureau: shift.bureau_name || shift.bureaus?.name || 'Unknown',
            status:
              shift.assignment_status === 'completed'
                ? 'Completed'
                : shift.assignment_status === 'confirmed'
                  ? 'Confirmed'
                  : shift.assignment_status === 'declined'
                    ? 'Declined'
                    : 'Assigned',
            startTime: startTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        });

        // Sort by date descending (most recent first)
        shifts.sort(
          (a: ShiftHistory, b: ShiftHistory) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setShiftHistory(shifts.slice(0, 20)); // Show last 20 shifts
      }
    } catch (error) {
      console.error('Error fetching shift history:', error);
      // Don't show error toast for shift history - it's not critical
    }
  };

  // Save employee data and preferences
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Update employee details
      const employeeResponse = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          bureau: employee.bureau,
          status: employee.status,
        }),
      });

      if (!employeeResponse.ok) {
        const errorData = await employeeResponse.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }

      // Update preferences
      if (employee.preferences) {
        const prefsResponse = await fetch(`/api/employees/${id}/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferred_days: employee.preferences.preferredDays,
            preferred_shifts: employee.preferences.preferredShifts,
            max_shifts_per_week: employee.preferences.maxShiftsPerWeek,
            notes: employee.preferences.notes,
          }),
        });

        if (!prefsResponse.ok) {
          const errorData = await prefsResponse.json();
          throw new Error(errorData.error || 'Failed to update preferences');
        }
      }

      // Update original state to reflect saved changes
      setOriginalEmployee(employee);

      toast({
        title: 'Changes saved',
        description: `${employee.name}'s profile has been updated successfully`,
      });
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Failed to save changes',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreferredDay = (day: string) => {
    if (!employee.preferences) return;
    setEmployee({
      ...employee,
      preferences: {
        ...employee.preferences,
        preferredDays: employee.preferences.preferredDays.includes(day)
          ? employee.preferences.preferredDays.filter((d) => d !== day)
          : [...employee.preferences.preferredDays, day],
      },
    });
  };

  const togglePreferredShift = (shift: string) => {
    if (!employee.preferences) return;
    setEmployee({
      ...employee,
      preferences: {
        ...employee.preferences,
        preferredShifts: employee.preferences.preferredShifts.includes(shift)
          ? employee.preferences.preferredShifts.filter((s) => s !== shift)
          : [...employee.preferences.preferredShifts, shift],
      },
    });
  };

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(employee) !== JSON.stringify(originalEmployee);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Employee</h2>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="transition-transform hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {employee.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{employee.name}</h1>
              <p className="text-muted-foreground">
                {employee.role} • {employee.bureau}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="transition-all hover:scale-105"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-lg text-sm">
          You have unsaved changes
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={employee.status === 'active' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {employee.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shifts This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.shiftsThisMonth}</div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preferred Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.preferences?.preferredDays.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Shifts/Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.preferences?.maxShiftsPerWeek || 5}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="preferences">Shift Preferences</TabsTrigger>
          <TabsTrigger value="history">Shift History</TabsTrigger>
        </TabsList>

        {/* Employee Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-primary">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic employee information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={employee.name}
                    onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={employee.email}
                      onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={employee.phone}
                      onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Employment Status</Label>
                  <Select
                    value={employee.status}
                    onValueChange={(value) => setEmployee({ ...employee, status: value })}
                  >
                    <SelectTrigger
                      id="status"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-muted-foreground">
              <CardTitle>Role & Bureau</CardTitle>
              <CardDescription>Position and location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Title</Label>
                  <Select
                    value={employee.role}
                    onValueChange={(value) => setEmployee({ ...employee, role: value })}
                  >
                    <SelectTrigger
                      id="role"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead Editor">Lead Editor</SelectItem>
                      <SelectItem value="Senior Editor">Senior Editor</SelectItem>
                      <SelectItem value="Junior Editor">Junior Editor</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Senior Correspondent">Senior Correspondent</SelectItem>
                      <SelectItem value="Correspondent">Correspondent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bureau">Bureau Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={employee.bureau}
                      onValueChange={(value) => setEmployee({ ...employee, bureau: value })}
                    >
                      <SelectTrigger
                        id="bureau"
                        className="pl-9 transition-all focus:ring-2 focus:ring-primary"
                      >
                        <SelectValue placeholder="Select bureau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Milan">Milan</SelectItem>
                        <SelectItem value="Rome">Rome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-primary">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Preferred Days
              </CardTitle>
              <CardDescription>Select the days this employee prefers to work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="flex items-center space-x-2 p-3 rounded-lg border transition-all hover:bg-accent cursor-pointer"
                    onClick={() => togglePreferredDay(day)}
                  >
                    <Checkbox
                      id={day}
                      checked={employee.preferences?.preferredDays.includes(day) || false}
                      onCheckedChange={() => togglePreferredDay(day)}
                    />
                    <label htmlFor={day} className="text-sm font-medium cursor-pointer">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-muted-foreground">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Preferred Shift Types
              </CardTitle>
              <CardDescription>Select the shift times this employee prefers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {shiftTypes.map((shift) => (
                  <div
                    key={shift}
                    className="flex items-center space-x-2 p-3 rounded-lg border transition-all hover:bg-accent cursor-pointer"
                    onClick={() => togglePreferredShift(shift)}
                  >
                    <Checkbox
                      id={shift}
                      checked={employee.preferences?.preferredShifts.includes(shift) || false}
                      onCheckedChange={() => togglePreferredShift(shift)}
                    />
                    <label htmlFor={shift} className="text-sm font-medium cursor-pointer">
                      {shift}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-primary">
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>Configure shift limits and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxShifts">Maximum Shifts Per Week</Label>
                <Select
                  value={(employee.preferences?.maxShiftsPerWeek || 5).toString()}
                  onValueChange={(value) =>
                    setEmployee({
                      ...employee,
                      preferences: {
                        ...(employee.preferences || {
                          preferredDays: [],
                          preferredShifts: [],
                          notes: '',
                        }),
                        maxShiftsPerWeek: Number.parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger
                    id="maxShifts"
                    className="transition-all focus:ring-2 focus:ring-primary"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 shifts</SelectItem>
                    <SelectItem value="4">4 shifts</SelectItem>
                    <SelectItem value="5">5 shifts</SelectItem>
                    <SelectItem value="6">6 shifts</SelectItem>
                    <SelectItem value="7">7 shifts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={employee.preferences?.notes || ''}
                  onChange={(e) =>
                    setEmployee({
                      ...employee,
                      preferences: {
                        ...(employee.preferences || {
                          preferredDays: [],
                          preferredShifts: [],
                          maxShiftsPerWeek: 5,
                        }),
                        notes: e.target.value,
                      },
                    })
                  }
                  placeholder="Any additional preferences or constraints..."
                  className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift History Tab */}
        <TabsContent value="history">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="border-l-4 border-l-muted-foreground">
              <CardTitle>Recent Shifts</CardTitle>
              <CardDescription>Past shift assignments and attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {shiftHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shift history available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shiftHistory.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-accent"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">{shift.date}</div>
                        <Badge variant="outline">{shift.shiftType}</Badge>
                        <div className="text-sm text-muted-foreground">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {shift.bureau}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          shift.status === 'Completed'
                            ? 'bg-green-500/10 text-green-700'
                            : shift.status === 'Confirmed'
                              ? 'bg-blue-500/10 text-blue-700'
                              : shift.status === 'Declined'
                                ? 'bg-red-500/10 text-red-700'
                                : 'bg-yellow-500/10 text-yellow-700'
                        }
                      >
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
