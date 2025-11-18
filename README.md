# ShiftSmart v1.3.2

Unified fullstack application for Reuters Breaking News shift scheduling system.

**Version:** 1.3.2 | **Status:** ✅ Production Ready | **Test Coverage:** 100% | **Tests:** 332+

## Overview

ShiftSmart is an internal scheduling application for Reuters Breaking News editorial teams in Milan and Rome. It features AI-powered schedule generation, intelligent conflict detection, and comprehensive employee management—all tested with automated end-to-end verification.

## Tech Stack

- **Next.js 16** - Fullstack framework (frontend + API routes)
- **React 19** - UI components
- **Supabase** - PostgreSQL database
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@dnd-kit** - Drag-and-drop scheduling
- **Claude Haiku 4.5** - AI-powered scheduling (near-frontier, 2x faster, 67% cheaper)
- **bcryptjs** - Password hashing
- **date-fns** - Date manipulation

## Key Features

✅ **100% Tested** - All 20 API endpoints passing automated tests  
🤖 **AI Scheduling** - Claude Haiku 4.5 generates optimized schedules (near-frontier, 2-5x faster)  
👥 **Employee Management** - CRUD operations with preferences  
📅 **Smart Scheduling** - Drag-and-drop with conflict detection  
⚠️ **Conflict Resolution** - Automatic detection and AI suggestions  
📊 **Real-time Dashboard** - Statistics and upcoming shifts  
🔐 **Secure Authentication** - Session-based with bcrypt hashing  
📱 **Reuters Branding** - Professional UI with Knowledge2017 font

## Project Structure

```
shiftsmart-v1/
├── app/
│   ├── api/                    # API routes (24 endpoints)
│   │   ├── auth/              # Authentication (login, signup, session)
│   │   ├── employees/         # Employee management (CRUD + preferences)
│   │   ├── shifts/            # Shift scheduling (list, create, move, delete)
│   │   ├── conflicts/         # Conflict detection and resolution
│   │   ├── dashboard/         # Statistics and aggregations
│   │   └── ai/                # AI-powered scheduling (Claude Haiku 4.5)
│   ├── dashboard/             # Frontend pages (employees, schedule, conflicts)
│   ├── login/                 # Authentication UI
│   ├── signup/                # User registration
│   ├── welcome/               # Landing page
│   ├── layout.tsx
│   └── page.tsx               # Main welcome screen
├── components/                # React components (calendar, forms, UI)
├── lib/
│   ├── api-client.ts          # TypeScript API client
│   ├── auth/                  # Authentication utilities (bcrypt, sessions)
│   ├── supabase/              # Database clients (server/client)
│   ├── ai/                    # AI integration (prompts, scheduler agent)
│   └── validation/            # Business logic validation
├── supabase/
│   ├── schema.sql             # Complete database schema
│   └── seed-breaking-news-team.sql  # 15 real Breaking News employees
├── tests/                     # Automated test suite (100% coverage)
│   ├── test-api-endpoints.sh  # API endpoint tests (20/20 passing)
│   ├── test-integration.sh    # Integration tests
│   ├── e2e/                   # Playwright E2E tests
│   └── run-all-tests.sh       # Master test runner
└── types/                     # TypeScript type definitions
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

### AI Scheduling (4 endpoints) - Claude Haiku 4.5

- `POST /api/ai/generate-schedule` - Generate AI-powered schedule
- `POST /api/ai/resolve-conflict` - Get AI suggestions for conflict resolution
- `GET /api/ai/status` - Check AI configuration status
- `GET /api/ai/debug-last-response` - Debug failed AI responses (v1.3.2+)

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
ANTHROPIC_API_KEY=your_anthropic_key  # Optional: For AI scheduling features
```

> 🤖 **AI Setup:** To enable AI-powered schedule generation, see [AI_SETUP_TROUBLESHOOTING.md](./AI_SETUP_TROUBLESHOOTING.md)  
> Quick check: `npm run check:ai`

3. **Run database migrations:**

```sql
-- In Supabase SQL editor:
-- 1. Run supabase/schema.sql (required - creates tables)
-- 2. Run supabase/seed-breaking-news-team.sql (optional - 15 real team members)
-- 3. Run supabase/create-dev-admin.sql (optional - dev admin account)
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

**Test Credentials:**

- Seeded users password: `changeme`
- Dev admin (if created): arlyn.gajilan@thomsonreuters / `testtest`

## Frontend

This is an API-only backend. The frontend is built separately:

- **Repository:** <https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development>
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
    { "time": "08:00 - 16:00", "bureau": "Milan" },
    { "time": "14:00 - 22:00", "bureau": "Rome" }
  ],
  "detected_at": "2025-10-29T10:30:00Z"
}
```

