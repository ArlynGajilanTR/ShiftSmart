'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Eye,
  Inbox,
  Shield,
  Sparkles,
  UserCheck,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { api } from '@/lib/api-client';

// Conflict type definition for internal use
interface ConflictData {
  id: string | number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  status: 'unresolved' | 'acknowledged' | 'resolved';
  employee?: string | null;
  description: string;
  date: Date;
  shifts?: Array<{ time: string; bureau: string; date?: string }>;
  detectedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  details?: any;
}

// Helper to safely parse dates (handles both Date objects and ISO strings)
function safeParseDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : new Date();
  }
  return new Date();
}

// Helper to safely format dates
function safeFormatDate(value: any, formatString: string): string {
  try {
    const date = safeParseDate(value);
    return isValid(date) ? format(date, formatString) : 'N/A';
  } catch {
    return 'N/A';
  }
}

// Normalize conflict data from API (snake_case) or mock (camelCase)
function normalizeConflict(raw: any): ConflictData {
  return {
    id: raw.id,
    type: raw.type,
    severity: raw.severity,
    status: raw.status,
    employee: raw.employee || null,
    description: raw.description,
    date: safeParseDate(raw.date),
    shifts: raw.shifts || [],
    detectedAt: safeParseDate(raw.detectedAt || raw.detected_at),
    resolvedAt:
      raw.resolvedAt || raw.resolved_at
        ? safeParseDate(raw.resolvedAt || raw.resolved_at)
        : undefined,
    acknowledgedAt:
      raw.acknowledgedAt || raw.acknowledged_at
        ? safeParseDate(raw.acknowledgedAt || raw.acknowledged_at)
        : undefined,
    details: raw.details || {},
  };
}

const conflictTypeIcons: Record<string, typeof AlertCircle> = {
  'Double Booking': AlertCircle,
  'Rest Period Violation': AlertTriangle,
  'Skill Gap': Info,
  Understaffed: AlertTriangle,
  'Overtime Warning': Info,
  'Cross-Bureau Conflict': AlertCircle,
  'Preference Violation': Info,
};

// Empty state component
function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  icon?: typeof Inbox;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );
}

