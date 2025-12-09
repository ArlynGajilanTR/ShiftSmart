# ShiftSmart Database Schema

**Version:** 1.6.1  
**Database:** PostgreSQL (Supabase)  
**Last Updated:** December 8, 2025  
**Purpose:** AI-friendly database reference for development and debugging

---

## Quick Reference

| Table               | Purpose                     | Key Relationships                  |
| ------------------- | --------------------------- | ---------------------------------- |
| `bureaus`           | Organizations (Milan, Rome) | Parent of users, shifts            |
| `users`             | Staff members               | Belongs to bureau, has preferences |
| `schedule_periods`  | Time ranges for scheduling  | Contains shifts                    |
| `shifts`            | Individual shift slots      | Belongs to bureau, has assignments |
| `shift_assignments` | User-to-shift mappings      | Links users to shifts              |
| `shift_preferences` | Employee availability       | One per user                       |
| `time_off_requests` | Pre-approved time off       | Belongs to user (v1.6.1+)          |
| `conflicts`         | Scheduling conflicts        | References shifts/users            |
| `audit_logs`        | Change history              | References users                   |

---

## Entity Relationship Diagram

```
┌─────────────────┐
│    bureaus      │
│─────────────────│
│ id (PK)         │
│ name            │
│ code (UNIQUE)   │
│ timezone        │
│ settings (JSON) │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────┬─────────────────┐
    │         │                 │
    ▼         ▼                 ▼
┌────────┐ ┌──────────────┐ ┌──────────┐
│ users  │ │schedule_     │ │  shifts  │
│        │ │periods       │ │          │
└───┬────┘ └──────────────┘ └────┬─────┘
    │                            │
    │ 1:1                        │ 1:N
    │                            │
    ▼                            ▼
┌────────────────┐        ┌─────────────────┐
│ shift_         │        │ shift_          │
│ preferences    │        │ assignments     │
└────────────────┘        └────────┬────────┘
                                   │
                                   │ N:1
                                   ▼
                          ┌─────────────────┐
                          │    conflicts    │
                          └─────────────────┘
```

---

## Table Definitions

### 1. `bureaus` - Organizations/Departments

**Purpose:** Represents Reuters bureaus (Milan and Rome offices)

