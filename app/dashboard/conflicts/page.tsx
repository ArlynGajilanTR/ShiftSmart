'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { api } from '@/lib/api-client';

// Mock conflict data as fallback
const mockConflicts = [
  {
    id: 1,
    type: 'Double Booking',
    severity: 'high',
    employee: 'Marco Rossi',
    description: 'Employee is scheduled for overlapping shifts on the same day',
    date: new Date(2025, 10, 2),
    shifts: [
      { time: '08:00 - 16:00', bureau: 'Milan' },
      { time: '14:00 - 22:00', bureau: 'Rome' },
    ],
    status: 'unresolved',
    detectedAt: new Date(2025, 9, 29),
  },
  {
    id: 2,
    type: 'Rest Period Violation',
    severity: 'high',
    employee: 'Sofia Romano',
    description: 'Less than 11 hours rest between consecutive shifts',
    date: new Date(2025, 10, 3),
    shifts: [
      { time: '16:00 - 00:00', bureau: 'Rome', date: 'Nov 2' },
      { time: '08:00 - 16:00', bureau: 'Rome', date: 'Nov 3' },
    ],
    status: 'unresolved',
    detectedAt: new Date(2025, 9, 29),
  },
  {
    id: 3,
    type: 'Skill Gap',
    severity: 'medium',
    description: 'No senior editor scheduled during this shift',
    date: new Date(2025, 10, 5),
    shifts: [{ time: '00:00 - 08:00', bureau: 'Milan' }],
    status: 'unresolved',
    detectedAt: new Date(2025, 9, 30),
  },
  {
    id: 4,
    type: 'Understaffed',
    severity: 'medium',
    description: 'Only one editor scheduled, minimum requirement is two',
    date: new Date(2025, 10, 6),
    shifts: [{ time: '16:00 - 00:00', bureau: 'Rome' }],
    status: 'unresolved',
    detectedAt: new Date(2025, 9, 30),
  },
  {
    id: 5,
    type: 'Overtime Warning',
    severity: 'low',
    employee: 'Luca Ferrari',
    description: 'Employee approaching maximum weekly hours (45/48)',
    date: new Date(2025, 10, 7),
    status: 'acknowledged',
    detectedAt: new Date(2025, 9, 30),
  },
  {
    id: 6,
    type: 'Cross-Bureau Conflict',
    severity: 'medium',
    employee: 'Giulia Bianchi',
    description: 'Employee scheduled in different bureaus on consecutive days',
    date: new Date(2025, 10, 8),
    shifts: [
      { time: '08:00 - 16:00', bureau: 'Rome', date: 'Nov 7' },
      { time: '08:00 - 16:00', bureau: 'Milan', date: 'Nov 8' },
    ],
    status: 'unresolved',
    detectedAt: new Date(2025, 10, 1),
  },
  {
    id: 7,
    type: 'Double Booking',
    severity: 'high',
    employee: 'Alessandro Conti',
    description: 'Employee is scheduled for overlapping shifts',
    date: new Date(2025, 9, 28),
    shifts: [
      { time: '08:00 - 16:00', bureau: 'Milan' },
      { time: '12:00 - 20:00', bureau: 'Milan' },
    ],
    status: 'resolved',
    detectedAt: new Date(2025, 9, 25),
    resolvedAt: new Date(2025, 9, 26),
  },
];

const conflictTypeIcons = {
  'Double Booking': AlertCircle,
  'Rest Period Violation': AlertTriangle,
  'Skill Gap': Info,
  Understaffed: AlertTriangle,
  'Overtime Warning': Info,
  'Cross-Bureau Conflict': AlertCircle,
};

