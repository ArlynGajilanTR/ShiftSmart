'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, Loader2, AlertCircle, Info, CalendarX } from 'lucide-react';
import { TimeOffRequest } from '@/types';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';

const timeOffTypes = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'personal', label: 'Personal Day' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'other', label: 'Other' },
];

export default function MyTimeOffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeOffEntries, setTimeOffEntries] = useState<TimeOffRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    type: 'vacation' as TimeOffRequest['type'],
    notes: '',
  });

  // Fetch time-off entries
  useEffect(() => {
    const fetchTimeOff = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/time-off', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || `Failed to fetch time-off entries (${response.status})`;

          // Check if it's a migration error
          if (response.status === 503 && errorMessage.includes('migration')) {
            setMigrationError(errorMessage);
          }

          throw new Error(errorMessage);
        }

        // Clear migration error on success
        setMigrationError(null);

        const data = await response.json();
        setTimeOffEntries(data.time_off_requests || []);
      } catch (error: any) {
        console.error('Error fetching time-off entries:', error);
        toast({
          title: 'Error loading time-off entries',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeOff();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date || !formData.type) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in start date, end date, and type',
        variant: 'destructive',
      });
      return;
    }

    // Validate date range
    const start = parseISO(formData.start_date);
    const end = parseISO(formData.end_date);
    if (end < start) {
      toast({
        title: 'Invalid date range',
        description: 'End date must be on or after start date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/time-off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create time-off entry');
      }

      const data = await response.json();
      setTimeOffEntries(
        [...timeOffEntries, data.time_off_request].sort((a, b) =>
          a.start_date.localeCompare(b.start_date)
        )
      );

      toast({
        title: 'Time-off entry created',
        description: 'Your time-off entry has been added successfully',
      });

      // Reset form
      setFormData({
        start_date: '',
        end_date: '',
        type: 'vacation',
        notes: '',
      });
      setShowForm(false);
    } catch (error: any) {
      console.error('Error creating time-off entry:', error);
      toast({
        title: 'Failed to create time-off entry',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time-off entry?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/time-off/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time-off entry');
      }

      setTimeOffEntries(timeOffEntries.filter((entry) => entry.id !== id));
      toast({
        title: 'Time-off entry deleted',
        description: 'The entry has been removed successfully',
      });
    } catch (error: any) {
      console.error('Error deleting time-off entry:', error);
      toast({
        title: 'Failed to delete time-off entry',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadgeVariant = (type: TimeOffRequest['type']) => {
    switch (type) {
      case 'vacation':
        return 'default';
      case 'personal':
        return 'secondary';
      case 'sick':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const isPastEntry = (endDate: string) => {
    return isBefore(parseISO(endDate), startOfToday());
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (start === end) {
      return format(startDate, 'MMM d, yyyy');
    }
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Time Off</h1>
        <p className="text-muted-foreground">
          Enter your pre-approved vacation and personal time off. Only enter dates that have already
          been approved through your bureau's leave system.
        </p>
      </div>

      {/* Migration Error Alert */}
      {migrationError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Database Migration Required</AlertTitle>
          <AlertDescription className="text-red-700">
            {migrationError}
            <br />
            <br />
            Please run the database migration:{' '}
            <code className="text-xs bg-red-100 px-1 py-0.5 rounded">
              supabase/migrations/002_time_off_requests.sql
            </code>
          </AlertDescription>
        </Alert>
      )}

      {/* Important Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Pre-Approval Required</AlertTitle>
        <AlertDescription className="text-blue-700">
          Only enter time-off dates that have already been approved through your bureau's official
          leave system. These dates will be respected by the AI schedule generator as hard
          constraints.
        </AlertDescription>
      </Alert>

      {/* Add New Entry Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Time Off Entry
        </Button>
      )}

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Time Off Entry</CardTitle>
            <CardDescription>Enter your pre-approved time off dates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as TimeOffRequest['type'] })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOffTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details about your time off"
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Entry
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      start_date: '',
                      end_date: '',
                      type: 'vacation',
                      notes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Time Off Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="h-5 w-5" />
            Your Time Off Entries
          </CardTitle>
          <CardDescription>
            {timeOffEntries.length === 0
              ? 'No time-off entries yet'
              : `${timeOffEntries.length} ${timeOffEntries.length === 1 ? 'entry' : 'entries'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeOffEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time-off entries yet. Click "Add Time Off Entry" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeOffEntries.map((entry) => {
                const isPast = isPastEntry(entry.end_date);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isPast ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getTypeBadgeVariant(entry.type)}>
                          {timeOffTypes.find((t) => t.value === entry.type)?.label}
                        </Badge>
                        {isPast && (
                          <Badge variant="outline" className="text-xs">
                            Past
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">
                        {formatDateRange(entry.start_date, entry.end_date)}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                    {!isPast && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