```sql
CREATE TABLE bureaus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,              -- "Milan Bureau", "Rome Bureau"
    code VARCHAR(50) UNIQUE NOT NULL,        -- "MILAN", "ROME"
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    settings JSONB DEFAULT '{...}',          -- Bureau-specific rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column       | Type         | Nullable | Description               |
| ------------ | ------------ | -------- | ------------------------- |
| `id`         | UUID         | No       | Primary key               |
| `name`       | VARCHAR(255) | No       | Display name              |
| `code`       | VARCHAR(50)  | No       | Unique code (MILAN, ROME) |
| `timezone`   | VARCHAR(50)  | Yes      | Default: America/New_York |
| `settings`   | JSONB        | Yes      | Configuration object      |
| `created_at` | TIMESTAMPTZ  | Yes      | Auto-set                  |
| `updated_at` | TIMESTAMPTZ  | Yes      | Auto-updated via trigger  |

**Settings JSON Structure:**

```json
{
  "min_senior_per_shift": 1,
  "max_junior_per_shift": 3,
  "require_lead": true,
  "shift_duration_hours": 8
}
```

---

### 2. `users` - Staff Members

**Purpose:** All staff members who can be scheduled

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    worker_id VARCHAR(50),

    -- System role (permissions)
    role VARCHAR(50) NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'manager', 'scheduler', 'staff')),

    -- Job title (from CSV import)
    title VARCHAR(255) NOT NULL,

    -- Scheduling role (for shift balancing)
    shift_role VARCHAR(50) NOT NULL
        CHECK (shift_role IN ('editor', 'senior', 'correspondent')),

    bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
    team VARCHAR(100) DEFAULT 'Breaking News',
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'on-leave', 'inactive')),

    -- Authentication
    password_hash VARCHAR(255),
    session_token VARCHAR(255),
    session_expires_at TIMESTAMP WITH TIME ZONE,

    -- Team leader flag
    is_team_leader BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column               | Type         | Nullable | Description                                            |
| -------------------- | ------------ | -------- | ------------------------------------------------------ |
| `id`                 | UUID         | No       | Primary key                                            |
| `email`              | VARCHAR(255) | No       | Unique email address                                   |
| `full_name`          | VARCHAR(255) | No       | Display name                                           |
| `phone`              | VARCHAR(50)  | Yes      | Contact phone                                          |
| `worker_id`          | VARCHAR(50)  | Yes      | External employee ID                                   |
| `role`               | VARCHAR(50)  | No       | System permission role                                 |
| `title`              | VARCHAR(255) | No       | Job title (e.g., "Senior Breaking News Correspondent") |
| `shift_role`         | VARCHAR(50)  | No       | Role for shift balancing                               |
| `bureau_id`          | UUID         | Yes      | FK to bureaus                                          |
| `team`               | VARCHAR(100) | Yes      | Team name (default: Breaking News)                     |
| `status`             | VARCHAR(50)  | Yes      | active, on-leave, inactive                             |
| `password_hash`      | VARCHAR(255) | Yes      | bcrypt hash                                            |
| `session_token`      | VARCHAR(255) | Yes      | Current session token                                  |
| `session_expires_at` | TIMESTAMPTZ  | Yes      | Token expiry time                                      |
| `is_team_leader`     | BOOLEAN      | Yes      | Can confirm preferences                                |

**⚠️ Important Field Distinctions:**

- `role` = System permissions (admin, manager, scheduler, staff)
- `shift_role` = Scheduling role (editor, senior, correspondent)
- `title` = Human-readable job title

---

### 3. `schedule_periods` - Scheduling Time Ranges

**Purpose:** Defines schedule periods (week, month, quarter, special events)

```sql
CREATE TABLE schedule_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL
        CHECK (type IN ('week', 'month', 'quarter', 'special_event')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

| Column       | Type         | Nullable | Description                         |
| ------------ | ------------ | -------- | ----------------------------------- |
| `id`         | UUID         | No       | Primary key                         |
| `bureau_id`  | UUID         | Yes      | FK to bureaus                       |
| `name`       | VARCHAR(255) | No       | Period name                         |
| `type`       | VARCHAR(50)  | No       | week, month, quarter, special_event |
| `start_date` | DATE         | No       | Period start                        |
| `end_date`   | DATE         | No       | Period end                          |
| `status`     | VARCHAR(50)  | Yes      | draft, published, archived          |
| `created_by` | UUID         | Yes      | FK to users                         |

---

### 4. `shifts` - Individual Shift Slots

**Purpose:** Each schedulable shift time slot

```sql
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
    schedule_period_id UUID REFERENCES schedule_periods(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    required_staff INTEGER DEFAULT 1,
    required_roles JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_shift_time CHECK (end_time > start_time)
);
```

| Column               | Type        | Nullable | Description                            |
| -------------------- | ----------- | -------- | -------------------------------------- |
| `id`                 | UUID        | No       | Primary key                            |
| `bureau_id`          | UUID        | Yes      | FK to bureaus                          |
| `schedule_period_id` | UUID        | Yes      | FK to schedule_periods                 |
| `start_time`         | TIMESTAMPTZ | No       | Shift start datetime                   |
| `end_time`           | TIMESTAMPTZ | No       | Shift end datetime                     |
| `required_staff`     | INTEGER     | Yes      | Number of staff needed                 |
| `required_roles`     | JSONB       | Yes      | Role requirements array                |
| `status`             | VARCHAR(50) | Yes      | draft, published, completed, cancelled |
| `notes`              | TEXT        | Yes      | Shift notes                            |

**required_roles JSON Structure:**

```json
[
  { "role": "senior", "min_count": 1, "max_count": 2 },
  { "role": "correspondent", "min_count": 1, "max_count": 3 }
]
```

---

### 5. `shift_assignments` - User-to-Shift Mappings

**Purpose:** Links employees to specific shifts

```sql
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned'
        CHECK (status IN ('assigned', 'confirmed', 'declined', 'completed')),
    assigned_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (shift_id, user_id)  -- One assignment per user per shift
);
```

| Column        | Type        | Nullable | Description                              |
| ------------- | ----------- | -------- | ---------------------------------------- |
| `id`          | UUID        | No       | Primary key                              |
| `shift_id`    | UUID        | Yes      | FK to shifts                             |
| `user_id`     | UUID        | Yes      | FK to users                              |
| `status`      | VARCHAR(50) | Yes      | assigned, confirmed, declined, completed |
| `assigned_by` | UUID        | Yes      | FK to users (who made assignment)        |
| `notes`       | TEXT        | Yes      | Assignment notes                         |

**Unique Constraint:** One user can only be assigned once per shift.

---

### 6. `shift_preferences` - Employee Availability

**Purpose:** Stores employee availability and shift preferences

```sql
CREATE TABLE shift_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_days TEXT[] DEFAULT '{}',      -- ['Monday', 'Tuesday']
    preferred_shifts TEXT[] DEFAULT '{}',    -- ['Morning', 'Afternoon']
    max_shifts_per_week INTEGER DEFAULT 5,
    notes TEXT,
    confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column                | Type        | Nullable | Description                         |
| --------------------- | ----------- | -------- | ----------------------------------- |
| `id`                  | UUID        | No       | Primary key                         |
| `user_id`             | UUID        | No       | FK to users (UNIQUE - one per user) |
| `preferred_days`      | TEXT[]      | Yes      | Array of day names                  |
| `preferred_shifts`    | TEXT[]      | Yes      | Array of shift times                |
| `max_shifts_per_week` | INTEGER     | Yes      | Weekly shift limit                  |
| `notes`               | TEXT        | Yes      | Additional preferences              |
| `confirmed`           | BOOLEAN     | Yes      | Team leader confirmed               |
| `confirmed_by`        | UUID        | Yes      | FK to users (team leader)           |
| `confirmed_at`        | TIMESTAMPTZ | Yes      | Confirmation timestamp              |

**Array Values:**

- `preferred_days`: `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']`
- `preferred_shifts`: `['Morning', 'Afternoon', 'Evening', 'Night']`

**Confirmation Workflow:**

The `confirmed`, `confirmed_by`, and `confirmed_at` fields implement a team leader approval workflow:

- When an employee sets or updates their preferences, `confirmed` is set to `false`
- A team leader can review and confirm preferences via `/api/employees/:id/preferences/confirm`
- Once confirmed, the AI scheduler treats these preferences as high-priority soft constraints
- Unconfirmed preferences are still used by the scheduler, but treated as lower-priority hints

> **AI Scheduling Integration:** The scheduler includes a `Preference Status` indicator (CONFIRMED or PENDING) for each employee in the prompt sent to Claude. This allows the AI to prioritize confirmed preferences when making scheduling decisions.

---

### 7. `time_off_requests` - Pre-Approved Time Off _(NEW in v1.6.1)_

**Purpose:** Stores employee pre-approved vacation and personal time off dates

```sql
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'personal', 'sick', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

| Column       | Type        | Nullable | Description                          |
| ------------ | ----------- | -------- | ------------------------------------ |
| `id`         | UUID        | No       | Primary key                          |
| `user_id`    | UUID        | No       | FK to users                          |
| `start_date` | DATE        | No       | First day of time off                |
| `end_date`   | DATE        | No       | Last day of time off (>= start_date) |
| `type`       | VARCHAR(50) | No       | vacation, personal, sick, other      |
| `notes`      | TEXT        | Yes      | Optional notes                       |
| `created_at` | TIMESTAMPTZ | Yes      | Auto-set                             |
| `updated_at` | TIMESTAMPTZ | Yes      | Auto-updated via trigger             |

**Time Off Types:**

| Type       | Description              |
| ---------- | ------------------------ |
| `vacation` | Scheduled vacation leave |
| `personal` | Personal day             |
| `sick`     | Sick leave               |
| `other`    | Other approved time off  |

> **AI Integration:** Time-off dates are automatically included in `unavailable_days` when generating schedules with the AI scheduler, ensuring employees are not scheduled during their approved time off.

---

### 8. `conflicts` - Scheduling Conflicts

**Purpose:** Tracks detected scheduling conflicts

```sql
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'Double Booking',
        'Rest Period Violation',
        'Skill Gap',
        'Understaffed',
        'Overtime Warning',
        'Cross-Bureau Conflict',
        'Preference Violation'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    status VARCHAR(50) NOT NULL DEFAULT 'unresolved'
        CHECK (status IN ('unresolved', 'acknowledged', 'resolved')),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    details JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column            | Type         | Nullable | Description                        |
| ----------------- | ------------ | -------- | ---------------------------------- |
| `id`              | UUID         | No       | Primary key                        |
| `type`            | VARCHAR(100) | No       | Conflict type (see allowed values) |
| `severity`        | VARCHAR(50)  | No       | high, medium, low                  |
| `status`          | VARCHAR(50)  | No       | unresolved, acknowledged, resolved |
| `shift_id`        | UUID         | Yes      | FK to shifts                       |
| `user_id`         | UUID         | Yes      | FK to users (affected employee)    |
| `description`     | TEXT         | No       | Human-readable explanation         |
| `date`            | DATE         | No       | Date of conflict                   |
| `details`         | JSONB        | Yes      | Additional context                 |
| `detected_at`     | TIMESTAMPTZ  | Yes      | When conflict was found            |
| `acknowledged_at` | TIMESTAMPTZ  | Yes      | When acknowledged                  |
| `acknowledged_by` | UUID         | Yes      | FK to users                        |
| `resolved_at`     | TIMESTAMPTZ  | Yes      | When resolved                      |
| `resolved_by`     | UUID         | Yes      | FK to users                        |

**Conflict Types & Severity:**

| Type                  | Severity | Description                           |
| --------------------- | -------- | ------------------------------------- |
| Double Booking        | high     | User assigned to overlapping shifts   |
| Rest Period Violation | high     | Less than 11 hours between shifts     |
| Skill Gap             | high     | No senior/lead on shift with juniors  |
| Understaffed          | medium   | Not enough staff assigned             |
| Overtime Warning      | medium   | Weekly hours exceed limit             |
| Cross-Bureau Conflict | medium   | Conflicts across Milan/Rome           |
| Preference Violation  | low      | Assignment conflicts with preferences |

---

### 9. `audit_logs` - Change History

**Purpose:** Tracks all changes for compliance and debugging

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column        | Type         | Nullable | Description                   |
| ------------- | ------------ | -------- | ----------------------------- |
| `id`          | UUID         | No       | Primary key                   |
| `user_id`     | UUID         | Yes      | FK to users (who made change) |
| `action`      | VARCHAR(100) | No       | create, update, delete, etc.  |
| `entity_type` | VARCHAR(50)  | No       | Table name affected           |
| `entity_id`   | UUID         | Yes      | ID of affected record         |
| `changes`     | JSONB        | Yes      | Before/after values           |
| `ip_address`  | INET         | Yes      | Client IP address             |
| `created_at`  | TIMESTAMPTZ  | Yes      | When action occurred          |

---

## Indexes

```sql
-- Users
CREATE INDEX idx_users_bureau ON users(bureau_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_session_token ON users(session_token);
CREATE INDEX idx_users_is_team_leader ON users(is_team_leader) WHERE is_team_leader = true;

-- Shifts
CREATE INDEX idx_shifts_bureau ON shifts(bureau_id);
CREATE INDEX idx_shifts_time_range ON shifts(start_time, end_time);
CREATE INDEX idx_shifts_schedule_period ON shifts(schedule_period_id);

-- Shift Assignments
CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_user ON shift_assignments(user_id);

-- Shift Preferences
CREATE INDEX idx_shift_preferences_user ON shift_preferences(user_id);
CREATE INDEX idx_shift_preferences_confirmed ON shift_preferences(confirmed);

-- Conflicts
CREATE INDEX idx_conflicts_shift ON conflicts(shift_id);
CREATE INDEX idx_conflicts_user ON conflicts(user_id);
CREATE INDEX idx_conflicts_status ON conflicts(status);
CREATE INDEX idx_conflicts_severity ON conflicts(severity);
CREATE INDEX idx_conflicts_date ON conflicts(date);

-- Schedule Periods
CREATE INDEX idx_schedule_periods_bureau ON schedule_periods(bureau_id);
CREATE INDEX idx_schedule_periods_dates ON schedule_periods(start_date, end_date);
```

---

## Triggers

### Auto-update `updated_at` Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to tables:
CREATE TRIGGER update_bureaus_updated_at BEFORE UPDATE ON bureaus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_periods_updated_at BEFORE UPDATE ON schedule_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at BEFORE UPDATE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_preferences_updated_at BEFORE UPDATE ON shift_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS)

