# ShiftSmart Frontend Integration Guide

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Backend API Version:** 1.0.0

This guide shows how to connect your V0 frontend to the ShiftSmart API backend.

---

## 🔗 Quick Start

### 1. Get Your API URL

From your Vercel deployment, your API is at:

```
https://your-api-name.vercel.app
```

### 2. Add Environment Variable to V0 Frontend

In your V0 frontend project (<https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development>):

**Add to `.env.local`:**

```env
NEXT_PUBLIC_API_URL=https://your-api-name.vercel.app
```

**Add to Vercel (if deployed):**

- Go to Vercel Dashboard → Your V0 Project → Settings → Environment Variables
- Add: `NEXT_PUBLIC_API_URL` = `https://your-api-name.vercel.app`

---

## 📦 Step 1: Create API Client

Create `lib/api-client.ts` in your V0 frontend:

```typescript
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Base API call function with authentication
 */
export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      throw new Error('No authentication token found');
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API Client with all endpoints
 */
export const api = {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  auth: {
    login: async (email: string, password: string) => {
      const response = await apiCall<{
        user: any;
        token: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      // Store token
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    },

    signup: async (userData: any) => {
      return apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
        requireAuth: false,
      });
    },

    logout: async () => {
      await apiCall('/api/auth/logout', {
        method: 'POST',
      });

      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    },

    getSession: async () => {
      return apiCall('/api/auth/session');
    },
  },

  // ============================================================================
  // EMPLOYEES
  // ============================================================================

  employees: {
    list: async (filters?: {
      bureau?: string;
      role?: string;
      status?: string;
      search?: string;
    }) => {
      const params = new URLSearchParams(
        Object.entries(filters || {}).filter(([_, v]) => v != null) as [string, string][]
      );
      const query = params.toString();

      return apiCall<{ employees: any[] }>(`/api/employees${query ? `?${query}` : ''}`);
    },

    get: async (id: string) => {
      return apiCall<{ employee: any }>(`/api/employees/${id}`);
    },

    create: async (employeeData: any) => {
      return apiCall('/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
    },

    update: async (id: string, updates: any) => {
      return apiCall(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string) => {
      return apiCall(`/api/employees/${id}`, {
        method: 'DELETE',
      });
    },

    getPreferences: async (id: string) => {
      return apiCall(`/api/employees/${id}/preferences`);
    },

    updatePreferences: async (id: string, preferences: any) => {
      return apiCall(`/api/employees/${id}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
  },

  // ============================================================================
  // SHIFTS
  // ============================================================================

  shifts: {
    list: async (filters?: {
      start_date?: string;
      end_date?: string;
      bureau_id?: string;
      employee_id?: string;
    }) => {
      const params = new URLSearchParams(
        Object.entries(filters || {}).filter(([_, v]) => v != null) as [string, string][]
      );
      const query = params.toString();

      return apiCall<{ shifts: any[] }>(`/api/shifts${query ? `?${query}` : ''}`);
    },

    upcoming: async (days: number = 7) => {
      return apiCall<{ shifts: any[] }>(`/api/shifts/upcoming?days=${days}`);
    },

    create: async (shiftData: any) => {
      return apiCall('/api/shifts', {
        method: 'POST',
        body: JSON.stringify(shiftData),
      });
    },

    update: async (id: string, updates: any) => {
      return apiCall(`/api/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    move: async (id: string, newDate: string, startTime?: string, endTime?: string) => {
      /**
       * Move a shift to a new date/time.
       *
       * For Week/Month views: Only newDate is required (changes shift date)
       * For Today view: newDate, startTime, and endTime are required (changes shift time within same day)
       *
       * Time slot mappings for Today view:
       * - Morning: 06:00 - 12:00
       * - Afternoon: 12:00 - 18:00
       * - Evening: 18:00 - 23:59
       */
      return apiCall(`/api/shifts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          date: newDate,
          start_time: startTime,
          end_time: endTime,
        }),
      });
    },

    delete: async (id: string) => {
      return apiCall(`/api/shifts/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ============================================================================
  // CONFLICTS
  // ============================================================================

  conflicts: {
    list: async (filters?: {
      status?: 'unresolved' | 'acknowledged' | 'resolved';
      severity?: 'high' | 'medium' | 'low';
      limit?: number;
    }) => {
      const params = new URLSearchParams(
        Object.entries(filters || {})
          .filter(([_, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      );
      const query = params.toString();

      return apiCall<{ conflicts: any[] }>(`/api/conflicts${query ? `?${query}` : ''}`);
    },

    acknowledge: async (id: string) => {
      return apiCall(`/api/conflicts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'acknowledge' }),
      });
    },

    resolve: async (id: string) => {
      return apiCall(`/api/conflicts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resolve' }),
      });
    },

    dismiss: async (id: string) => {
      return apiCall(`/api/conflicts/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  dashboard: {
    getStats: async () => {
      return apiCall<{ stats: any }>('/api/dashboard/stats');
    },
  },

  // ============================================================================
  // AI SCHEDULING
  // ============================================================================

  ai: {
    generateSchedule: async (params: {
      start_date: string;
      end_date: string;
      type?: 'week' | 'month' | 'quarter';
      bureau?: 'Milan' | 'Rome' | 'both';
      preserve_existing?: boolean;
      save_to_database?: boolean;
    }) => {
      return apiCall('/api/ai/generate-schedule', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    resolveConflict: async (conflictId: string) => {
      return apiCall('/api/ai/resolve-conflict', {
        method: 'POST',
        body: JSON.stringify({ conflict_id: conflictId }),
      });
    },

    checkStatus: async () => {
      return apiCall('/api/ai/status');
    },
  },
};

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}
```

---

## 🔌 Step 2: Wire Up Your Components

### Login Page

**File:** `app/(auth)/login/page.tsx` (or wherever your login is)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.auth.login(email, password);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

---

### Dashboard Page

**File:** `app/dashboard/page.tsx`

The dashboard includes a **Schedule Overview** component with multiple views:

- **Today View** (default): Shows all shifts for the current day grouped by time slot
- **Week View**: 7-day calendar grid with shift cards
- **Month View**: Full month calendar with shift indicators
- **Quarter View**: 3-month overview with shift counts

```typescript
'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfQuarter } from 'date-fns';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Calculate date range for fetching shifts (covers all views)
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const quarterEnd = endOfQuarter(currentDate);

        // Fetch all data in parallel
        const [statsData, shiftsData, conflictsData] = await Promise.all([
          api.dashboard.getStats(),
          api.shifts.list({
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(quarterEnd, 'yyyy-MM-dd'),
          }),
          api.conflicts.list({ status: 'unresolved', limit: 5 }),
        ]);

        setStats(statsData.stats);

        // Transform shifts to expected format
        const transformedShifts = (shiftsData.shifts || []).map((shift: any) => ({
          id: shift.id,
          employee: shift.employee || shift.users?.full_name || 'Unassigned',
          role: shift.role || shift.users?.title || 'Unknown',
          bureau: shift.bureau || shift.bureaus?.name || 'Milan',
          date: shift.date || format(new Date(shift.start_time), 'yyyy-MM-dd'),
          startTime: shift.startTime || format(new Date(shift.start_time), 'HH:mm'),
          endTime: shift.endTime || format(new Date(shift.end_time), 'HH:mm'),
          status: shift.status || 'pending',
        }));
        setShifts(transformedShifts);

        setConflicts(conflictsData.conflicts);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentDate]);

  // Helper to get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(
      (shift) => format(new Date(shift.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p>{stats?.totalEmployees || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Shifts</h3>
          <p>{stats?.upcomingShifts || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Conflicts</h3>
          <p>{stats?.unresolvedConflicts || 0}</p>
        </div>
      </div>

      {/* Schedule Overview with Today/Week/Month/Quarter tabs */}
      <section>
        <h2>Schedule Overview</h2>
        {/* Tab navigation: Today | Week | Month | Quarter */}
        {/* Today View shows shifts grouped by time slot */}
        {/* Week View shows 7-day grid */}
        {/* Month View shows full calendar */}
        {/* Quarter View shows 3-month overview */}
      </section>

      {/* Conflicts */}
      <section>
        <h2>Recent Conflicts</h2>
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="conflict-card">
            <h4>{conflict.type}</h4>
            <p>{conflict.description}</p>
            <span className={`severity-${conflict.severity}`}>{conflict.severity}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
```

#### Today View Time Slots

The Today view groups shifts into three time periods:

- 🌅 **Morning** (6AM - 12PM)
- ☀️ **Afternoon** (12PM - 6PM)
- 🌙 **Evening/Night** (6PM - 6AM)

---

### Employee List Page

**File:** `app/employees/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    bureau: '',
    role: '',
    search: '',
  });

  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      try {
        const data = await api.employees.list({
          bureau: filters.bureau || undefined,
          role: filters.role || undefined,
          search: filters.search || undefined,
        });
        setEmployees(data.employees);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, [filters]);

  return (
    <div>
      <h1>Employees</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.bureau}
          onChange={(e) => setFilters({ ...filters, bureau: e.target.value })}
        >
          <option value="">All Bureaus</option>
          <option value="Milan">Milan</option>
          <option value="Rome">Rome</option>
        </select>

        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="editor">Editor</option>
          <option value="senior">Senior</option>
          <option value="correspondent">Correspondent</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Employee List */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="employee-grid">
          {employees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="avatar">{employee.initials}</div>
              <h3>{employee.name}</h3>
              <p>{employee.role}</p>
              <p>{employee.bureau}</p>
              <span className={`status-${employee.status}`}>{employee.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Calendar/Schedule Page with Drag-and-Drop

**File:** `app/dashboard/schedule/page.tsx`

The Schedule Management page supports full drag-and-drop across all views using `@dnd-kit/core`:

#### Views with Drag-and-Drop Support

| View        | Draggable | Droppable | Description                                                                                                                      |
| ----------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Today**   | ✅        | ✅        | Shifts grouped by time slot (Morning/Afternoon/Evening). Dropping between slots changes shift TIME (same date, different hours). |
| **Week**    | ✅        | ✅        | 7-day calendar grid. Dropping changes shift DATE.                                                                                |
| **Month**   | ✅        | ✅        | Full month calendar. Dropping changes shift DATE.                                                                                |
| **Quarter** | ✅        | ❌        | 3-month overview (read-only)                                                                                                     |

#### Key Components

```typescript
// DraggableShift - Makes shift cards draggable
function DraggableShift({ shift, view = 'week' }: { shift: any; view?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shift-${shift.id}`,
    data: { shift },
  });
  // Renders different layouts based on view: 'today', 'week', 'month'
}

// DroppableDay - Makes a day cell accept dropped shifts (Week/Month views)
function DroppableDay({ date, children }: { date: Date; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(date, 'yyyy-MM-dd')}`,
    data: { date },
  });
  // Highlights when shift is dragged over
}

// DroppableTimeSlot - Makes a time slot accept dropped shifts (Today view)
function DroppableTimeSlot({
  date,
  slot,
}: {
  date: Date;
  slot: 'morning' | 'afternoon' | 'evening';
}) {
  const slotConfig = {
    morning: { start: '06:00', end: '12:00' },
    afternoon: { start: '12:00', end: '18:00' },
    evening: { start: '18:00', end: '23:59' },
  }[slot];

  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${format(date, 'yyyy-MM-dd')}-${slot}`,
    data: { date, slot, startTime: slotConfig.start, endTime: slotConfig.end },
  });
  // Highlights when shift is dragged over
}
```

#### Handling Drag End with Conflict Detection

The `handleDragEnd` function detects conflicts and shows a confirmation dialog:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const shiftId = active.data.current?.shift?.id;
  const shift = active.data.current?.shift;

  // Check if dropped on a time slot (Today view - changes time, not date)
  const isTimeSlotDrop = over.id.toString().startsWith('timeslot-');

  if (isTimeSlotDrop) {
    // Today view: Change shift TIME
    const newDate = over.data.current?.date;
    const newStartTime = over.data.current?.startTime;
    const newEndTime = over.data.current?.endTime;

    if (shiftId && newDate) {
      try {
        // Move with new times (same date, different hours)
        await api.shifts.move(shiftId, format(newDate, 'yyyy-MM-dd'), newStartTime, newEndTime);

        // Update local state with new times
        setShifts((prevShifts) =>
          prevShifts.map((s) =>
            s.id === shiftId
              ? { ...s, date: new Date(newDate), startTime: newStartTime, endTime: newEndTime }
              : s
          )
        );
        toast({
          title: 'Shift moved',
          description: `Shift moved to ${over.data.current?.slot} slot`,
        });
      } catch (error: any) {
        // Handle conflicts...
      }
    }
    return;
  }

  // Week/Month views: Change shift DATE
  const newDate = over.data.current?.date;

  if (shiftId && newDate) {
    const formattedDate = format(newDate, 'yyyy-MM-dd');

    try {
      // Attempt move - API returns 409 if conflicts exist
      await api.shifts.move(shiftId, formattedDate);

      // Success - update local state
      setShifts((prevShifts) =>
        prevShifts.map((s) => (s.id === shiftId ? { ...s, date: new Date(newDate) } : s))
      );
      toast({ title: 'Shift moved', description: 'Shift moved successfully' });
    } catch (error: any) {
      // Check if this is a conflict response (409)
      if (error.message?.includes('conflicts')) {
        // Get detailed conflict information
        const validation = await api.shifts.validateMove(
          shiftId,
          formattedDate,
          shift.startTime,
          shift.endTime
        );

        if (!validation.valid && validation.conflicts?.length > 0) {
          // Open conflict confirmation dialog
          setPendingMove({
            shiftId,
            newDate: formattedDate,
            shift,
            conflicts: validation.conflicts,
          });
          setIsConflictDialogOpen(true);
          return;
        }
      }

      // Generic error
      toast({
        title: 'Failed to move shift',
        description: error.message,
        variant: 'destructive',
      });
    }
  }
};

// Handle force move (user confirms despite conflicts)
const handleForceMove = async () => {
  if (!pendingMove) return;

  await api.shifts.move(
    pendingMove.shiftId,
    pendingMove.newDate,
    pendingMove.shift.startTime,
    pendingMove.shift.endTime,
    true // force = true
  );

  // Update local state and close dialog
  setShifts((prevShifts) =>
    prevShifts.map((s) =>
      s.id === pendingMove.shiftId ? { ...s, date: new Date(pendingMove.newDate) } : s
    )
  );
  setIsConflictDialogOpen(false);
  setPendingMove(null);
};
```

