# ShiftSmart v1 - Product Requirements Document

## Executive Summary
ShiftSmart is an internal Reuters tool for intelligent shift scheduling designed specifically for the Breaking News editorial team. The application manages staff assignments across Milan and Rome bureaus with automated conflict detection and role-based validation to ensure proper editorial coverage at all times.

## Target Users
- **Primary**: Reuters Breaking News editors and schedulers in Milan and Rome
- **User Types**: Senior Editors, Junior Editors, Lead Editors, Support Staff
- **Administrators**: Scheduling managers who create and publish shift schedules

## MVP Scope (Breaking News Team)

### Team Structure
- **Team**: Breaking News
- **Bureaus**: Milan and Rome
- **Timezone**: Europe/Rome (CET/CEST)
- **Staff Import**: CSV-based bulk import of existing staff

### Initial Implementation
- Single team focus (Breaking News only)
- Two bureaus (Milan and Rome)
- Staff members distributed across both locations
- Unified scheduling interface for cross-bureau coordination

## Core Features

### 1. Multi-View Scheduling ✅
Support for multiple planning horizons:
- **Week View**: 7-day planning with detailed daily breakdown
- **Month View**: 30-day overview for medium-term planning
- **Quarter View**: 90-day strategic planning
- **Special Events**: Custom date ranges for conferences, events, etc.

Users can switch between views seamlessly and navigate forward/backward through time periods.

### 2. Role-Based Shift Balancing ✅
Intelligent validation of staff skill mix:
- Define minimum/maximum role requirements per shift
- Prevent all-junior coverage (critical safety feature)
- Ensure appropriate senior/lead presence
- Configurable rules per bureau/department

**Example Rules**:
- Minimum 1 senior per shift
- Maximum 3 juniors per shift
- Must have 1 lead on night shifts
- Support staff as needed

### 3. Supabase Backend ✅
PostgreSQL database with:
- User management with roles
- Bureau/department organization
- Shifts and assignments
- Conflict tracking
- Audit logging
- Row-level security

**CSV Import Support**:
- Bulk import from existing schedules
- Template download
- Validation and error reporting
- Upsert logic (update existing, create new)

### 4. Smart Welcome & Authentication ✅
User onboarding flow:
- Login page with email/password
- Welcome screen with feature overview
- Bureau selection with visual cards
- Persistent session management
- Bureau toggle in main interface

### 5. Drag-and-Drop Calendar ✅
Intuitive scheduling interface:
- Drag staff from sidebar to shifts
- Visual feedback on drag
- Color-coded shift status:
  - Gray: Empty
  - Yellow: Partially filled
  - Green: Fully staffed
  - Red: Has hard conflicts
- One-click removal of assignments
- Role badges for each staff member
- Assignment counters

### 6. Conflict Detection & Warnings ✅

**Hard Conflicts** (Block publishing):
- **Double Booking**: User assigned to overlapping shifts
- **Rest Period Violation**: Less than 11 hours between shifts
- **Skill Gap**: No senior/lead on shift with juniors
- **Insufficient Coverage**: Not enough staff assigned

**Soft Warnings** (Review recommended):
- **Preference Violation**: User marked date as unavailable or non-preferred day
- **Overtime Risk**: Weekly hours exceed limit
- **Role Imbalance**: Too many of one role type

**Conflict Panel**:
- Real-time conflict display
- Summary counts (hard vs soft)
- Detailed messages with context
- User and shift information
- Color-coded severity

## User Roles

### System Roles (Access Control)
1. **Admin**: Full system access, bureau management
2. **Manager**: Bureau-level scheduling and reporting  
3. **Scheduler**: Create and modify schedules
4. **Staff**: View own schedule, set preferences

### Editorial Roles (Shift Validation)
1. **Lead Editor**: Senior oversight, required for certain shifts
2. **Senior Editor**: Experienced staff, minimum 1 per shift
3. **Junior Editor**: Developing staff, maximum 3 per shift
4. **Support Staff**: Administrative and technical support

### Role Requirements (Breaking News Team)
- **Minimum per shift**: 1 Senior or Lead Editor
- **Maximum juniors**: 3 Junior Editors per shift
- **Lead requirement**: Required for night shifts
- **No all-junior shifts**: System prevents this automatically

## Design & Branding