export default function ScheduleHealthPage() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Fetch conflicts from API
  useEffect(() => {
    async function fetchConflicts() {
      try {
        const response = await api.conflicts.list();
        const normalized = (response.conflicts || []).map(normalizeConflict);
        setConflicts(normalized);
      } catch (error: any) {
        console.error('Failed to fetch conflicts:', error);
        toast({
          title: 'Failed to load schedule health data',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
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

  // User overrides (acknowledged = user forced despite warning)
  const userOverrides = acknowledgedConflicts.filter((c) =>
    c.description?.includes('[User Override]')
  );

  const filteredUnresolved =
    selectedSeverity === 'all'
      ? unresolvedConflicts
      : unresolvedConflicts.filter((c) => c.severity === selectedSeverity);

  // Calculate health metrics
  const healthScore = Math.max(
    0,
    100 - unresolvedConflicts.length * 10 - acknowledgedConflicts.length * 5
  );
  const preventedCount = resolvedConflicts.length;
  const overrideCount = userOverrides.length;

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

  const getSeverityBadge = (severity: string): 'destructive' | 'default' | 'secondary' => {
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

  const handleResolve = async (conflictId: string | number, conflictType: string) => {
    try {
      await api.conflicts.resolve(String(conflictId));
      setConflicts((prev) =>
        prev.map((c) =>
          c.id === conflictId ? { ...c, status: 'resolved' as const, resolvedAt: new Date() } : c
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

  const handleAcknowledge = async (conflictId: string | number, conflictType: string) => {
    try {
      await api.conflicts.acknowledge(String(conflictId));
      setConflicts((prev) =>
        prev.map((c) =>
          c.id === conflictId
            ? { ...c, status: 'acknowledged' as const, acknowledgedAt: new Date() }
            : c
        )
      );
      toast({
        title: 'Conflict Acknowledged',
        description: `${conflictType} has been acknowledged.`,
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

  const handleDismiss = async (conflictId: string | number) => {
    try {
      await api.conflicts.dismiss(String(conflictId));
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
          <p className="text-muted-foreground">Loading schedule health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Schedule Health
          </h1>
          <p className="text-muted-foreground">AI-powered conflict prevention and resolution</p>
        </div>
        <div className="text-right">
          <div
            className={`text-4xl font-bold ${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
          >
            {healthScore}%
          </div>
          <p className="text-sm text-muted-foreground">Health Score</p>
        </div>
      </div>

      {/* Alert Banner - only show if urgent issues */}
      {stats.high > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Immediate Attention Required</AlertTitle>
          <AlertDescription>
            You have {stats.high} high-severity issue{stats.high > 1 ? 's' : ''} that need
            resolution. Use AI-powered resolution to fix them automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Health Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Conflicts Prevented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{preventedCount}</div>
            <p className="text-xs text-muted-foreground">By AI validation</p>
          </CardContent>
        </Card>
        <Card
          className={`border-l-4 ${stats.total === 0 ? 'border-l-green-500' : 'border-l-red-500'}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.total === 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? 'All clear!' : 'Need attention'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-yellow-500" />
              User Overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{overrideCount}</div>
            <p className="text-xs text-muted-foreground">Manual confirmations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Total Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{resolvedConflicts.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Active Issues ({unresolvedConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="overrides" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            User Overrides ({acknowledgedConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            History ({resolvedConflicts.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Issues Tab */}
        <TabsContent value="active" className="space-y-4">
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
              className={
                selectedSeverity === 'high' ? '' : 'text-red-500 border-red-200 hover:bg-red-50'
              }
            >
              High ({stats.high})
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
              className={
                selectedSeverity === 'medium'
                  ? ''
                  : 'text-orange-500 border-orange-200 hover:bg-orange-50'
              }
            >
              Medium ({stats.medium})
            </Button>
            <Button
              variant={selectedSeverity === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('low')}
              className={
                selectedSeverity === 'low'
                  ? ''
                  : 'text-yellow-500 border-yellow-200 hover:bg-yellow-50'
              }
            >
              Low ({stats.low})
            </Button>
          </div>

          {/* Conflict List */}
          <div className="space-y-4">
            {filteredUnresolved.length === 0 ? (
              <EmptyState
                title="No active issues"
                description={
                  selectedSeverity === 'all'
                    ? 'Great job! Your schedule is healthy. AI prevented conflicts before they occurred.'
                    : `No ${selectedSeverity} severity issues found.`
                }
                icon={CheckCircle}
              />
            ) : (
              filteredUnresolved.map((conflict) => {
                const Icon = conflictTypeIcons[conflict.type] || AlertCircle;
                return (
                  <Card key={conflict.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon
                            className={`h-5 w-5 mt-0.5 ${getSeverityColor(conflict.severity)}`}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{conflict.type}</CardTitle>
                              <Badge variant={getSeverityBadge(conflict.severity)}>
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
                        <AIResolveDialog
                          conflict={conflict}
                          onResolved={() => {
                            setConflicts((prev) =>
                              prev.map((c) =>
                                c.id === conflict.id
                                  ? { ...c, status: 'resolved' as const, resolvedAt: new Date() }
                                  : c
                              )
                            );
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {safeFormatDate(conflict.date, 'MMMM dd, yyyy')}
                          </span>
                        </div>
                        {conflict.shifts && conflict.shifts.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Affected Shifts:</span>
                            {conflict.shifts.map((shift, idx) => (
                              <div key={idx} className="text-sm bg-muted/50 rounded p-2">
                                {shift.date && <span className="font-medium">{shift.date}: </span>}
                                {shift.time} - {shift.bureau}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-muted-foreground">Detected:</span>
                          <span>{safeFormatDate(conflict.detectedAt, 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResolve(conflict.id, conflict.type)}
                          >
                            Mark Resolved
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
              })
            )}
          </div>
        </TabsContent>

        {/* User Overrides Tab */}
        <TabsContent value="overrides" className="space-y-4">
          <div className="space-y-4">
            {acknowledgedConflicts.length === 0 ? (
              <EmptyState
                title="No user overrides"
                description="When users create shifts despite conflict warnings, they appear here for audit purposes."
                icon={UserCheck}
              />
            ) : (
              acknowledgedConflicts.map((conflict) => {
                const Icon = conflictTypeIcons[conflict.type] || AlertCircle;
                const isUserOverride = conflict.description?.includes('[User Override]');
                return (
                  <Card key={conflict.id} className={isUserOverride ? 'border-yellow-200' : ''}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${getSeverityColor(conflict.severity)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{conflict.type}</CardTitle>
                            {isUserOverride ? (
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                user override
                              </Badge>
                            ) : (
                              <Badge variant="secondary">acknowledged</Badge>
                            )}
                          </div>
                          {conflict.employee && (
                            <CardDescription className="font-medium">
                              {conflict.employee}
                            </CardDescription>
                          )}
                          <CardDescription>
                            {conflict.description?.replace('[User Override] ', '')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {conflict.acknowledgedAt && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Acknowledged:</span>
                            <span>
                              {safeFormatDate(conflict.acknowledgedAt, 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleResolve(conflict.id, conflict.type)}
                          >
                            Resolve
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                <Eye className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{conflict.type}</DialogTitle>
                                <DialogDescription>
                                  {isUserOverride
                                    ? 'User confirmed this override'
                                    : 'Acknowledged conflict details'}
                                </DialogDescription>
                              </DialogHeader>
                              <ConflictDetails
                                conflict={conflict}
                                onResolve={handleResolve}
                                onAcknowledge={handleAcknowledge}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="resolved" className="space-y-4">
          <div className="space-y-4">
            {resolvedConflicts.length === 0 ? (
              <EmptyState
                title="No history yet"
                description="Resolved conflicts and prevented issues will appear here for reference."
                icon={Clock}
              />
            ) : (
              resolvedConflicts.slice(0, 20).map((conflict) => {
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
                          {conflict.resolvedAt
                            ? safeFormatDate(conflict.resolvedAt, 'MMM dd, yyyy HH:mm')
                            : 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  );
}

// AI Resolution Dialog Component
function AIResolveDialog({
  conflict,
  onResolved,
}: {
  conflict: ConflictData;
  onResolved: () => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState<any>(null);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const fetchResolution = async () => {
    setIsLoading(true);
    try {
      const response = await api.conflicts.getAIResolution(String(conflict.id));
      if (response.success) {
        setResolution(response.resolution);
        setAvailableEmployees(response.available_employees || []);
      } else {
        throw new Error('Failed to get AI resolution');
      }
    } catch (error: any) {
      toast({
        title: 'AI Resolution Failed',
        description: error.message || 'Could not get AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyAction = async (action: any) => {
    setIsApplying(true);
    try {
      const response = await api.conflicts.applyResolution(String(conflict.id), action);
      if (response.success) {
        toast({
          title: 'Resolution Applied',
          description: response.message,
        });
        setIsOpen(false);
        onResolved();
      } else {
        throw new Error(response.message || 'Failed to apply resolution');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Apply',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open && !resolution) {
          fetchResolution();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Resolve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Resolution
          </DialogTitle>
          <DialogDescription>
            Get intelligent suggestions to resolve this {conflict.type.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground">Analyzing conflict and generating solutions...</p>
          </div>
        ) : resolution ? (
          <div className="space-y-6">
            {/* Analysis */}
            {resolution.conflict_analysis && (
              <div className="space-y-2">
                <h4 className="font-medium">Analysis</h4>
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p>
                    <strong>Root Cause:</strong> {resolution.conflict_analysis.root_cause}
                  </p>
                  <p>
                    <strong>Impact:</strong> {resolution.conflict_analysis.impact_assessment}
                  </p>
                </div>
              </div>
            )}

            {/* Solutions */}
            {resolution.solutions && resolution.solutions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Suggested Solutions</h4>
                {resolution.solutions.map((solution: any, index: number) => (
                  <Card
                    key={index}
                    className={index === 0 ? 'border-purple-200 bg-purple-50/50' : ''}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {index === 0 && <Badge className="bg-purple-500">Recommended</Badge>}
                          Option {solution.option || index + 1}
                        </CardTitle>
                        {solution.can_auto_apply && (
                          <Button
                            size="sm"
                            onClick={() => applyAction(solution.suggested_action)}
                            disabled={isApplying}
                          >
                            {isApplying ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Apply
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p>{solution.description}</p>
                      {solution.steps && solution.steps.length > 0 && (
                        <div>
                          <strong>Steps:</strong>
                          <ol className="list-decimal list-inside ml-2">
                            {solution.steps.map((step: string, i: number) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {solution.feasibility_score !== undefined && (
                          <span>Feasibility: {Math.round(solution.feasibility_score * 100)}%</span>
                        )}
                        {solution.disruption_score !== undefined && (
                          <span>Disruption: {Math.round(solution.disruption_score * 100)}%</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Available Employees for Reassignment */}
            {availableEmployees.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Available for Reassignment</h4>
                <div className="grid gap-2">
                  {availableEmployees.map((emp: any) => (
                    <div
                      key={emp.employee_id}
                      className="flex items-center justify-between bg-muted/50 rounded p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">{emp.employee_name}</span>
                        <span className="text-muted-foreground ml-2">({emp.shift_role})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {emp.current_weekly_hours}h/week
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            applyAction({
                              type: 'reassign',
                              shift_id: conflict.details?.shift_id || conflict.id,
                              new_employee_id: emp.employee_id,
                            })
                          }
                          disabled={isApplying}
                        >
                          Reassign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load AI suggestions. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Conflict Details Component
interface ConflictDetailsProps {
  conflict: ConflictData;
  onResolve: (id: string | number, type: string) => Promise<void>;
  onAcknowledge: (id: string | number, type: string) => Promise<void>;
  isResolved?: boolean;
}

function ConflictDetails({
  conflict,
  onResolve,
  onAcknowledge,
  isResolved = false,
}: ConflictDetailsProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleResolveClick = async () => {
    setIsResolving(true);
    try {
      await onResolve(conflict.id, conflict.type);
    } finally {
      setIsResolving(false);
    }
  };

  const handleAcknowledgeClick = async () => {
    setIsAcknowledging(true);
    try {
      await onAcknowledge(conflict.id, conflict.type);
    } finally {
      setIsAcknowledging(false);
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
          <span className="text-sm">{safeFormatDate(conflict.date, 'MMMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Detected:</span>
          <span className="text-sm">
            {safeFormatDate(conflict.detectedAt, 'MMM dd, yyyy HH:mm')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Description:</span>
        <p className="text-sm text-muted-foreground">{conflict.description}</p>
      </div>

      {conflict.shifts && conflict.shifts.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Affected Shifts:</span>
          <div className="space-y-2">
            {conflict.shifts.map((shift, idx) => (
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

      {!isResolved && conflict.status !== 'resolved' && (
        <div className="flex gap-2 pt-4">
          <DialogClose asChild>
            <Button className="flex-1" onClick={handleResolveClick} disabled={isResolving}>
              {isResolving ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogClose>
          {conflict.status !== 'acknowledged' && (
            <DialogClose asChild>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleAcknowledgeClick}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
              </Button>
            </DialogClose>
          )}
        </div>
      )}

      {(isResolved || conflict.status === 'resolved') && (
        <div className="pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DialogClose>
        </div>
      )}
    </div>
  );
}
