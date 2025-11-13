'use client';

import { useState } from 'react';
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
import { ArrowLeft, Save, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

// Mock employee data - in real app, fetch based on params.id
const mockEmployee = {
  id: 1,
  name: 'Marco Rossi',
  email: 'marco.rossi@reuters.com',
  phone: '+39 02 1234 5678',
  role: 'Senior Editor',
  bureau: 'Milan',
  status: 'active',
  shiftsThisMonth: 18,
  initials: 'MR',
  preferences: {
    preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    preferredShifts: ['Morning', 'Afternoon'],
    maxShiftsPerWeek: 5,
    notes: 'Prefers morning shifts. Available for weekend coverage in emergencies.',
  },
};

export default function EmployeeDetailPage({ params: _params }: { params: { id: string } }) {
  const router = useRouter();
  const [employee, setEmployee] = useState(mockEmployee);
  const [isEditing, setIsEditing] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night'];

  const handleSave = () => {
    // In real app, save to backend
    console.log('[v0] Saving employee data:', employee);
    setIsEditing(false);
    // Show success message
  };

  const togglePreferredDay = (day: string) => {
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
          <Button onClick={handleSave} className="transition-all hover:scale-105">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

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
            <div className="text-2xl font-bold">{employee.preferences.preferredDays.length}</div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Shifts/Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employee.preferences.maxShiftsPerWeek}</div>
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
            <CardHeader className="border-l-4 border-l-charcoal">
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead Editor">Lead Editor</SelectItem>
                      <SelectItem value="Senior Editor">Senior Editor</SelectItem>
                      <SelectItem value="Junior Editor">Junior Editor</SelectItem>
                      <SelectItem value="Support Staff">Support Staff</SelectItem>
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
                        <SelectValue />
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
                      checked={employee.preferences.preferredDays.includes(day)}
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
            <CardHeader className="border-l-4 border-l-charcoal">
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
                      checked={employee.preferences.preferredShifts.includes(shift)}
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
                  value={employee.preferences.maxShiftsPerWeek.toString()}
                  onValueChange={(value) =>
                    setEmployee({
                      ...employee,
                      preferences: {
                        ...employee.preferences,
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
                  value={employee.preferences.notes}
                  onChange={(e) =>
                    setEmployee({
                      ...employee,
                      preferences: { ...employee.preferences, notes: e.target.value },
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
            <CardHeader className="border-l-4 border-l-charcoal">
              <CardTitle>Recent Shifts</CardTitle>
              <CardDescription>Past shift assignments and attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Oct 28, 2025', shift: 'Morning', bureau: 'Milan', status: 'Completed' },
                  {
                    date: 'Oct 27, 2025',
                    shift: 'Afternoon',
                    bureau: 'Milan',
                    status: 'Completed',
                  },
                  { date: 'Oct 25, 2025', shift: 'Morning', bureau: 'Milan', status: 'Completed' },
                  { date: 'Oct 24, 2025', shift: 'Evening', bureau: 'Milan', status: 'Completed' },
                  { date: 'Oct 22, 2025', shift: 'Morning', bureau: 'Milan', status: 'Completed' },
                ].map((shift, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-accent"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">{shift.date}</div>
                      <Badge variant="outline">{shift.shift}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {shift.bureau}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                      {shift.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
