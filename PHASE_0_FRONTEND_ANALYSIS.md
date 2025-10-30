# Phase 0: Frontend Analysis & API Requirements

**Date:** October 30, 2025  
**Frontend Repository:** https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development  
**Status:** COMPLETE ANALYSIS

---

## Executive Summary

Your V0-built frontend is a **production-ready Next.js 16 application** with comprehensive UI/UX for shift scheduling. It uses mock data throughout and requires a **full backend API implementation** to function with real data.

**Key Finding:** The frontend architecture expects a **RESTful API** with specific data structures. Our current `shiftsmart-v1` codebase needs to be converted from a full-stack Next.js app to an **API-only backend** that serves these endpoints.

---

## Frontend Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.0 | App Router, SSR, routing |
| React | 19.2.0 | UI components |
| Tailwind CSS | 4.1.9 | Styling system |
| shadcn/ui | Latest | Component library |
| @dnd-kit | Latest | Drag-and-drop scheduling |
| date-fns | Latest | Date manipulation |
| TypeScript | 5.x | Type safety |
| Lucide React | Latest | Icon system |

**Note:** No state management library (Zustand/Redux) is used. State is managed locally with `useState`.

---

## Frontend Features Inventory

### 1. Authentication & Onboarding
**Files:**
- `/app/page.tsx` - Welcome/landing page
- `/app/login/page.tsx` - Login with Reuters email
- `/app/signup/page.tsx` - User registration

**Current State:** Client-side only, simulated authentication with `setTimeout`, redirects to `/dashboard` after "login"

**API Requirements:**
- `POST /api/auth/login` - Email/password authentication
- `POST /api/auth/signup` - New user registration
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/session` - Get current user data

**Data Expected:**
```typescript
{
  user: {
    id: string
    email: string
    full_name: string
    bureau: 'Milan' | 'Rome'
    role: string
    status: 'active' | 'inactive' | 'on-leave'
  }
  session: {
    access_token: string
    expires_at: string
  }
}
```

---

### 2. Dashboard Overview
**File:** `/app/dashboard/page.tsx`

**Features:**
- 4 stat cards (Total Employees, Active Shifts, Open Conflicts, Coverage Rate)
- Week/Month/Quarter calendar views
- Upcoming shifts table (next 7 days)
- Recent conflicts panel

**API Requirements:**
- `GET /api/dashboard/stats` - Overall metrics
- `GET /api/shifts?start_date=X&end_date=Y&bureau=Z` - Shifts for calendar
- `GET /api/shifts/upcoming?days=7` - Next 7 days of shifts
- `GET /api/conflicts?status=unresolved&limit=3` - Recent conflicts

**Data Structures:**
```typescript
// Dashboard Stats
{
  total_employees: number
  active_employees: number
  active_shifts_count: number  // This week
  open_conflicts: number
  coverage_rate: number        // Percentage (0-100)
  coverage_change: string      // e.g., "+3% from last week"
}

// Shift Object
{
  id: number
  employee: string         // Full name
  role: string            // "Senior Editor", "Junior Editor", etc.
  bureau: "Milan" | "Rome"
  date: string            // ISO date "2025-10-30"
  startTime: string       // "08:00"
  endTime: string         // "16:00"
  status: "confirmed" | "pending" | "cancelled"
}

