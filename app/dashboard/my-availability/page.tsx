'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Calendar, Clock, Save, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Preferences {
  preferred_days: string[];
  preferred_shifts: string[];
  max_shifts_per_week: number;
  notes: string;
  confirmed: boolean;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shiftTypes = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function MyAvailabilityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    preferred_days: [],
    preferred_shifts: [],
    max_shifts_per_week: 5,
    notes: '',
    confirmed: false,
    confirmed_by: null,
    confirmed_by_name: null,
    confirmed_at: null,
  });
  const [originalPreferences, setOriginalPreferences] = useState<Preferences | null>(null);

  // Fetch current user and their preferences
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Get current user
        const userResponse = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user');
        }

        const { user } = await userResponse.json();
        setUserId(user.id);

        // Get preferences
        const prefsResponse = await fetch(`/api/employees/${user.id}/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          const prefs = {
            preferred_days: prefsData.preferred_days || [],
            preferred_shifts: prefsData.preferred_shifts || [],
            max_shifts_per_week: prefsData.max_shifts_per_week || 5,
            notes: prefsData.notes || '',
            confirmed: prefsData.confirmed || false,
            confirmed_by: prefsData.confirmed_by || null,
            confirmed_by_name: prefsData.confirmed_by_name || null,
            confirmed_at: prefsData.confirmed_at || null,
          };
          setPreferences(prefs);
          setOriginalPreferences(prefs);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error loading preferences',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, toast]);

  const toggleDay = (day: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  const toggleShift = (shift: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_shifts: prev.preferred_shifts.includes(shift)
        ? prev.preferred_shifts.filter((s) => s !== shift)
        : [...prev.preferred_shifts, shift],
    }));
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  const handleSave = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/employees/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_days: preferences.preferred_days,
          preferred_shifts: preferences.preferred_shifts,
          max_shifts_per_week: preferences.max_shifts_per_week,
          notes: preferences.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      const updatedData = await response.json();

      // Update local state with response
      const updatedPrefs = {
        preferred_days: updatedData.preferred_days || [],
        preferred_shifts: updatedData.preferred_shifts || [],
        max_shifts_per_week: updatedData.max_shifts_per_week || 5,
        notes: updatedData.notes || '',
        confirmed: updatedData.confirmed || false,
        confirmed_by: updatedData.confirmed_by || null,
        confirmed_by_name: updatedData.confirmed_by_name || null,
        confirmed_at: updatedData.confirmed_at || null,
      };

      setPreferences(updatedPrefs);
      setOriginalPreferences(updatedPrefs);

      toast({
        title: 'Preferences saved',
        description:
          'Your availability preferences have been updated. A team leader will review and confirm them.',
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Availability</h1>
        <p className="text-muted-foreground">
          Set your shift preferences. Changes require team leader approval.
        </p>
      </div>

      {/* Status Banner */}
      {preferences.confirmed ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Preferences Confirmed</AlertTitle>
          <AlertDescription className="text-green-700">
            Your preferences were confirmed by {preferences.confirmed_by_name || 'a team leader'} on{' '}
            {preferences.confirmed_at
              ? new Date(preferences.confirmed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'unknown date'}
            . Making changes will require re-approval.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Pending Approval</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your preferences are pending team leader approval. They will be used for scheduling once
            confirmed.
          </AlertDescription>
        </Alert>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Unsaved Changes</AlertTitle>
          <AlertDescription className="text-orange-700">
            You have unsaved changes. Click "Save Preferences" to submit them for approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Preferred Days */}
      <Card>
        <CardHeader className="border-l-4 border-l-primary">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preferred Days
          </CardTitle>
          <CardDescription>
            Select the days you prefer to work. Leave empty if you have no preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4 md:grid-cols-7">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                  preferences.preferred_days.includes(day) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleDay(day)}
              >
                <Checkbox
                  id={day}
                  checked={preferences.preferred_days.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                />
                <label htmlFor={day} className="text-sm font-medium cursor-pointer">
                  {day.slice(0, 3)}
                </label>
              </div>
            ))}
          </div>
          {preferences.preferred_days.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Selected: {preferences.preferred_days.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preferred Shifts */}
      <Card>
        <CardHeader className="border-l-4 border-l-muted-foreground">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Preferred Shift Types
          </CardTitle>
          <CardDescription>
            Select the shift times you prefer. Leave empty if you have no preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {shiftTypes.map((shift) => (
              <div
                key={shift}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                  preferences.preferred_shifts.includes(shift) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleShift(shift)}
              >
                <Checkbox
                  id={shift}
                  checked={preferences.preferred_shifts.includes(shift)}
                  onCheckedChange={() => toggleShift(shift)}
                />
                <label htmlFor={shift} className="text-sm font-medium cursor-pointer">
                  {shift}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>
              Morning: 08:00 - 16:00 | Afternoon: 16:00 - 00:00 | Evening: 17:00 - 21:00 | Night:
              00:00 - 08:00
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardHeader className="border-l-4 border-l-primary">
          <CardTitle>Availability Settings</CardTitle>
          <CardDescription>Configure your maximum shifts and add any notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxShifts">Maximum Shifts Per Week</Label>
            <Select
              value={preferences.max_shifts_per_week.toString()}
              onValueChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  max_shifts_per_week: parseInt(value),
                }))
              }
            >
              <SelectTrigger id="maxShifts" className="w-full sm:w-48">
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
              value={preferences.notes}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Any additional constraints or preferences (e.g., 'Unavailable on Tuesdays for childcare', 'Prefer not to work consecutive night shifts')"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Include any specific dates you're unavailable or special circumstances your team
              leader should know about.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {preferences.confirmed && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          )}
          {!preferences.confirmed && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
