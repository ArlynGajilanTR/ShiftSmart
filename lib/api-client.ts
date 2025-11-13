/**
 * ShiftSmart API Client
 * Connected to backend: https://github.com/ArlynGajilanTR/ShiftSmart
 */

// Use empty string for relative URLs (works in both dev and production)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Base API call function with authentication
 */
export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
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
        session: {
          access_token: string;
          expires_at: string;
        };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      });

      // Store token from session object
      localStorage.setItem('auth_token', response.session.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    },

    signup: async (userData: {
      email: string;
      password: string;
      full_name: string;
      bureau_id: string;
      role?: string;
      title: string;
      shift_role: string;
    }) => {
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

    create: async (shiftData: {
      bureau_id: string;
      start_time: string;
      end_time: string;
      employee_id?: string;
      status?: string;
      notes?: string;
    }) => {
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

/**
 * Logout and redirect
 */
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