All tables have RLS enabled with permissive policies for authenticated users:

```sql
-- RLS Enabled
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissive Policies (internal app with trusted users)
CREATE POLICY "Authenticated users can view all bureaus" ON bureaus FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view all shifts" ON shifts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage shifts" ON shifts FOR ALL USING (true);
-- ... (similar for other tables)
```

**Note:** Current policies are permissive for internal use. For stricter access control, implement role-based policies using custom claims.

---

## Common Queries

### Get all employees with their bureau

```sql
SELECT u.*, b.name as bureau_name, b.code as bureau_code
FROM users u
LEFT JOIN bureaus b ON u.bureau_id = b.id
WHERE u.status = 'active'
ORDER BY u.full_name;
```

### Get shifts for a date range with assignments

```sql
SELECT
  s.*,
  json_agg(
    json_build_object(
      'id', sa.id,
      'user_id', sa.user_id,
      'user_name', u.full_name,
      'shift_role', u.shift_role,
      'status', sa.status
    )
  ) as assignments
FROM shifts s
LEFT JOIN shift_assignments sa ON s.id = sa.shift_id
LEFT JOIN users u ON sa.user_id = u.id
WHERE s.start_time >= '2025-01-01' AND s.end_time <= '2025-01-07'
GROUP BY s.id
ORDER BY s.start_time;
```

