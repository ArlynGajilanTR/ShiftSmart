# ShiftSmart API

Backend API for Reuters Breaking News shift scheduling system.

## Tech Stack

- **Next.js 16** - API routes
- **Supabase** - PostgreSQL database
- **TypeScript** - Type safety
- **bcryptjs** - Password hashing
- **date-fns** - Date manipulation

## Project Structure

```
shiftsmart-v1/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── employees/         # Employee management
│   │   ├── shifts/            # Shift scheduling
│   │   ├── conflicts/         # Conflict detection
│   │   └── dashboard/         # Statistics
│   ├── layout.tsx
│   └── page.tsx               # API documentation
├── lib/
│   ├── auth/                  # Authentication utilities
│   ├── supabase/              # Database clients
│   ├── validation/            # Business logic
│   └── scheduling/            # Scheduling algorithms
├── supabase/
│   ├── schema.sql             # Database schema
│   └── seed-breaking-news-team.sql  # Real employee data
└── types/                     # TypeScript definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current user

### Employees (7 endpoints)
- `GET /api/employees` - List employees (filters: bureau, role, status, search)
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/preferences` - Get shift preferences
- `PUT /api/employees/:id/preferences` - Update shift preferences

### Shifts (6 endpoints)
- `GET /api/shifts` - List shifts (filters: date_range, bureau, employee_id)
- `POST /api/shifts` - Create shift with optional assignment
- `GET /api/shifts/upcoming` - Upcoming shifts (default: 7 days)
- `PUT /api/shifts/:id` - Update shift
- `PATCH /api/shifts/:id` - Move shift (drag-and-drop)
- `DELETE /api/shifts/:id` - Delete shift

### Conflicts (3 endpoints)
- `GET /api/conflicts` - List conflicts (filters: status, severity, limit)
- `PATCH /api/conflicts/:id` - Resolve or acknowledge (body: `{action: 'resolve'|'acknowledge'}`)
- `DELETE /api/conflicts/:id` - Dismiss conflict

### Dashboard (1 endpoint)
- `GET /api/dashboard/stats` - Aggregated statistics

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. **Run database migrations:**
```sql
-- In Supabase SQL editor:
-- 1. Run supabase/schema.sql
-- 2. Run supabase/seed-breaking-news-team.sql
```

4. **Start the dev server:**
```bash
npm run dev
```

API will be available at `http://localhost:3000`

## Authentication

All endpoints (except auth) require a Bearer token:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@reuters.com","password":"password"}'

# Use token in requests
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Data

The system manages **15 Breaking News team members**:
- **Milan Bureau:** 8 staff (3 Senior + 5 Correspondents)
- **Rome Bureau:** 7 staff (1 Editor + 3 Senior + 3 Correspondents)

Default password for seeded users: `changeme`

## Frontend

This is an API-only backend. The frontend is built separately:
- **Repository:** https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development
- **Deployed:** Vercel

## Development

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## API Response Formats

### Employee Object
```json
{
  "id": "uuid",
  "name": "Marco Rossi",
  "email": "marco.rossi@reuters.com",
  "phone": "+39 02 1234 5678",
  "role": "Senior Breaking News Correspondent",
  "bureau": "Milan",
  "status": "active",
  "shiftsThisMonth": 18,
  "initials": "MR"
}
```

### Shift Object
```json
{
  "id": "uuid",
  "employee": "Marco Rossi",
  "employee_id": "uuid",
  "role": "Senior Breaking News Correspondent",
  "bureau": "Milan",
  "date": "2025-11-01",
  "startTime": "08:00",
  "endTime": "16:00",
  "status": "confirmed"
}
```

### Conflict Object
```json
{
  "id": "uuid",
  "type": "Double Booking",
  "severity": "high",
  "status": "unresolved",
  "employee": "Marco Rossi",
  "description": "Employee is scheduled for overlapping shifts",
  "date": "2025-11-02",
  "shifts": [
    {"time": "08:00 - 16:00", "bureau": "Milan"},
    {"time": "14:00 - 22:00", "bureau": "Rome"}
  ],
  "detected_at": "2025-10-29T10:30:00Z"
}
```

## Notes

- **Minimal Auth:** Uses bcryptjs + session tokens (no Supabase Auth dependency)
- **Portable:** Easy to migrate to Snowflake later
- **Internal App:** No public deployment, trusted users only
- **Phase 1 Complete:** Core API endpoints ready for frontend integration

## Next Steps

- **Phase 2:** Wire frontend to API, test with real data
- **Phase 3:** Implement AI scheduling with Claude Sonnet 4.5
- **Phase 4:** Shift swaps, comp days, PDF export

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025
