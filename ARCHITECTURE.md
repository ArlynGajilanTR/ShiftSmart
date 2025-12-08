# ShiftSmart System Architecture

**Version:** 1.4.6  
**Last Updated:** December 8, 2025  
**Purpose:** AI-friendly system reference for development, debugging, and feature enhancement

---

## Quick Reference

| Component      | Technology             | Location              |
| -------------- | ---------------------- | --------------------- |
| Frontend       | Next.js 15 + React 19  | `app/dashboard/`      |
| API Routes     | Next.js Route Handlers | `app/api/`            |
| Database       | PostgreSQL (Supabase)  | `supabase/schema.sql` |
| AI Integration | Claude API             | `lib/ai/`             |
| Auth           | Custom session-based   | `lib/auth/`           |
| Types          | TypeScript             | `types/index.ts`      |

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SHIFTSMART                                      │
│                    Reuters Breaking News Scheduling Tool                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Frontend   │───▶│   API Layer  │───▶│   Database   │                   │
│  │  (Next.js)   │    │ (Route Handlers)  │  (Supabase)  │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                    │                           │
│         │            ┌──────▼──────┐             │                           │
│         │            │  AI Engine  │             │                           │
│         │            │  (Claude)   │             │                           │
│         │            └─────────────┘             │                           │
│         │                                        │                           │
│  ┌──────▼────────────────────────────────────────▼──────┐                   │
│  │                    Shared Libraries                   │                   │
│  │  • lib/auth/ - Authentication                        │                   │
│  │  • lib/validation/ - Conflict detection              │                   │
│  │  • lib/scheduling/ - Schedule generation             │                   │
│  │  • lib/supabase/ - Database clients                  │                   │
│  └──────────────────────────────────────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Authentication Flow

```
User Login Request
       │
       ▼
┌──────────────────┐
│ POST /api/auth/  │
│     login        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐
│ lib/auth/        │───▶│ Supabase users   │
│ password.ts      │    │ table            │
│ (verify hash)    │    └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate session │
│ token + store in │
│ users.session_   │
│ token column     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return: user +   │
│ session object   │
│ with access_token│
└──────────────────┘
```

### 2. Schedule Generation Flow (AI)

```
Generate Schedule Request
         │
         ▼
┌────────────────────────┐
│ POST /api/ai/          │
│ generate-schedule      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ lib/ai/scheduler-      │
│ agent.ts               │
│ (orchestrates AI call) │
└──────────┬─────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌────────────┐
│ Fetch  │  │ Fetch shift│
│ users  │  │ preferences│
└───┬────┘  └─────┬──────┘
    │             │
    └──────┬──────┘
           │
           ▼
┌────────────────────────┐
│ Claude API Call        │
│ with structured prompt │
│ (lib/ai/prompts/)      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Parse AI response      │
│ Validate assignments   │
│ Check conflicts        │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Return schedule +      │
│ preview OR save to DB  │
└────────────────────────┘
```

### 3. Conflict Detection Flow

```
Shift Assignment Change
         │
         ▼
┌────────────────────────┐
│ lib/validation/        │
│ conflicts.ts           │
└──────────┬─────────────┘
           │
    ┌──────┼──────┬──────┬──────┬──────┐
    │      │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Double││Rest  ││Skill ││Under-││Over- ││Pref  │
│Book  ││Period││Gap   ││staff ││time  ││Viol. │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
   │       │       │       │       │       │
   └───────┴───────┴───────┴───────┴───────┘
                    │
                    ▼
           ┌───────────────┐
           │ Aggregate     │
           │ conflicts     │
           │ with severity │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │ Store in      │
           │ conflicts     │
           │ table         │
           └───────────────┘
```

---

## Directory Structure

