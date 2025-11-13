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

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch dashboard stats
        const statsData = await api.dashboard.getStats();
        setStats(statsData.stats);

        // Fetch upcoming shifts
        const shiftsData = await api.shifts.upcoming(7);
        setUpcomingShifts(shiftsData.shifts);

        // Fetch unresolved conflicts
        const conflictsData = await api.conflicts.list({ status: 'unresolved', limit: 5 });
        setConflicts(conflictsData.conflicts);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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

      {/* Upcoming Shifts */}
      <section>
        <h2>Upcoming Shifts</h2>
        {upcomingShifts.map((shift) => (
          <div key={shift.id} className="shift-card">
            <p>{shift.employee} - {shift.date}</p>
            <p>{shift.startTime} - {shift.endTime}</p>
          </div>
        ))}
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

**File:** `app/schedule/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function SchedulePage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    async function fetchShifts() {
      try {
        // Get shifts for selected month
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const data = await api.shifts.list({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        });

        setShifts(data.shifts);
      } catch (error) {
        console.error('Failed to fetch shifts:', error);
      }
    }

    fetchShifts();
  }, [selectedDate]);

  const handleShiftMove = async (shiftId: string, newDate: string) => {
    try {
      await api.shifts.move(shiftId, newDate);

      // Refresh shifts
      // (Re-run the fetch logic or update state optimistically)
    } catch (error) {
      console.error('Failed to move shift:', error);
    }
  };

  return (
    <div>
      <h1>Schedule</h1>
      {/* Your calendar component here */}
      {/* Pass shifts data and handleShiftMove callback */}
    </div>
  );
}
```

---

## 🧪 Step 3: Test the Integration

### Test Authentication

```bash
# In your V0 frontend
npm run dev

# Try logging in with:
# Email: gianluca.semeraro@thomsonreuters.com
# Password: changeme
```

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