## Testing

### Comprehensive Automated Test Suite

ShiftSmart includes **300+ automated tests** with **100% critical path coverage**.

**Quick Start:**

```bash
# Run all tests
cd tests && ./run-comprehensive-tests.sh

# Run specific test suites
npm run test:unit              # Unit tests (59 tests, 100% passing)
npm run test:api               # API tests (20 tests, 100% passing)
npm run test:database          # Database tests (60+ tests)
npm test                       # E2E tests (100+ tests)
npm run test:a11y              # Accessibility tests (20+ tests)
```

**Test Coverage:**

- ✅ **Unit Tests (59/59)** - Utilities, auth, AI integration
- ✅ **API Tests (20/20)** - All 24 endpoints + edge cases
- ✅ **Database Tests (60+)** - Schema, constraints, triggers
- ✅ **E2E Tests (100+)** - Complete user workflows
- ✅ **Accessibility (20+)** - WCAG 2.1 AA compliance
- ✅ **Performance Tests** - Load testing with k6
- ✅ **Security Tests** - SQL injection, XSS prevention

**Test Results:**

- Authentication: 4/4 passing
- Employee Management: 7/7 passing
- Shift Scheduling: 6/6 passing
- Conflict Management: 3/3 passing
- Dashboard: 1/1 passing
- AI Integration: 3/3 passing
- Unit Tests: 59/59 passing
- TypeScript: 0 errors

**Documentation:**

- [Testing Quick Start](./tests/TESTING_QUICKSTART.md) - Daily reference
- [Comprehensive Plan](./tests/COMPREHENSIVE_TESTING_PLAN.md) - Full strategy
- [Test Execution Guide](./TEST_EXECUTION_GUIDE.md) - Commands
- [Test Summary](./TESTING_SUMMARY.md) - Overview

### Manual Testing

**Test credentials (all users):**

- Password: `changeme`
- Users: All 15 Breaking News team members (see database)

**Example test user:**

```
Email: gianluca.semeraro@thomsonreuters.com
Password: changeme
```

## Notes

- **Unified Fullstack App:** Single codebase for frontend and backend (v1.1.0)
- **100% Test Coverage:** All 20 API endpoints tested and passing
- **Minimal Auth:** Uses bcryptjs + session tokens (no Supabase Auth dependency)
- **RLS Disabled:** Internal app with trusted users only
- **Portable:** Easy to migrate to Snowflake later
- **AI-Powered:** Claude Haiku 4.5 for intelligent scheduling (near-frontier performance)
- **Production Ready:** Fully tested and documented

## Version

**Current Version:** 1.3.1  
**Release Date:** November 13, 2025  
**Status:** ✅ Production Ready - 332+ Tests Passing

See [CHANGELOG.md](./CHANGELOG.md) for version history and [API_REFERENCE.md](./API_REFERENCE.md) for detailed API documentation.

---

## Engineering Build Rules

This project follows the **ShiftSmart Engineering Build Rules** for safe, surgical changes:

- **Surgical changes only** (prefer ≤3 files per PR)
- **Production data protection** (use `TEST_TENANT_ID` and test fixtures only)
- **Pre-work verification** (review schema, gotchas, and API contracts before changes)
- **No hardcoded values or tech debt**

### Key Resources

- 📋 [Engineering Build Rules](./ENGINEERING_BUILD_RULES.md) - Full guidelines
- 🔍 [Project Field Gotchas](./docs/PROJECT_FIELD_GOTCHAS.md) - Naming conventions and gotchas
- 📊 [Database Schema](./supabase/schema.sql) - Authoritative schema
- 📡 [API Reference](./API_REFERENCE.md) - API contracts

### Developer Setup

1. **Install pre-commit hooks** (recommended):

   ```bash
   pip install pre-commit
   pre-commit install
   ```

2. **Use test data** from `.env.example`:
   - `TEST_TENANT_ID=00000000-0000-0000-0000-000000000000`
   - `TEST_ACCOUNT_ID=11111111-1111-1111-1111-111111111111`

3. **Verify before changes**:
   - Read `docs/PROJECT_FIELD_GOTCHAS.md` for field naming rules
   - Check `supabase/schema.sql` for database structure
   - Review `API_REFERENCE.md` for API contracts

### Pull Request Guidelines

- Use the [PR template](./.github/pull_request_template.md)
- Keep changes surgical (≤3 files when possible)
- Verify field names against schema
- Use test IDs only (no production data)
- All tests must pass before merging

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Maintained by:** Reuters Breaking News Team  
**Last Updated:** November 13, 2025