```
shiftsmart-v1/
│
├── app/                              # Next.js App Router
│   │
│   ├── api/                          # ══════ API ROUTES (24 endpoints) ══════
│   │   │
│   │   ├── auth/                     # Authentication (4 endpoints)
│   │   │   ├── login/route.ts        # POST - Email/password login
│   │   │   ├── logout/route.ts       # POST - Clear session
│   │   │   ├── session/route.ts      # GET  - Validate current session
│   │   │   └── signup/route.ts       # POST - Create new user
│   │   │
│   │   ├── employees/                # Employee Management (7 endpoints)
│   │   │   ├── route.ts              # GET  - List employees (with filters)
│   │   │   │                         # POST - Create employee
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET/PUT/DELETE - Single employee
│   │   │       └── preferences/
│   │   │           ├── route.ts      # GET/PUT - Employee preferences
│   │   │           └── confirm/route.ts # POST - Team leader confirms prefs
│   │   │
│   │   ├── shifts/                   # Shift Management (6 endpoints)
│   │   │   ├── route.ts              # GET  - List shifts (with date range)
│   │   │   │                         # POST - Create shift
│   │   │   ├── [id]/route.ts         # GET/PUT/PATCH/DELETE - Single shift
│   │   │   ├── upcoming/route.ts     # GET  - Next N days of shifts
│   │   │   └── reset/route.ts        # DELETE - Dev-only: clear all shifts
│   │   │
│   │   ├── conflicts/                # Conflict Management (3 endpoints)
│   │   │   ├── route.ts              # GET  - List conflicts
│   │   │   └── [id]/route.ts         # PATCH/DELETE - Acknowledge/resolve
│   │   │
│   │   ├── dashboard/
│   │   │   └── stats/route.ts        # GET  - Dashboard statistics
│   │   │
│   │   ├── ai/                       # AI Integration (6 endpoints)
│   │   │   ├── generate-schedule/    # POST - AI schedule generation
│   │   │   ├── save-schedule/        # POST - Save generated schedule
│   │   │   ├── resolve-conflict/     # POST - AI conflict resolution
│   │   │   ├── status/route.ts       # GET  - AI service health check
│   │   │   ├── chatbot/route.ts      # POST - Scheduling assistant chat
│   │   │   └── debug-last-response/  # GET  - Debug AI responses
│   │   │
│   │   ├── users/                    # User Profile (3 endpoints)
│   │   │   ├── me/route.ts           # GET/PUT - Current user profile
│   │   │   ├── me/password/route.ts  # PUT - Change password
│   │   │   └── [id]/team-leader/     # PUT - Toggle team leader status
│   │   │
│   │   └── team/
│   │       └── availability/route.ts # GET - Team availability overview
│   │
│   ├── dashboard/                    # ══════ FRONTEND PAGES ══════
│   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   ├── page.tsx                  # Main dashboard (schedule view)
│   │   ├── employees/                # Employee management UI
│   │   │   ├── page.tsx              # Employee list
│   │   │   ├── [id]/page.tsx         # Employee detail
│   │   │   └── new/page.tsx          # Create employee
│   │   ├── schedule/page.tsx         # Schedule calendar view
│   │   ├── conflicts/page.tsx        # Conflict resolution UI
│   │   ├── my-availability/page.tsx  # Personal availability settings
│   │   ├── team/page.tsx             # Team overview (leaders only)
│   │   └── settings/page.tsx         # User settings
│   │
│   ├── login/page.tsx                # Login page
│   ├── signup/page.tsx               # Signup page
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing/redirect
│
├── lib/                              # ══════ SHARED LIBRARIES ══════
│   │
│   ├── ai/                           # AI Integration
│   │   ├── client.ts                 # Claude API client
│   │   ├── scheduler-agent.ts        # Schedule generation orchestrator
│   │   └── prompts/
│   │       ├── schedule-generation.ts # AI prompt for schedule creation
│   │       └── conflict-resolution.ts # AI prompt for conflict resolution
│   │
│   ├── auth/                         # Authentication
│   │   ├── password.ts               # Password hashing (bcrypt)
│   │   └── verify.ts                 # Session token verification
│   │
│   ├── scheduling/                   # Scheduling Logic
│   │   ├── scheduler.ts              # Core scheduling algorithms
│   │   └── csv-import.ts             # Bulk import from CSV
│   │
│   ├── supabase/                     # Database Clients
│   │   ├── client.ts                 # Browser client (anon key)
│   │   └── server.ts                 # Server client (service role)
│   │
│   ├── validation/
│   │   └── conflicts.ts              # Conflict detection rules
│   │
│   ├── api-client.ts                 # Frontend API client
│   └── utils.ts                      # Utility functions (cn, dates)
│
├── components/                       # ══════ REACT COMPONENTS ══════
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx, card.tsx, dialog.tsx, ...
│   │   └── (20+ UI primitives)
│   ├── chatbot-guide.tsx             # AI chatbot component
│   └── theme-provider.tsx            # Dark/light mode
│
├── types/
│   └── index.ts                      # All TypeScript type definitions
│
├── supabase/                         # ══════ DATABASE ══════
│   ├── schema.sql                    # Complete DB schema (260 lines)
│   ├── migrations/                   # Migration files
│   ├── seed-breaking-news-team.sql   # Sample data (15 employees)
│   ├── add-superusers.sql            # Admin user setup
│   └── create-dev-admin.sql          # Dev environment admin
│
├── tests/                            # ══════ TEST SUITES ══════
│   ├── unit/                         # Jest unit tests
│   ├── e2e/                          # Playwright E2E tests
│   ├── api/                          # API integration tests
│   └── database/                     # Schema validation tests
│
└── docs/                             # Additional documentation
    ├── handoffs/                     # Phase handoff documents
    └── PROJECT_FIELD_GOTCHAS.md      # ⚠️ Field naming conventions
```