### Reuters Brand Standards
- **Primary Color**: Reuters Orange (#FF6600)
- **Typography**: Knowledge2017 (Regular, Medium, Bold)
- **Background**: White with gray accents
- **UI Style**: Professional, clean, no emojis
- **Tone**: Internal tool, not commercial/consumer

### Visual Identity
- Professional editorial environment
- Clean, modern interface suitable for newsroom
- Focus on functionality over decoration
- Orange accent color for primary actions

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 + Tailwind CSS
- **Styling**: Tailwind with custom Reuters theme
- **Drag & Drop**: @dnd-kit
- **Date Handling**: date-fns
- **State**: Zustand (for complex state)
- **Icons**: Lucide React (professional icons only)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with email/password
- **Storage**: Supabase Storage (for exports/reports)
- **Real-time**: Supabase Realtime (future enhancement)

### Data Model
```
bureaus (Milan, Rome)
  ├── users (Breaking News staff members)
  │   ├── bureau_id → Milan or Rome
  │   ├── shift_role → senior, junior, lead, support
  │   └── preferences → { team: "Breaking News" }
  ├── schedule_periods
  │   └── shifts
  │       └── shift_assignments
  │           └── conflicts
  └── audit_logs
```

### User Profile Structure
```javascript
{
  id: UUID,
  email: string,
  full_name: string,
  role: 'admin' | 'manager' | 'scheduler' | 'staff',
  shift_role: 'senior' | 'junior' | 'lead' | 'support',
  bureau_id: UUID, // Milan or Rome
  preferences: {
    team: 'Breaking News',
    unavailable_dates: [],
    preferred_days: [1,2,3,4,5],
    max_shifts_per_week: 5
  }
}
```

## Validation Rules

### Shift Assignment Validation
1. Check for time conflicts
2. Verify rest period compliance
3. Validate role requirements
4. Check user preferences
5. Calculate weekly hours
6. Assess skill mix

### Role Balance Validation
1. Count staff by role
2. Compare against requirements
3. Flag skill gaps
4. Check coverage levels

## Import/Export

### CSV Import (Critical for MVP)
- **Purpose**: Bulk import Breaking News team members
- **Source**: Existing staff roster from Milan and Rome
- **Fields Required**:
  - date, start_time, end_time
  - staff_name, staff_email
  - role (senior/junior/lead/support)
  - bureau (Milan/Rome)
- **Functionality**:
  - Automatic user creation/update
  - Role normalization
  - Bureau assignment
  - Team assignment (auto-set to "Breaking News")
  - Error reporting with detailed feedback
  - Transaction-based processing

### Export Options (Future)
- Current schedule to CSV
- Conflict reports
- Workload distribution
- Coverage analysis

## Security

### Row-Level Security (RLS)
- Users see only their bureau data
- Managers can modify schedules
- Staff can view only
- Admins have full access

### Audit Trail
- All schedule changes logged
- User ID, action, timestamp
- Before/after state
- IP address tracking

## Performance Considerations

- Indexed date ranges for fast queries
- Efficient conflict checking
- Lazy loading of large date ranges
- Pagination for user lists
- Optimistic UI updates

## Future Enhancements

1. **Real-time Collaboration**
   - Multiple schedulers working simultaneously
   - Live cursor positions
   - Conflict resolution

2. **Mobile App**
   - Staff can view schedules
   - Swap shifts
   - Set availability

3. **Advanced Analytics**
   - Workload distribution charts
   - Cost analysis
   - Predictive staffing needs

4. **Notifications**
   - Email/SMS for new assignments
   - Shift reminders
   - Conflict alerts

5. **Shift Swapping**
   - Staff request swaps
   - Manager approval
   - Automatic revalidation

6. **Templates**
   - Save recurring patterns
   - Apply to new periods
   - Role-based templates

## Success Metrics

### Efficiency
- Time to create schedule: < 30 minutes for monthly schedule
- Conflict detection rate: 100% of conflicts caught
- Schedule changes after publish: < 10%

### Reliability
- System uptime: 99.9%
- Data accuracy: Zero scheduling conflicts published
- CSV import success rate: > 95%

### Adoption (Breaking News Team)
- User satisfaction: > 4/5 rating
- Milan bureau adoption: 100% within 2 weeks
- Rome bureau adoption: 100% within 2 weeks
- Scheduler efficiency improvement: 50%+ time saved

## Compliance

- Labor law compliance (rest periods)
- Union agreements (if applicable)
- Equal distribution of shifts
- Preference accommodation

## Authentication & Onboarding

### Signup Flow
1. User provides:
   - Full name
   - Reuters email address
   - Password
   - **Bureau selection** (Milan or Rome)
   - **Team** (auto-filled: Breaking News)
   - **Role level** (Senior/Junior/Lead/Support)
2. Profile automatically created in database
3. Bureau assignment stored
4. Direct redirect to dashboard (no bureau selection screen)

### Login Flow
1. Email/password authentication
2. Check user's assigned bureau
3. Auto-load bureau in session
4. **Direct to dashboard** (skip bureau selection)
5. Bureau toggle available in header if needed

## Deployment

- **Production**: Vercel/Railway
- **Database**: Supabase (hosted PostgreSQL)
- **Environment**: Node.js 18+
- **Monitoring**: Sentry/LogRocket (future)
- **Region**: Europe (for Milan/Rome users)

