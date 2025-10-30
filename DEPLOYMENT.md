# ShiftSmart API - Deployment Guide

**Version:** 1.0.0  
**Last Updated:** October 30, 2025

Complete guide for setting up database, deploying API, and connecting frontend.

---

## Phase 2: Setup & Deployment

### Step 1: Database Setup (Supabase)

**1.1 Run Schema Migration**

In Supabase SQL Editor (https://app.supabase.com/project/YOUR_PROJECT/sql):

```sql
-- Copy and paste entire contents of supabase/schema.sql
-- This creates all tables, indexes, triggers, and RLS policies
```

**1.2 Seed Employee Data**

```sql
-- Copy and paste entire contents of supabase/seed-breaking-news-team.sql
-- This creates Milan and Rome bureaus and adds 15 Breaking News employees
```

**1.3 Verify Data**

```sql
-- Check bureaus
SELECT * FROM bureaus ORDER BY name;

-- Check employees
SELECT 
  u.full_name,
  u.email,
  u.title,
  u.shift_role,
  b.name as bureau
FROM users u
LEFT JOIN bureaus b ON u.bureau_id = b.id
WHERE u.team = 'Breaking News'
ORDER BY b.name, u.full_name;

-- Should return 15 employees (8 Milan, 7 Rome)
```

**Default password for all seeded users:** `changeme`

---

### Step 2: Deploy API to Vercel

**2.1 Create New Vercel Project**

1. Go to https://vercel.com/new
2. Import your `shiftsmart-v1` repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

**2.2 Set Environment Variables**

In Vercel Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kkqiknndofddjugbdefa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANTHROPIC_API_KEY=sk-ant-your-key-here  # Required for AI scheduling features
```

Get Supabase keys from: Supabase Dashboard → Project Settings → API  
Get Anthropic key from: https://console.anthropic.com/

**2.3 Deploy**

```bash
vercel --prod
```

Your API will be live at: `https://shiftsmart-api-xyz.vercel.app`

---

### Step 3: Test API Endpoints

**3.1 Test Authentication**

```bash
# Login
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gianluca.semeraro@thomsonreuters.com",
    "password": "changeme"
  }'

# Response:
{
  "user": {
    "id": "uuid",
    "email": "gianluca.semeraro@thomsonreuters.com",
    "full_name": "Gianluca Semeraro",
    "bureau": "Milan",
    ...
  },
  "session": {
    "access_token": "uuid-token-here",
    "expires_at": "2025-10-31T12:00:00Z"
  }
}
```

**3.2 Test Employees Endpoint**

```bash
# Get all employees
curl https://your-api.vercel.app/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return 15 employees
```

**3.3 Test Dashboard Stats**

```bash
curl https://your-api.vercel.app/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response:
{
  "total_employees": 15,
  "active_employees": 15,
  "active_shifts_count": 0,
  "open_conflicts": 0,
  "coverage_rate": 0,
  "coverage_change": "+0% from last week"
}
```

---

### Step 4: Connect V0 Frontend

**4.1 Add Environment Variable to V0 Frontend**

In your V0 frontend project settings:

```env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

**4.2 Create API Client Utility**

Create `lib/api.ts` in your V0 frontend:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiCall<T>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<T> {
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
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Helper functions
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    }),
  
  logout: () => apiCall('/api/auth/logout', { method: 'POST' }),
  
  getSession: () => apiCall('/api/auth/session'),

  // Employees
  getEmployees: (params?: { bureau?: string; role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/api/employees${query ? `?${query}` : ''}`);
  },

  getEmployee: (id: string) => apiCall(`/api/employees/${id}`),

  createEmployee: (data: any) =>
    apiCall('/api/employees', { method: 'POST', body: JSON.stringify(data) }),

  updateEmployee: (id: string, data: any) =>
    apiCall(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteEmployee: (id: string) =>
    apiCall(`/api/employees/${id}`, { method: 'DELETE' }),

  getPreferences: (id: string) => apiCall(`/api/employees/${id}/preferences`),

  updatePreferences: (id: string, data: any) =>
    apiCall(`/api/employees/${id}/preferences`, { method: 'PUT', body: JSON.stringify(data) }),

  // Shifts
  getShifts: (params?: { start_date?: string; end_date?: string; bureau?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/api/shifts${query ? `?${query}` : ''}`);
  },

  getUpcomingShifts: (days = 7) =>
    apiCall(`/api/shifts/upcoming?days=${days}`),

  createShift: (data: any) =>
    apiCall('/api/shifts', { method: 'POST', body: JSON.stringify(data) }),

  updateShift: (id: string, data: any) =>
    apiCall(`/api/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  moveShift: (id: string, data: { date: string; start_time?: string; end_time?: string }) =>
    apiCall(`/api/shifts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteShift: (id: string) =>
    apiCall(`/api/shifts/${id}`, { method: 'DELETE' }),

  // Conflicts
  getConflicts: (params?: { status?: string; severity?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiCall(`/api/conflicts${query ? `?${query}` : ''}`);
  },

  resolveConflict: (id: string) =>
    apiCall(`/api/conflicts/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ action: 'resolve' }) 
    }),

  acknowledgeConflict: (id: string) =>
    apiCall(`/api/conflicts/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ action: 'acknowledge' }) 
    }),

  dismissConflict: (id: string) =>
    apiCall(`/api/conflicts/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => apiCall('/api/dashboard/stats'),
};
```

**4.3 Update Login Page**

Replace mock authentication in `app/login/page.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await api.login(email, password);
    
    // Store token
    localStorage.setItem('auth_token', response.session.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    // Show error message
  } finally {
    setIsLoading(false);
  }
};
```

**4.4 Update Employee List Page**

Replace mock data in `app/dashboard/employees/page.tsx`:

```typescript
const [employees, setEmployees] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function fetchEmployees() {
    try {
      const data = await api.getEmployees({ 
        bureau: filterBureau, 
        role: filterRole,
        search: searchQuery 
      });
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  fetchEmployees();
}, [filterBureau, filterRole, searchQuery]);
```

**4.5 Update Dashboard Stats**

Replace mock stats in `app/dashboard/page.tsx`:

```typescript
const [stats, setStats] = useState(null);

