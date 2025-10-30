# Changelog

All notable changes to ShiftSmart will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-30

### Added - Phase 3: AI Scheduling Integration
- **AI-Powered Scheduling:** Integrated Claude Sonnet 4.5 for intelligent schedule generation
  - Prompt engineering for context-aware scheduling
  - Employee preferences consideration
  - Role balance optimization
  - Conflict prevention logic
- **AI API Endpoints:**
  - `POST /api/ai/generate-schedule` - Generate optimized schedules
  - `POST /api/ai/resolve-conflict` - Get AI-driven conflict resolution suggestions
  - `GET /api/ai/status` - Check AI service health and configuration
- **AI Utilities:**
  - Anthropic client initialization (`lib/ai/client.ts`)
  - Schedule generation prompt engineering (`lib/ai/prompts/schedule-generation.ts`)
  - Conflict resolution prompt engineering (`lib/ai/prompts/conflict-resolution.ts`)
  - Scheduler agent orchestration (`lib/ai/scheduler-agent.ts`)
- **Documentation:**
  - AI integration guide in README
  - Prompt engineering best practices

### Changed
- Updated README with AI endpoint documentation
- Enhanced DEPLOYMENT.md with AI configuration steps

---

## [0.4.0] - 2025-10-30

### Added - Phase 1C: API-Only Backend Conversion
- Converted Next.js app to API-only architecture
- Removed all frontend components and pages
- Streamlined dependencies (removed `@dnd-kit`, `zustand`, `lucide-react`, Tailwind)
- Created minimal API documentation homepage
- Simplified app layout for API-only usage

### Removed
- All authentication pages (`login`, `signup`, `welcome`)
- All dashboard pages and components
- Calendar components (drag-and-drop, scheduling UI)
- UI components (`BureauToggle`, `ViewSelector`, `ConflictPanel`)
- Frontend-specific dependencies
- Middleware for route protection

### Changed
- Updated README to reflect API-only nature
- Simplified package.json dependencies
- Modified app/page.tsx as API documentation landing page
- Updated DEPLOYMENT.md for backend-only deployment

---

## [0.3.0] - 2025-10-30

### Added - Phase 1B: Core API Endpoints
- **Authentication API:**
  - `POST /api/auth/login` - User login with session tokens
  - `POST /api/auth/signup` - New user registration
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/session` - Get current session
- **Employees API:**
  - `GET /api/employees` - List employees (filtering, search)
  - `POST /api/employees` - Create employee
  - `GET /api/employees/:id` - Get employee details
  - `PUT /api/employees/:id` - Update employee
  - `DELETE /api/employees/:id` - Delete employee
  - `GET /api/employees/:id/preferences` - Get shift preferences
  - `PUT /api/employees/:id/preferences` - Update shift preferences
- **Shifts API:**
  - `GET /api/shifts` - List shifts (date range, bureau filters)
  - `POST /api/shifts` - Create shift with optional assignment
  - `GET /api/shifts/upcoming` - Get upcoming shifts for dashboard
  - `GET /api/shifts/:id` - Get shift details
  - `PUT /api/shifts/:id` - Update shift
  - `PATCH /api/shifts/:id` - Move shift (drag-and-drop support)
  - `DELETE /api/shifts/:id` - Delete shift
- **Conflicts API:**
  - `GET /api/conflicts` - List conflicts (status, severity filters)
  - `PATCH /api/conflicts/:id` - Acknowledge or resolve conflict
  - `DELETE /api/conflicts/:id` - Dismiss conflict
- **Dashboard API:**
  - `GET /api/dashboard/stats` - Aggregated statistics
- **Utilities:**
  - Session verification helper (`lib/auth/verify.ts`)
  - Business logic validation (`lib/validation/conflicts.ts`)

### Changed
- Enhanced README with complete API endpoint documentation
- Updated DEPLOYMENT.md with API deployment instructions

---

## [0.2.0] - 2025-10-30

### Added - Phase 1A: Real Data & Minimal Auth
- **Database Schema Updates:**
  - Enhanced `users` table with `phone`, `worker_id`, `title`, `team`, `status`, `shift_role`
  - Added `password_hash`, `session_token`, `session_expires_at` for minimal auth
  - Created `shift_preferences` table for employee availability
  - Enhanced `conflicts` table with frontend-aligned fields (`status`, `severity`, `date`)
  - Added indexes for performance (`session_token`, `status`, `severity`, `date`)
  - Updated RLS policies for internal app usage
- **Real Employee Data:**
  - Seeded 15 Breaking News team members from Milan and Rome CSVs
  - 8 Milan staff: 3 Senior Correspondents + 5 Correspondents
  - 7 Rome staff: 1 Editor + 3 Senior Correspondents + 3 Correspondents
  - Captured employee preferences (unavailable days)
- **Minimal Authentication System:**
  - bcryptjs password hashing (`lib/auth/password.ts`)
  - Session token management
  - Portable authentication (no Supabase Auth dependency)
- **SQL Scripts:**
  - `supabase/schema.sql` - Full database schema
  - `supabase/seed-breaking-news-team.sql` - Real Breaking News team data

### Changed
- Updated package.json with bcryptjs dependency
- Enhanced README with setup instructions for real data
- Updated DEPLOYMENT.md with auth configuration

---

## [0.1.0] - 2025-10-30

### Added - Phase 0: Frontend Analysis & Planning
- **Frontend Analysis:**
  - Detailed audit of V0 frontend (50+ components)
  - Identified required backend APIs
  - Documented frontend data expectations
  - Assessed gaps (data shape, computed fields, conflict workflow)
- **Documentation:**
  - Created `PHASE_0_FRONTEND_ANALYSIS.md` - Comprehensive frontend analysis
  - Created `PRD.md` - Original Product Requirements Document
  - Created `MVP_REQUIREMENTS.md` - MVP scope and requirements
  - Created `REUTERS_BRANDING.md` - Branding guidelines
  - Created `SETUP_INSTRUCTIONS.md` - Development setup guide
  - Created `DEPLOYMENT.md` - Deployment instructions
  - Created `QUICKSTART.md` - Quick start guide
- **Planning:**
  - Defined phased development approach
  - Established API-only backend strategy
  - Planned AI integration architecture

### Changed
- Initial project setup with Next.js 16
- Configured Supabase client
- Set up TypeScript configuration

---

## Project Structure

```
shiftsmart-v1/
├── app/api/              # API routes (RESTful endpoints)
├── lib/                  # Business logic, utilities, AI
├── supabase/             # Database schema and seeds
├── types/                # TypeScript type definitions
└── docs/                 # Comprehensive documentation
```

---

## Version Numbering

ShiftSmart follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.x.x): Incompatible API changes
- **MINOR** version (x.1.x): New functionality (backward compatible)
- **PATCH** version (x.x.1): Bug fixes (backward compatible)

### Version History Summary

- **1.0.0** - Production-ready API with AI scheduling (Current)
- **0.4.0** - API-only backend conversion
- **0.3.0** - Core API endpoints implementation
- **0.2.0** - Real employee data and minimal auth
- **0.1.0** - Frontend analysis and planning

---

## Links

- **GitHub Repository:** https://github.com/ArlynGajilanTR/ShiftSmart
- **Frontend Repository:** https://github.com/ArlynGajilanTR/v0-shift-smart-frontend-development
- **API Documentation:** See [API_REFERENCE.md](./API_REFERENCE.md)
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

[1.0.0]: https://github.com/ArlynGajilanTR/ShiftSmart/releases/tag/v1.0.0
[0.4.0]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ArlynGajilanTR/ShiftSmart/releases/tag/v0.1.0