// Conflict Object (brief for recent list)
{
  id: number
  type: string            // "Double Booking", "Rest Period Violation", etc.
  employee?: string       // Optional, may not have specific employee
  date: string            // ISO date
  severity: "high" | "medium" | "low"
}
```

---

### 3. Schedule Management
**File:** `/app/dashboard/schedule/page.tsx`

**Features:**
- Multiple views: Week, Month, Quarter, List, Grid
- Drag-and-drop shift assignment (@dnd-kit)
- Add/Edit/Delete shifts
- Copy shift functionality
- Filter by bureau

**API Requirements:**
- `GET /api/shifts?view=week&start_date=X` - Get shifts for time period
- `POST /api/shifts` - Create new shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift
- `PATCH /api/shifts/:id/move` - Move shift (drag-and-drop)
  ```json
  {
    "date": "2025-11-02",
    "start_time": "08:00",
    "end_time": "16:00"
  }
  ```

**Critical Logic:**
- Drag-and-drop triggers conflict detection
- Frontend expects immediate validation response
- Should return conflicts array if any detected

**Shift Form Fields:**
```typescript
{
  employee_id: string      // Select from employees
  bureau: "Milan" | "Rome"
  date: string             // ISO date
  start_time: string       // "08:00"
  end_time: string         // "16:00"
  status: "pending" | "confirmed"
}
```

---

### 4. Employee Directory
**Files:**
- `/app/dashboard/employees/page.tsx` - List view
- `/app/dashboard/employees/[id]/page.tsx` - Detail view

**Features:**
- Table and card view toggle
- Search by name/email
- Filter by bureau and role
- Stats cards (Total, Active, Milan, Rome)
- Add/Edit/Delete employees

**API Requirements:**
- `GET /api/employees` - List all employees
- `GET /api/employees?bureau=Milan&role=Senior Editor&status=active` - Filtered list
- `GET /api/employees/:id` - Employee details
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

**Employee Object:**
```typescript
{
  id: number
  name: string                     // Full name
  email: string                    // Reuters email
  phone: string                    // "+39 02 1234 5678"
  role: string                     // "Senior Editor", "Junior Editor", "Lead Editor"
  bureau: "Milan" | "Rome"
  status: "active" | "on-leave" | "inactive"
  shiftsThisMonth: number          // Calculated count
  initials: string                 // "MR" - can be calculated frontend
}
```

---

### 5. Employee Detail & Preferences
**File:** `/app/dashboard/employees/[id]/page.tsx`

**Features:**
- Personal information editing
- Shift preferences management
- Shift history view
- Preferred days selection (checkboxes)
- Preferred shift types (Morning, Afternoon, Evening, Night)
- Max shifts per week setting
- Additional notes

**API Requirements:**
- `GET /api/employees/:id` - Full employee data
- `GET /api/employees/:id/preferences` - Shift preferences
- `PUT /api/employees/:id/preferences` - Update preferences
- `GET /api/employees/:id/shifts/history` - Past shifts

**Preferences Object:**
```typescript
{
  employee_id: string
  preferred_days: string[]         // ["Monday", "Tuesday", "Wednesday"]
  preferred_shifts: string[]       // ["Morning", "Afternoon"]
  max_shifts_per_week: number      // 3-7
  notes: string                    // Free text
}
```

**Shift History Item:**
```typescript
{
  date: string              // "Oct 28, 2025"
  shift: string            // "Morning", "Afternoon", "Evening", "Night"
  bureau: "Milan" | "Rome"
  status: "Completed" | "No-Show" | "Cancelled"
}
```

---

### 6. Conflict Detection
**File:** `/app/dashboard/conflicts/page.tsx`

**Features:**
- Three tabs: Unresolved, Acknowledged, Resolved
- Severity filter (All, High, Medium, Low)
- Conflict detail dialog
- Resolve/Acknowledge/Dismiss actions
- Color-coded severity indicators
- Alert banner for high-priority conflicts

**API Requirements:**
- `GET /api/conflicts` - All conflicts
- `GET /api/conflicts?status=unresolved&severity=high` - Filtered
- `GET /api/conflicts/:id` - Conflict details
- `PATCH /api/conflicts/:id/resolve` - Mark resolved
  ```json
  {
    "resolved_by": "user_id",
    "resolved_at": "2025-10-30T10:30:00Z"
  }
  ```
- `PATCH /api/conflicts/:id/acknowledge` - Mark acknowledged
  ```json
  {
    "acknowledged_by": "user_id",
    "acknowledged_at": "2025-10-30T10:30:00Z"
  }
  ```
- `DELETE /api/conflicts/:id` - Dismiss conflict

**Conflict Object (detailed):**
```typescript
{
  id: number
  type: "Double Booking" | "Rest Period Violation" | "Skill Gap" | "Understaffed" | "Overtime Warning" | "Cross-Bureau Conflict"
  severity: "high" | "medium" | "low"
  employee?: string                  // Optional
  description: string                // Human-readable explanation
  date: string                       // ISO date
  shifts?: Array<{                   // Affected shifts
    time: string                     // "08:00 - 16:00"
    bureau: string
    date?: string                    // Optional additional context
  }>
  status: "unresolved" | "acknowledged" | "resolved"
  detected_at: string                // ISO timestamp
  acknowledged_at?: string           // ISO timestamp
  acknowledged_by?: string           // User ID
  resolved_at?: string               // ISO timestamp
  resolved_by?: string               // User ID
}
```

**Conflict Types Expected:**
1. **Double Booking** (High) - Overlapping shifts for same employee
2. **Rest Period Violation** (High) - Less than 11 hours between shifts
3. **Skill Gap** (Medium) - No senior editor scheduled
4. **Understaffed** (Medium) - Below minimum staffing
5. **Overtime Warning** (Low) - Approaching max weekly hours
6. **Cross-Bureau Conflict** (Medium) - Different bureaus on consecutive days

---

### 7. User Settings
**File:** `/app/dashboard/settings/page.tsx`

**Features:**
- Profile information editing
- Password change
- Email notifications preference
- Default calendar view preference

**API Requirements:**
- `GET /api/users/:id/settings` - User settings
- `PUT /api/users/:id/settings` - Update profile
  ```json
  {
    "full_name": "John Smith",
    "email": "john.smith@reuters.com",
    "phone": "+39 02 1234 5678",
    "title": "Senior Editor",
    "bureau": "Milan"
  }
  ```
- `PUT /api/users/:id/password` - Change password
  ```json
  {
    "current_password": "...",
    "new_password": "..."
  }
  ```
- `PUT /api/users/:id/preferences` - Notification/view preferences
  ```json
  {
    "email_notifications": true,
    "default_calendar_view": "week"
  }
  ```

---

## Data Model Alignment

### Frontend Expectations vs. Current Backend Schema

| Frontend Field | Current Schema | Status | Notes |
|----------------|----------------|--------|-------|
| `shifts.employee` (string) | `shift_assignments.user_id` (uuid) | ⚠️ MISMATCH | Frontend expects full name, we have ID. Need JOIN or denormalization |
| `shifts.role` | Not in shifts table | ⚠️ MISSING | Need to add or JOIN from users table |
| `shifts.startTime`/`endTime` | `shifts.start_time`/`end_time` | ✅ MATCH | Just casing difference |
| `employees.shiftsThisMonth` | Not stored | ⚠️ COMPUTED | Need to calculate on-the-fly |
| `conflicts.employee` (string) | `conflicts.employee_id` (uuid) | ⚠️ MISMATCH | Frontend expects full name |
| `preferences.preferred_days` | `shift_preferences.preferred_days` (text[]) | ✅ MATCH | Good! |
| `preferences.preferred_shifts` | `shift_preferences.preferred_shifts` (text[]) | ✅ MATCH | Good! |

**Key Issues to Resolve:**
1. **Denormalization:** Frontend expects employee names in shift/conflict objects, not just IDs
2. **Computed Fields:** `shiftsThisMonth` needs aggregation
3. **Role Field:** Shifts need role information (either stored or JOINed from users)
4. **Dashboard Stats:** Need to create aggregation queries

---

## API Endpoints Summary

### Priority 1: Core Functionality (Phase 1)

| Endpoint | Method | Purpose | Frontend Usage |
|----------|--------|---------|----------------|
| `/api/auth/login` | POST | Authenticate user | Login page |
| `/api/auth/session` | GET | Get current user | All pages (auth check) |
| `/api/employees` | GET | List employees | Employee directory, shift form |
| `/api/employees/:id` | GET/PUT | Employee CRUD | Employee detail page |
| `/api/shifts` | GET/POST | Shift CRUD | Schedule pages |
| `/api/shifts/:id` | PUT/DELETE | Update/delete shift | Schedule management |
| `/api/shifts/:id/move` | PATCH | Drag-and-drop | Week/month views |
| `/api/conflicts` | GET | List conflicts | Dashboard, conflicts page |

### Priority 2: Enhanced Features (Phase 2)

| Endpoint | Method | Purpose | Frontend Usage |
|----------|--------|---------|----------------|
| `/api/employees/:id/preferences` | GET/PUT | Manage preferences | Employee detail |
| `/api/employees/:id/shifts/history` | GET | Shift history | Employee detail |
| `/api/conflicts/:id/resolve` | PATCH | Resolve conflict | Conflicts page |
| `/api/conflicts/:id/acknowledge` | PATCH | Acknowledge conflict | Conflicts page |
| `/api/dashboard/stats` | GET | Dashboard metrics | Dashboard overview |
| `/api/users/:id/settings` | PUT | Update profile | Settings page |
| `/api/users/:id/password` | PUT | Change password | Settings page |

### Priority 3: Future Enhancements (Phase 3+)

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/shifts/generate` | POST | AI schedule generation | Not in frontend yet |
| `/api/shifts/export` | GET | PDF export | Not implemented |
| `/api/shifts/import` | POST | CSV import | We have this |