export default function ConflictsPage() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Fetch conflicts from API
  useEffect(() => {
    async function fetchConflicts() {
      try {
        const response = await api.conflicts.list();
        setConflicts(response.conflicts || []);
      } catch (error: any) {
        console.error('Failed to fetch conflicts:', error);
        toast({
          title: 'Failed to load conflicts',
          description: error.message || 'Using cached data',
          variant: 'destructive',
        });
        // Fallback to mock data
        setConflicts(mockConflicts);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConflicts();
  }, [toast]);

  // Filter conflicts
  const unresolvedConflicts = conflicts.filter((c) => c.status === 'unresolved');
  const acknowledgedConflicts = conflicts.filter((c) => c.status === 'acknowledged');
  const resolvedConflicts = conflicts.filter((c) => c.status === 'resolved');

  const filteredUnresolved =
    selectedSeverity === 'all'
      ? unresolvedConflicts
      : unresolvedConflicts.filter((c) => c.severity === selectedSeverity);

  // Calculate stats
  const stats = {
    total: unresolvedConflicts.length,
    high: unresolvedConflicts.filter((c) => c.severity === 'high').length,
    medium: unresolvedConflicts.filter((c) => c.severity === 'medium').length,
    low: unresolvedConflicts.filter((c) => c.severity === 'low').length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleResolve = async (conflictId: number, conflictType: string) => {
    try {
      await api.conflicts.resolve(String(conflictId));

      // Update local state
      setConflicts((prev) =>
        prev.map((c) =>
          c.id === conflictId ? { ...c, status: 'resolved', resolvedAt: new Date() } : c
        )
      );

      toast({
        title: 'Conflict Resolved',
        description: `${conflictType} has been marked as resolved.`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resolve conflict',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledge = async (conflictId: number, conflictType: string) => {
    try {
      await api.conflicts.acknowledge(String(conflictId));

      // Update local state
      setConflicts((prev) =>
        prev.map((c) => (c.id === conflictId ? { ...c, status: 'acknowledged' } : c))
      );

      toast({
        title: 'Conflict Acknowledged',
        description: `${conflictType} has been acknowledged and moved to the acknowledged list.`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to acknowledge conflict',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = async (conflictId: number) => {
    try {
      await api.conflicts.dismiss(String(conflictId));

      // Update local state - remove from list
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

      toast({
        title: 'Conflict Dismissed',
        description: 'The conflict has been dismissed.',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to dismiss conflict',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conflicts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conflict Detection</h1>
          <p className="text-muted-foreground">Monitor and resolve scheduling conflicts</p>
        </div>
      </div>

      {/* Alert Banner */}
      {stats.high > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>High Priority Conflicts Detected</AlertTitle>
          <AlertDescription>
            You have {stats.high} high-severity conflict{stats.high > 1 ? 's' : ''} that require
            immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Unresolved issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.medium}</div>
            <p className="text-xs text-muted-foreground">Review recommended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.low}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Tabs */}
      <Tabs defaultValue="unresolved">
        <TabsList>
          <TabsTrigger value="unresolved">Unresolved ({unresolvedConflicts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged ({acknowledgedConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedConflicts.length})</TabsTrigger>
        </TabsList>

        {/* Unresolved Conflicts */}
        <TabsContent value="unresolved" className="space-y-4">
          {/* Severity Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedSeverity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('all')}
            >
              All
            </Button>
            <Button
              variant={selectedSeverity === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('high')}
            >
              High
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
            >
              Medium
            </Button>
            <Button
              variant={selectedSeverity === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('low')}
            >
              Low
            </Button>
          </div>

          {/* Conflict List */}
          <div className="space-y-4">
            {filteredUnresolved.map((conflict) => {
              const Icon =
                conflictTypeIcons[conflict.type as keyof typeof conflictTypeIcons] || AlertCircle;
              return (
                <Card key={conflict.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${getSeverityColor(conflict.severity)}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{conflict.type}</CardTitle>
                            <Badge variant={getSeverityBadge(conflict.severity) as any}>
                              {conflict.severity}
                            </Badge>
                          </div>
                          {conflict.employee && (
                            <CardDescription className="font-medium">
                              {conflict.employee}
                            </CardDescription>
                          )}
                          <CardDescription>{conflict.description}</CardDescription>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{conflict.type}</DialogTitle>
                            <DialogDescription>
                              Conflict details and resolution options
                            </DialogDescription>
                          </DialogHeader>
                          <ConflictDetails conflict={conflict} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {format(conflict.date, 'MMMM dd, yyyy')}
                        </span>
                      </div>
                      {conflict.shifts && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Affected Shifts:</span>
                          {conflict.shifts.map((shift: any, idx: number) => (
                            <div key={idx} className="text-sm bg-muted/50 rounded p-2">
                              {shift.date && <span className="font-medium">{shift.date}: </span>}
                              {shift.time} - {shift.bureau}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Detected:</span>
                        <span>{format(conflict.detectedAt, 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleResolve(conflict.id, conflict.type)}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleAcknowledge(conflict.id, conflict.type)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => handleDismiss(conflict.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Acknowledged Conflicts */}
        <TabsContent value="acknowledged" className="space-y-4">
          <div className="space-y-4">
            {acknowledgedConflicts.map((conflict) => {
              const Icon =
                conflictTypeIcons[conflict.type as keyof typeof conflictTypeIcons] || AlertCircle;
              return (
                <Card key={conflict.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${getSeverityColor(conflict.severity)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{conflict.type}</CardTitle>
                          <Badge variant="secondary">acknowledged</Badge>
                        </div>
                        {conflict.employee && (
                          <CardDescription className="font-medium">
                            {conflict.employee}
                          </CardDescription>
                        )}
                        <CardDescription>{conflict.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleResolve(conflict.id, conflict.type)}
                      >
                        Resolve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Resolved Conflicts */}
        <TabsContent value="resolved" className="space-y-4">
          <div className="space-y-4">
            {resolvedConflicts.map((conflict) => {
              return (
                <Card key={conflict.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 mt-0.5 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{conflict.type}</CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            resolved
                          </Badge>
                        </div>
                        {conflict.employee && (
                          <CardDescription className="font-medium">
                            {conflict.employee}
                          </CardDescription>
                        )}
                        <CardDescription>{conflict.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Resolved:{' '}
                        {conflict.resolvedAt && format(conflict.resolvedAt, 'MMM dd, yyyy HH:mm')}
                      </span>
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  );
}

function ConflictDetails({ conflict }: { conflict: any }) {
  const { toast } = useToast();

  const handleResolveFromDialog = async () => {
    try {
      await api.conflicts.resolve(String(conflict.id));
      toast({
        title: 'Conflict Resolved',
        description: `${conflict.type} has been marked as resolved.`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resolve',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledgeFromDialog = async () => {
    try {
      await api.conflicts.acknowledge(String(conflict.id));
      toast({
        title: 'Conflict Acknowledged',
        description: `${conflict.type} has been acknowledged.`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to acknowledge',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Severity:</span>
          <Badge
            variant={
              conflict.severity === 'high'
                ? 'destructive'
                : conflict.severity === 'medium'
                  ? 'default'
                  : 'secondary'
            }
          >
            {conflict.severity}
          </Badge>
        </div>
        {conflict.employee && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Employee:</span>
            <span className="text-sm">{conflict.employee}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Date:</span>
          <span className="text-sm">{format(conflict.date, 'MMMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Detected:</span>
          <span className="text-sm">{format(conflict.detectedAt, 'MMM dd, yyyy HH:mm')}</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Description:</span>
        <p className="text-sm text-muted-foreground">{conflict.description}</p>
      </div>

      {conflict.shifts && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Affected Shifts:</span>
          <div className="space-y-2">
            {conflict.shifts.map((shift: any, idx: number) => (
              <div key={idx} className="bg-muted rounded p-3 text-sm">
                {shift.date && <div className="font-medium mb-1">{shift.date}</div>}
                <div>
                  {shift.time} - {shift.bureau}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-4">
        <span className="text-sm font-medium">Suggested Actions:</span>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {conflict.type === 'Double Booking' && (
            <>
              <li>Remove one of the overlapping shifts</li>
              <li>Reassign one shift to another employee</li>
              <li>Adjust shift times to eliminate overlap</li>
            </>
          )}
          {conflict.type === 'Rest Period Violation' && (
            <>
              <li>Extend rest period between shifts</li>
              <li>Reassign one shift to another employee</li>
              <li>Adjust shift start/end times</li>
            </>
          )}
          {conflict.type === 'Skill Gap' && (
            <>
              <li>Assign a senior editor to this shift</li>
              <li>Promote a junior editor for this shift</li>
              <li>Request coverage from another bureau</li>
            </>
          )}
        </ul>
      </div>

      <div className="flex gap-2 pt-4">
        <Button className="flex-1" onClick={handleResolveFromDialog}>
          Mark as Resolved
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={handleAcknowledgeFromDialog}
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}