#### Conflict Confirmation Dialog

When conflicts are detected, a modal shows:

- List of all conflicts with severity badges
- Conflict type and description
- Affected employee information
- "Cancel Move" and "Move Anyway" buttons

Conflicts from forced moves are logged in Schedule Health for audit.

**Audit Trail:**
All drag-and-drop moves are automatically logged to the audit trail (`audit_logs` table) with:

- Who made the change (`user_id`)
- What changed (`from` → `to` date/times)
- When it happened (`created_at`)
- Whether conflicts were overridden (`force_move: true`)

This enables full traceability of schedule changes for compliance and debugging.

#### Cross-View Synchronization

All views share the same `shifts` state, so when you drag a shift from one view to another:

1. API call updates the database (`api.shifts.move()`)
2. Local state updates immediately (`setShifts()`)
3. All views re-render with the new data automatically

```
┌─────────────────────────────────────────────────┐
│              Shared shifts State                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  │ Today   │  │  Week   │  │  Month  │  │ Quarter │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘
│                     ↓
│            handleDragEnd()
│                     ↓
│         api.shifts.move() + setShifts()
│                     ↓
│         All views reflect the change
└─────────────────────────────────────────────────┘
```

````

---

## 🧪 Step 3: Test the Integration

### Test Authentication

```bash
# In your V0 frontend
npm run dev

# Try logging in with:
# Email: gianluca.semeraro@thomsonreuters.com
# Password: changeme
````

### Test Data Loading

1. Login should work
2. Dashboard should show real stats
3. Employee list should show 15 Breaking News staff
4. Calendar should load (even if empty initially)

---

## 🔍 Debugging

### If you see CORS errors

Add this to your API backend's `next.config.ts`:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'YOUR_V0_FRONTEND_URL' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### If authentication fails

Check browser console:

```javascript
// Should see token in localStorage
localStorage.getItem('auth_token');
```

---

## 📚 Next Steps

1. **Create the API client** (`lib/api-client.ts`)
2. **Update login page** to call real API
3. **Update dashboard** to fetch real data
4. **Update employee list** to use real data
5. **Wire up calendar** for drag-and-drop with `api.shifts.move()`
6. **Add conflict handling** with `api.conflicts` methods

---

**Need help with a specific component?** Let me know which page you want to wire up first!

**Backend API URL:** (You'll get this from Vercel)  
**Frontend Repo:** <https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development>