---

## Gap Analysis

### What Frontend Has That Backend Doesn't:

1. **Dashboard Statistics Aggregation**
   - Need queries for: total employees, active shifts count, coverage rate
   - Need "change from last week" calculations

2. **Upcoming Shifts Filtering**
   - Need `GET /api/shifts/upcoming?days=7`
   - Should return only future shifts in chronological order

3. **Employee Shift Count**
   - `shiftsThisMonth` needs to be calculated per employee
   - Option 1: Computed field in query
   - Option 2: Store as materialized view

4. **Conflict Status Workflow**
   - Need `acknowledged` and `resolved` states
   - Need to track WHO resolved/acknowledged and WHEN

5. **User Settings & Preferences**
   - Need separate table for user preferences (email notifications, default view)

### What Backend Has That Frontend Doesn't:

1. **CSV Import UI**
   - We built `/import` page, frontend doesn't have it
   - Can keep as admin-only feature

2. **Bureau Selection Flow**
   - We built `/select-bureau`, frontend doesn't have it
   - Frontend assumes bureau is set during signup

3. **Schedule Periods**
   - We have `schedule_periods` table
   - Frontend doesn't use this concept (yet)

4. **Audit Logs**
   - We have `audit_logs` table
   - Frontend doesn't display audit trail

---