---

## API Endpoint Reference

### Authentication

| Method | Endpoint            | Purpose                   | Auth Required |
| ------ | ------------------- | ------------------------- | ------------- |
| POST   | `/api/auth/login`   | Login with email/password | No            |
| POST   | `/api/auth/signup`  | Create new user account   | No            |
| POST   | `/api/auth/logout`  | Invalidate session        | Yes           |
| GET    | `/api/auth/session` | Validate current session  | Yes           |

### Employees

| Method | Endpoint                          | Purpose                         | Auth Required |
| ------ | --------------------------------- | ------------------------------- | ------------- |
| GET    | `/api/employees`                  | List all employees (filterable) | Yes           |
| POST   | `/api/employees`                  | Create new employee             | Yes           |
| GET    | `/api/employees/[id]`             | Get single employee             | Yes           |
| PUT    | `/api/employees/[id]`             | Update employee                 | Yes           |
| DELETE | `/api/employees/[id]`             | Delete employee                 | Yes           |
| GET    | `/api/employees/[id]/preferences` | Get employee preferences        | Yes           |
| PUT    | `/api/employees/[id]/preferences` | Update preferences              | Yes           |

### Shifts

| Method | Endpoint               | Purpose                         | Auth Required |
| ------ | ---------------------- | ------------------------------- | ------------- |
| GET    | `/api/shifts`          | List shifts (with date filters) | Yes           |
| POST   | `/api/shifts`          | Create shift                    | Yes           |
| GET    | `/api/shifts/[id]`     | Get single shift                | Yes           |
| PUT    | `/api/shifts/[id]`     | Update shift                    | Yes           |
| PATCH  | `/api/shifts/[id]`     | Move shift (date/time change)   | Yes           |
| DELETE | `/api/shifts/[id]`     | Delete shift                    | Yes           |
| GET    | `/api/shifts/upcoming` | Get upcoming shifts             | Yes           |

### Conflicts

| Method | Endpoint              | Purpose                      | Auth Required |
| ------ | --------------------- | ---------------------------- | ------------- |
| GET    | `/api/conflicts`      | List conflicts (filterable)  | Yes           |
| PATCH  | `/api/conflicts/[id]` | Acknowledge/resolve conflict | Yes           |
| DELETE | `/api/conflicts/[id]` | Dismiss conflict             | Yes           |

### AI

| Method | Endpoint                    | Purpose                    | Auth Required |
| ------ | --------------------------- | -------------------------- | ------------- |
| POST   | `/api/ai/generate-schedule` | Generate AI schedule       | Yes           |
| POST   | `/api/ai/save-schedule`     | Save generated schedule    | Yes           |
| POST   | `/api/ai/resolve-conflict`  | Get AI conflict resolution | Yes           |
| GET    | `/api/ai/status`            | Check AI service status    | Yes           |