### Get unresolved conflicts by severity

```sql
SELECT c.*, s.start_time, s.end_time, u.full_name as user_name
FROM conflicts c
LEFT JOIN shifts s ON c.shift_id = s.id
LEFT JOIN users u ON c.user_id = u.id
WHERE c.status = 'unresolved'
ORDER BY
  CASE c.severity
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  c.detected_at DESC;
```

### Check for double bookings

```sql
SELECT u.full_name, s1.start_time, s1.end_time, s2.start_time as conflict_start
FROM shift_assignments sa1
JOIN shift_assignments sa2 ON sa1.user_id = sa2.user_id AND sa1.id != sa2.id
JOIN shifts s1 ON sa1.shift_id = s1.id
JOIN shifts s2 ON sa2.shift_id = s2.id
JOIN users u ON sa1.user_id = u.id
WHERE s1.start_time < s2.end_time AND s1.end_time > s2.start_time;
```

### Get employee preferences with confirmation status

```sql
SELECT
  u.id, u.full_name, u.shift_role,
  sp.preferred_days, sp.preferred_shifts, sp.max_shifts_per_week,
  sp.confirmed, sp.confirmed_at,
  confirmer.full_name as confirmed_by_name
FROM users u
LEFT JOIN shift_preferences sp ON u.id = sp.user_id
LEFT JOIN users confirmer ON sp.confirmed_by = confirmer.id
WHERE u.status = 'active'
ORDER BY u.full_name;
```