## Conversion Plan: Full-Stack → API-Only

### Current State
```
shiftsmart-v1/
├── app/
│   ├── (auth)/login/page.tsx       ❌ DELETE (replaced by V0)
│   ├── (auth)/signup/page.tsx      ❌ DELETE (replaced by V0)
│   ├── (dashboard)/dashboard/      ❌ DELETE (replaced by V0)
│   └── layout.tsx                  ❌ DELETE (replaced by V0)
├── components/                     ❌ DELETE (replaced by V0)
├── lib/                            ✅ KEEP (backend logic)
├── supabase/                       ✅ KEEP (database)
└── types/                          ✅ KEEP (shared types)
```

### Target State
```
shiftsmart-v1-api/
├── app/
│   └── api/                        ✅ API routes only
│       ├── auth/
│       ├── employees/
│       ├── shifts/
│       ├── conflicts/
│       ├── dashboard/
│       └── users/
├── lib/
│   ├── supabase/                   ✅ Server client only
│   ├── validation/                 ✅ Conflict detection
│   ├── scheduling/                 ✅ AI logic (future)
│   └── utils/                      ✅ Helpers
├── supabase/                       ✅ Database
└── types/                          ✅ API types
```

### Migration Steps

**Step 1: Create API Directory Structure**
```bash
mkdir -p app/api/{auth,employees,shifts,conflicts,dashboard,users}
```