useEffect(() => {
  async function fetchStats() {
    const data = await api.getDashboardStats();
    setStats(data);
  }
  
  fetchStats();
}, []);
```

---

### Step 5: CORS Configuration (If Needed)

If you get CORS errors, add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-v0-frontend.vercel.app' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

### Step 6: Test Full Flow

1. **Login:** Use `gianluca.semeraro@thomsonreuters.com` / `changeme`
2. **View Employees:** Should see 15 Breaking News staff
3. **Create Shift:** Assign Gianluca to a shift tomorrow
4. **View Dashboard:** Should show 1 active shift
5. **Drag & Drop:** Move shift to different day (calls PATCH endpoint)

---

## Troubleshooting

### "Invalid or expired session"
- Token expired (24h lifetime)
- Re-login to get new token

### "Failed to fetch employees"
- Check API URL is correct in env vars
- Verify token is being sent in Authorization header
- Check Supabase RLS policies are permissive

### "Email already registered"
- Employee already exists in database
- Use different email or update existing employee

### CORS errors
- Add CORS headers to next.config.js
- Verify frontend URL is allowed

---

## Production Checklist

- [ ] Database schema migrated in Supabase
- [ ] 15 employees seeded successfully
- [ ] API deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Frontend updated with API client
- [ ] All mock data replaced with API calls
- [ ] CORS configured if needed
- [ ] Test login flow end-to-end
- [ ] Test employee CRUD operations
- [ ] Test shift creation and drag-drop
- [ ] Verify dashboard stats are accurate

---

## Version Information

**Current Version:** 1.0.0  
**Release Date:** October 30, 2025  
**Status:** Production Ready

### What's Included in v1.0.0

- ✅ Complete REST API (24 endpoints)
- ✅ Authentication system (minimal, portable)
- ✅ Real employee data (15 Breaking News staff)
- ✅ Shift management with drag-and-drop
- ✅ Conflict detection and resolution
- ✅ AI-powered scheduling (Claude Sonnet 4.5)
- ✅ Dashboard statistics
- ✅ Employee preferences

### Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## Additional Resources

- **API Documentation:** See [API_REFERENCE.md](./API_REFERENCE.md)
- **Contributing Guide:** See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Security Policy:** See [SECURITY.md](./SECURITY.md)
- **GitHub Repository:** https://github.com/ArlynGajilanTR/ShiftSmart

---

**Maintained by:** Reuters Breaking News Team  
**Last Updated:** October 30, 2025