---

## TypeScript Type Mappings

See `types/index.ts` for complete type definitions. Key mappings:

| DB Column     | TypeScript Type                             |
| ------------- | ------------------------------------------- |
| `UUID`        | `string`                                    |
| `VARCHAR`     | `string`                                    |
| `TEXT`        | `string`                                    |
| `INTEGER`     | `number`                                    |
| `BOOLEAN`     | `boolean`                                   |
| `JSONB`       | `Record<string, any>` or specific interface |
| `TEXT[]`      | `string[]`                                  |
| `TIMESTAMPTZ` | `string` (ISO format)                       |
| `DATE`        | `string` (YYYY-MM-DD)                       |

---

## Migration Files

Located in `supabase/migrations/`:

| File                          | Purpose                    |
| ----------------------------- | -------------------------- |
| `schema.sql`                  | Full database schema       |
| `seed-breaking-news-team.sql` | Sample data (15 employees) |
| `add-superusers.sql`          | Admin user creation        |
| `create-dev-admin.sql`        | Development admin setup    |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoint documentation
- [docs/PROJECT_FIELD_GOTCHAS.md](./docs/PROJECT_FIELD_GOTCHAS.md) - Field naming conventions
- [types/index.ts](./types/index.ts) - TypeScript type definitions

---

**Maintained by:** Reuters Breaking News Team  
**Last Updated:** December 8, 2025
