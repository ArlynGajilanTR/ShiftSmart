# ShiftSmart Project Field Gotchas

> **IMPORTANT:** These naming conventions are **intentional design decisions**. Do NOT "fix" them without an ADR and migration plan.

## Overview

This document captures field naming and data structure decisions that may appear inconsistent but are **deliberately chosen** for specific technical or business reasons. These deviations from standard patterns exist to maintain compatibility, optimize performance, or meet specific requirements.

## Database Schema Gotchas

### Users Table

| Field Name | ✅ Use This  | ❌ Not This                  | Reason                                                                                  |
| ---------- | ------------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| users      | `id` (UUID)  | `user_id`                    | Standard primary key convention                                                         |
| users      | `role`       | `user_role` or `system_role` | System permission level (admin/manager/scheduler/staff)                                 |
| users      | `shift_role` | `role`                       | Editorial role for scheduling (editor/senior/correspondent) - distinct from system role |
| users      | `title`      | `position` or `job_title`    | CSV import compatibility - matches "Position" field from legacy data                    |
| users      | `worker_id`  | `external_id`                | Optional legacy identifier for payroll/HR system integration                            |

**Critical Distinction:** `role` vs `shift_role`

- `role` = System permissions (admin, manager, scheduler, staff)
- `shift_role` = Editorial scheduling role (editor, senior, correspondent)
- Both fields are required and serve different purposes

### Shifts Table

| Field Name | ✅ Use This          | ❌ Not This                | Reason                                     |
| ---------- | -------------------- | -------------------------- | ------------------------------------------ |
| shifts     | `id` (UUID)          | `shift_id` or `shift_uuid` | Standard primary key convention            |
| shifts     | `required_roles`     | `roles` or `positions`     | JSONB array of role requirements per shift |
| shifts     | `schedule_period_id` | `period_id`                | Foreign key to schedule_periods table      |
| shifts     | `status`             | `shift_status`             | Enum: draft/published/completed/cancelled  |

### Shift Assignments Table

| Field Name        | ✅ Use This   | ❌ Not This                   | Reason                                       |
| ----------------- | ------------- | ----------------------------- | -------------------------------------------- |
| shift_assignments | `id` (UUID)   | `assignment_id`               | Standard primary key convention              |
| shift_assignments | `assigned_by` | `assigner_id` or `created_by` | Tracks who made the assignment (audit trail) |
| shift_assignments | `status`      | `assignment_status`           | Enum: assigned/confirmed/declined/completed  |

### Shift Preferences Table

| Field Name        | ✅ Use This           | ❌ Not This                | Reason                                                                 |
| ----------------- | --------------------- | -------------------------- | ---------------------------------------------------------------------- |
| shift_preferences | `preferred_days`      | `days` or `available_days` | PostgreSQL TEXT[] array - day names                                    |
| shift_preferences | `preferred_shifts`    | `times` or `shift_times`   | PostgreSQL TEXT[] array - time slots (Morning/Afternoon/Evening/Night) |
| shift_preferences | `max_shifts_per_week` | `max_weekly_shifts`        | Employee constraint for schedule generation                            |

### Conflicts Table

| Field Name           | ✅ Use This      | ❌ Not This           | Reason                                                   |
| -------------------- | ---------------- | --------------------- | -------------------------------------------------------- |
| scheduling_conflicts | `conflict_type`  | `type`                | Fully qualified to avoid reserved word issues            |
| scheduling_conflicts | `severity`       | `priority` or `level` | Enum: low/medium/high/critical                           |
| scheduling_conflicts | `related_shifts` | `shift_ids`           | JSONB array of shift IDs involved in conflict            |
| scheduling_conflicts | `detected_at`    | `created_at`          | Semantic clarity - when conflict was detected vs created |

### Bureaus Table

| Field Name | ✅ Use This | ❌ Not This                     | Reason                                               |
| ---------- | ----------- | ------------------------------- | ---------------------------------------------------- |
| bureaus    | `code`      | `bureau_code` or `abbreviation` | Unique identifier for API/UI (e.g., "MILAN", "ROME") |
| bureaus    | `settings`  | `config` or `preferences`       | JSONB for bureau-specific scheduling rules           |