**Step 2: Build API Route Handlers**
- Use Next.js 16 Route Handlers (`route.ts` files)
- Return JSON responses
- Use Supabase server client for data access

**Step 3: Delete Frontend Pages**
- Remove all `app/(auth)` and `app/(dashboard)` directories
- Remove `components/` directory
- Keep root `app/layout.tsx` minimal (for API metadata)

**Step 4: Update Package.json**
- Remove frontend-only deps: @dnd-kit, lucide-react (keep date-fns for server)
- Keep: Next.js, Supabase, validation libraries

**Step 5: Configure CORS**
- Allow requests from V0 frontend domain
- Set up proper authentication headers

**Step 6: Deploy Separately**
- Frontend: Vercel (from V0 repo)
- Backend: Vercel/Railway/Supabase Edge Functions

---

## Environment Variables Needed

### Backend API
```env
NEXT_PUBLIC_SUPABASE_URL=https://kkqiknndofddjugbdefa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...                    # For AI scheduling (Phase 3)
ALLOWED_ORIGINS=https://your-v0-app.vercel.app,http://localhost:3000
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://shiftsmart-api.vercel.app
# OR
NEXT_PUBLIC_API_URL=http://localhost:3000  # Local development
```

---

## Testing Strategy

### Phase 1: Core API Endpoints
1. Test authentication flow
2. Test employee CRUD
3. Test shift CRUD
4. Test basic conflict detection

### Phase 2: Frontend Integration
1. Update frontend to call API URLs
2. Replace mock data with API calls
3. Test drag-and-drop with real conflict detection
4. Test filters and search

### Phase 3: End-to-End
1. Test complete user journey (signup → schedule → resolve conflict)
2. Load testing with 15 Breaking News employees
3. Verify Italian holiday blocking

---

## Real Data Requirements

### CSV Import Mapping

**Milan CSV → Database**
```
Worker Name          → users.full_name
Worker ID            → users.worker_id (new field?)
Position             → users.title
Email                → users.email
Phone                → users.phone
Shift Preference     → shift_preferences.notes (initially)
Unavailable Days     → shift_preferences.preferred_days (inverted logic)
```

**Example:**
- "Monday and Tuesday" → `preferred_days: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]`
- "Wednesday every two weeks" → Need recurring pattern support (Phase 2 enhancement)

### Employee Count Verification
- Milan: 8 Breaking News staff (3 Senior, 5 Regular)
- Rome: 7 Breaking News staff (1 Editor, 3 Senior, 3 Regular)
- **Total: 15 employees**

---

## Next Steps: Phase 1 Implementation

1. ✅ Complete this analysis
2. ⏭️ Create API route structure
3. ⏭️ Implement authentication endpoints
4. ⏭️ Implement employee endpoints
5. ⏭️ Implement shift endpoints with conflict detection
6. ⏭️ Implement conflict endpoints
7. ⏭️ Test with Postman/curl
8. ⏭️ Update frontend to use API
9. ⏭️ Import real Milan/Rome team data

---

## Questions for User

1. **Deployment:** Where should we deploy the backend API? (Vercel, Railway, Supabase Edge Functions?)
2. **Authentication:** Should we use Supabase Auth or build custom JWT?
3. **CSV Import:** Should this be admin-only, or can any user import?
4. **Bureau Selection:** Frontend doesn't have bureau selection flow. Should we add it, or always set during signup?
5. **Real-time Updates:** Do you want WebSocket/SSE for live conflict notifications, or is polling sufficient?

---

**Analysis Complete.** Ready for Phase 1: API Implementation.