---

## Key Business Logic Locations

### Conflict Detection

**File:** `lib/validation/conflicts.ts`

Detects 7 types of conflicts:

1. **Double Booking** - User assigned to overlapping shifts
2. **Rest Period Violation** - < 11 hours between shifts
3. **Skill Gap** - No senior on shift with juniors
4. **Understaffed** - Not enough staff assigned
5. **Overtime Warning** - Weekly hours exceed limit
6. **Cross-Bureau Conflict** - Conflicts across Milan/Rome
7. **Preference Violation** - Assignment conflicts with preferences

### Schedule Generation

**File:** `lib/ai/scheduler-agent.ts`

Orchestrates AI-powered schedule creation:

1. Fetches all active employees
2. Gets shift preferences for each
3. Builds context for Claude
4. Generates assignments with role balancing
5. Validates for conflicts before returning

### Authentication

**Files:** `lib/auth/password.ts`, `lib/auth/verify.ts`

- Password hashing: bcrypt with salt rounds
- Session tokens: UUID stored in `users.session_token`
- Token expiry: Configurable, stored in `users.session_expires_at`

---

## Environment Variables

```env
# Supabase Connection (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# AI Integration (Required for AI features)
ANTHROPIC_API_KEY=sk-ant-...

# Optional
NEXT_PUBLIC_API_URL=           # Empty for relative URLs
NODE_ENV=development           # development | production
```

---

## Common Patterns

### API Route Handler Pattern

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 1. Verify authentication
  const { user, error } = await verifyAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  // 2. Create Supabase client
  const supabase = createServerClient();

  // 3. Query database
  const { data, error: dbError } = await supabase.from('table_name').select('*');

  // 4. Handle errors
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // 5. Return success
  return NextResponse.json({ data });
}
```

### Frontend Data Fetching Pattern

```typescript
// app/dashboard/[page]/page.tsx
"use client"

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.resource.list()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  return <DataDisplay data={data} />;
}
```

---

## Role-Based Access

### System Roles (Access Control)

| Role        | Permissions                                           |
| ----------- | ----------------------------------------------------- |
| `admin`     | Full access, bureau management, user management       |
| `manager`   | Bureau-level scheduling, reports, employee management |
| `scheduler` | Create/modify schedules, view employees               |
| `staff`     | View own schedule, set preferences                    |

### Shift Roles (Scheduling)

| Role            | Description                 | Rules                    |
| --------------- | --------------------------- | ------------------------ |
| `editor`        | Lead/senior editorial staff | Can lead shifts          |
| `senior`        | Experienced staff           | Min 1 per shift required |
| `correspondent` | Junior staff                | Max 3 per shift          |

---

## Testing Quick Reference

```bash
# Unit tests (fastest)
npm run test:unit

# API tests
npm run test:api

# E2E tests
npm test

# All tests
cd tests && ./run-comprehensive-tests.sh
```

---

## Debugging Tips

### Check API response

```bash
curl http://localhost:3000/api/[endpoint] \
  -H "Authorization: Bearer [token]"
```

### Check database directly

```bash
# Use Supabase dashboard or:
curl "$SUPABASE_URL/rest/v1/[table]" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Common issues

1. **401 Unauthorized** → Check `localStorage.auth_token` exists
2. **Foreign key error** → Check `bureau_id` exists in bureaus table
3. **Conflict not detected** → Check `lib/validation/conflicts.ts` logic
4. **AI not working** → Verify `ANTHROPIC_API_KEY` is set

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Detailed database documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Full API documentation
- [docs/PROJECT_FIELD_GOTCHAS.md](./docs/PROJECT_FIELD_GOTCHAS.md) - Field naming conventions
- [ENGINEERING_BUILD_RULES.md](./ENGINEERING_BUILD_RULES.md) - Development guidelines
- [types/index.ts](./types/index.ts) - TypeScript type definitions

---

**Maintained by:** Reuters Breaking News Team  
**Last Updated:** December 8, 2025