## API Response Field Gotchas

### Employee Endpoint Responses

The API returns transformed field names for frontend compatibility:

| API Response Field | Database Field | Reason                                    |
| ------------------ | -------------- | ----------------------------------------- |
| `name`             | `full_name`    | Shorter, more intuitive for frontend      |
| `role`             | `title`        | Shows editorial position, not system role |
| `shiftsThisMonth`  | (computed)     | Aggregated value, not a database field    |
| `initials`         | (computed)     | Derived from `full_name`                  |

**Example:**

```json
{
  "id": "uuid",
  "name": "Marco Rossi", // from users.full_name
  "role": "Senior Correspondent", // from users.title
  "bureau": "Milan" // from bureaus.name (joined)
}
```

### Shift Endpoint Responses

| API Response Field | Database Field     | Reason                       |
| ------------------ | ------------------ | ---------------------------- |
| `employee`         | `users.full_name`  | Denormalized for convenience |
| `employee_id`      | `user_id`          | FK reference                 |
| `date`             | `start_time::date` | Extracted date component     |
| `startTime`        | `start_time::time` | Extracted time component     |
| `endTime`          | `end_time::time`   | Extracted time component     |

## Authentication Gotchas

| Field/Concept    | ✅ Use This                     | ❌ Not This             | Reason                                         |
| ---------------- | ------------------------------- | ----------------------- | ---------------------------------------------- |
| Session Token    | `session_token`                 | `token` or `auth_token` | Minimal auth implementation (no Supabase Auth) |
| Password Storage | `password_hash`                 | `password`              | bcryptjs hashed, never plain text              |
| Token Header     | `Authorization: Bearer <token>` | Custom header           | Standard OAuth 2.0 convention                  |

## Test Data Constants

**Test Tenant/Organization IDs** (use these in all test code):

```typescript
// Use in tests only - NOT in production code
export const TEST_BUREAU_ID = '00000000-0000-0000-0000-000000000000';
export const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
export const TEST_SHIFT_ID = '22222222-2222-2222-2222-222222222222';
```

**Test Credentials:**

- Seeded users: all use password `changeme`
- Dev admin: `arlyn.gajilan@thomsonreuters.com` / `testtest`

## AI Integration Gotchas

| Field/Concept   | ✅ Use This                              | ❌ Not This      | Reason                        |
| --------------- | ---------------------------------------- | ---------------- | ----------------------------- |
| AI Provider     | Claude Sonnet 4.5                        | OpenAI or others | Project specification         |
| Env Var         | `ANTHROPIC_API_KEY`                      | `OPENAI_API_KEY` | Anthropic Claude API          |
| Schedule Prompt | `/lib/ai/prompts/schedule-generation.ts` | Inline prompts   | Centralized prompt management |
| Conflict Prompt | `/lib/ai/prompts/conflict-resolution.ts` | Inline prompts   | Centralized prompt management |

## Date/Time Gotchas

| Concept          | ✅ Use This                | ❌ Not This              | Reason                            |
| ---------------- | -------------------------- | ------------------------ | --------------------------------- |
| Timestamps       | `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP`              | All times stored with timezone    |
| Default Timezone | `America/New_York`         | UTC or local             | Editorial teams work in ET/EDT    |
| Date Library     | `date-fns`                 | moment.js or native Date | Modern, tree-shakeable, immutable |

## Migration & Rollback Strategy

**Before changing any field names or types:**

1. **Create an ADR** in `/docs/adr/NNN-change-description.md`
2. **Write a migration script** with forward and backward migrations
3. **Update this gotchas doc** with new conventions
4. **Get stakeholder approval** (especially for API-breaking changes)
5. **Feature flag the change** if it affects production

## Related Documentation

- [Complete Database Schema](../supabase/schema.sql) - Authoritative schema definition
- [API Reference](../API_REFERENCE.md) - API contracts and response formats
- [Engineering Build Rules](../ENGINEERING_BUILD_RULES.md) - Development guidelines

---

**Last Updated:** November 13, 2025  
**Maintained by:** Reuters Breaking News Engineering Team
