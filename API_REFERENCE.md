# ShiftSmart API Reference

**Version:** 1.6.0  
**Base URL:** `https://your-api-domain.vercel.app`  
**Last Updated:** December 8, 2025

> **v1.6.0 Changes:** Added Team Leader system with preference confirmation workflow. Team leaders and admins can now confirm employee shift preferences and control access to AI schedule generation.

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile API](#user-profile-api)
3. [Employees API](#employees-api)
4. [Team Availability API](#team-availability-api) _(NEW)_
5. [Shifts API](#shifts-api)
6. [Conflicts API](#conflicts-api)
7. [Dashboard API](#dashboard-api)
8. [AI Scheduling API](#ai-scheduling-api)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Versioning](#versioning)

---

## Authentication

All endpoints (except auth endpoints) require a Bearer token in the Authorization header.

### POST /api/auth/login

Authenticate a user and receive a session token.

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "gianluca.semeraro@thomsonreuters.com",
  "password": "changeme"
}
```

**Response (200 OK):**

```json
{
  "token": "abc123...",
  "user": {
    "id": "uuid",
    "email": "gianluca.semeraro@thomsonreuters.com",
    "full_name": "Gianluca Semeraro",
    "role": "staff",
    "bureau_id": "uuid",
    "team": "Breaking News"
  }
}
```

**Errors:**

- `400` - Missing email or password
- `401` - Invalid credentials

---

### POST /api/auth/signup

Register a new user (internal staff only).

**Request:**

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "new.user@thomsonreuters.com",
  "password": "secure_password",
  "full_name": "New User",
  "role": "staff",
  "title": "Breaking News Correspondent",
  "shift_role": "correspondent",
  "bureau_id": "uuid",
  "team": "Breaking News"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "email": "new.user@thomsonreuters.com",
    "full_name": "New User"
  }
}
```

---

### POST /api/auth/logout

Invalidate the current session token.

**Request:**

```http
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/session

Get the current authenticated user's details.

**Request:**

```http
GET /api/auth/session
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@thomsonreuters.com",
    "full_name": "User Name",
    "role": "staff",
    "bureau_id": "uuid"
  }
}
```

---

## User Profile API

Manage the current authenticated user's profile and password.

### GET /api/users/me

Get the current authenticated user's profile.

**Request:**

```http
GET /api/users/me
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@thomsonreuters.com",
    "full_name": "User Name",
    "phone": "+39 02 1234 5678",
    "title": "Breaking News Correspondent, Italy",
    "shift_role": "correspondent",
    "bureau": "Milan",
    "bureau_id": "uuid",
    "team": "Breaking News",
    "status": "active",
    "role": "staff"
  }
}
```

**Errors:**

- `401` - No authentication token provided / Invalid or expired session

---

### PUT /api/users/me

Update the current authenticated user's profile (full_name and phone only).

**Request:**

```http
PUT /api/users/me
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "full_name": "Updated Name",
  "phone": "+39 06 9876 5432"
}
```

**Request Body:**

| Field       | Type           | Required | Description                    |
| ----------- | -------------- | -------- | ------------------------------ |
| `full_name` | string         | No       | User's full name (min 2 chars) |
| `phone`     | string \| null | No       | Phone number (null to clear)   |

**Response (200 OK):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@thomsonreuters.com",
    "full_name": "Updated Name",
    "phone": "+39 06 9876 5432",
    "title": "Breaking News Correspondent, Italy",
    "shift_role": "correspondent",
    "bureau": "Milan",
    "bureau_id": "uuid",
    "team": "Breaking News",
    "status": "active",
    "role": "staff"
  }
}
```

**Errors:**

- `400` - Full name cannot be empty / Full name must be at least 2 characters long
- `401` - No authentication token provided / Invalid or expired session

---

### PUT /api/users/me/password

Change the current authenticated user's password.

**Request:**

```http
PUT /api/users/me/password
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Request Body:**

| Field              | Type   | Required | Description                         |
| ------------------ | ------ | -------- | ----------------------------------- |
| `current_password` | string | Yes      | User's current password             |
| `new_password`     | string | Yes      | New password (minimum 8 characters) |

**Response (200 OK):**

```json
{
  "message": "Password updated successfully"
}
```

**Errors:**

- `400` - Current password is required / New password is required / New password must be at least 8 characters long
- `401` - No authentication token provided / Current password is incorrect
- `403` - Account not set up properly

---

## Employees API

Manage Breaking News team members.

### Authorization Requirements

| Endpoint                             | Required Role                                   |
| ------------------------------------ | ----------------------------------------------- |
| `GET /api/employees`                 | Any authenticated user                          |
| `POST /api/employees`                | `admin`, `manager`, or `scheduler`              |
| `GET /api/employees/:id`             | Any authenticated user                          |
| `PUT /api/employees/:id`             | `admin`, `manager`, `scheduler`, or self-update |
| `DELETE /api/employees/:id`          | `admin` or `manager` only                       |
| `GET /api/employees/:id/preferences` | Any authenticated user                          |
| `PUT /api/employees/:id/preferences` | Any authenticated user                          |

### GET /api/employees

List all employees with optional filtering.

**Request:**

```http
GET /api/employees?bureau=Milan&role=senior&status=active&search=rossi
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**

- `bureau` (string) - Filter by bureau name
- `role` (string) - Filter by shift role (editor, senior, correspondent)
- `status` (string) - Filter by status (active, on-leave, inactive)
- `search` (string) - Search by name or email

**Response (200 OK):**

```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "Sara Rossi",
      "email": "sara.rossi@thomsonreuters.com",
      "phone": null,
      "role": "Senior Breaking News Correspondent, Italy",
      "shift_role": "senior",
      "bureau": "Milan",
      "bureau_id": "uuid",
      "status": "active",
      "team": "Breaking News",
      "shiftsThisMonth": 12,
      "initials": "SR"
    }
  ]
}
```

---

### POST /api/employees

Create a new employee.

**Required Role:** `admin`, `manager`, or `scheduler`

**Request:**

```http
POST /api/employees
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "email": "new.correspondent@thomsonreuters.com",
  "full_name": "New Correspondent",
  "title": "Breaking News Correspondent, Italy",
  "shift_role": "correspondent",
  "bureau_id": "uuid",
  "phone": "+39 02 1234 5678",
  "worker_id": "8012345",
  "team": "Breaking News",
  "status": "active"
}
```

**Response (201 Created):**

```json
{
  "employee": {
    "id": "uuid",
    "name": "New Correspondent",
    "email": "new.correspondent@thomsonreuters.com",
    "role": "Breaking News Correspondent, Italy",
    "bureau": "Milan"
  }
}
```

---

### GET /api/employees/:id

Get a specific employee's details.

**Request:**

```http
GET /api/employees/uuid-here
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "employee": {
    "id": "uuid",
    "name": "Sabina Suzzi",
    "email": "sabina.suzzi@thomsonreuters.com",
    "phone": null,
    "role": "Senior Breaking News Correspondent, Italy",
    "shift_role": "senior",
    "bureau": "Milan",
    "bureau_id": "uuid",
    "status": "active",
    "team": "Breaking News",
    "worker_id": "8011406",
    "shiftsThisMonth": 15,
    "initials": "SS"
  }
}
```

---

### PUT /api/employees/:id

Update an employee's details.

**Required Role:** `admin`, `manager`, `scheduler`, or the employee themselves (self-update)

**Request:**

```http
PUT /api/employees/uuid-here
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "phone": "+39 02 9999 8888",
  "status": "on-leave"
}
```

**Response (200 OK):**

```json
{
  "employee": {
    "id": "uuid",
    "name": "Sabina Suzzi",
    "status": "on-leave"
  }
}
```

---

### DELETE /api/employees/:id

Delete an employee (soft delete recommended).

**Required Role:** `admin` or `manager` only

**Request:**

```http
DELETE /api/employees/uuid-here
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Employee deleted successfully"
}
```

**Errors:**

- `403` - "Only administrators and managers can delete employees"
- `404` - Employee not found

---

### GET /api/employees/:id/preferences

Get an employee's shift preferences.

**Request:**

```http
GET /api/employees/uuid-here/preferences
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "preferences": {
    "id": "uuid",
    "user_id": "uuid",
    "preferred_days": ["Monday", "Wednesday", "Thursday", "Friday"],
    "preferred_shifts": ["Morning", "Afternoon"],
    "max_shifts_per_week": 5,
    "notes": "Unavailable: Tuesday"
  }
}
```

---

### PUT /api/employees/:id/preferences

Update an employee's shift preferences. When staff edit their own preferences, confirmation status is reset. Team leaders can use `auto_confirm: true` to confirm immediately.

**Request:**

```http
PUT /api/employees/uuid-here/preferences
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "preferred_days": ["Monday", "Tuesday", "Wednesday"],
  "preferred_shifts": ["Afternoon", "Evening"],
  "max_shifts_per_week": 4,
  "notes": "Prefers afternoon shifts",
  "auto_confirm": true  // Optional - team leaders only
}
```

**Response (200 OK):**

```json
{
  "employee_id": "uuid",
  "employee_name": "Sofia Romano",
  "preferred_days": ["Monday", "Tuesday", "Wednesday"],
  "preferred_shifts": ["Afternoon", "Evening"],
  "max_shifts_per_week": 4,
  "notes": "Prefers afternoon shifts",
  "confirmed": true,
  "confirmed_by": "uuid",
  "confirmed_by_name": "Sabina Suzzi",
  "confirmed_at": "2025-12-08T10:30:00Z"
}
```

---

### POST /api/employees/:id/preferences/confirm

Confirm an employee's shift preferences. Requires team leader or admin role.

**Request:**

```http
POST /api/employees/uuid-here/preferences/confirm
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Preferences confirmed for Sofia Romano",
  "preferences": {
    "employee_id": "uuid",
    "employee_name": "Sofia Romano",
    "preferred_days": ["Monday", "Tuesday", "Wednesday"],
    "preferred_shifts": ["Afternoon", "Evening"],
    "max_shifts_per_week": 4,
    "notes": "Prefers afternoon shifts",
    "confirmed": true,
    "confirmed_by": "uuid",
    "confirmed_by_name": "Sabina Suzzi",
    "confirmed_at": "2025-12-08T10:30:00Z"
  }
}
```

**Errors:**

- `403 Forbidden` - Only team leaders and administrators can confirm preferences

---

### GET /api/users/:id/team-leader

Check if a user has team leader status.

**Request:**

```http
GET /api/users/uuid-here/team-leader
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "sabina.suzzi@thomsonreuters.com",
  "full_name": "Sabina Suzzi",
  "is_team_leader": true
}
```

---

### PUT /api/users/:id/team-leader

Toggle team leader status for a user. Requires admin role.

**Request:**

```http
PUT /api/users/uuid-here/team-leader
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "is_team_leader": true
}
```

**Response (200 OK):**

```json
{
  "message": "Sabina Suzzi is now a team leader",
  "user": {
    "id": "uuid",
    "email": "sabina.suzzi@thomsonreuters.com",
    "full_name": "Sabina Suzzi",
    "is_team_leader": true
  }
}
```

**Errors:**

- `403 Forbidden` - Only administrators can designate team leaders

---

## Team Availability API

Manage team-wide availability and preference confirmation. Requires team leader or admin role.

### GET /api/team/availability

Get all employees with their preference status for team leader review.

**Request:**

```http
GET /api/team/availability
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "employees": [
    {
      "id": "uuid",
      "email": "sofia.romano@thomsonreuters.com",
      "full_name": "Sofia Romano",
      "title": "Breaking News Correspondent",
      "shift_role": "correspondent",
      "is_team_leader": false,
      "bureau_id": "uuid",
      "bureau_name": "Rome",
      "preferences": {
        "preferred_days": ["Monday", "Wednesday", "Friday"],
        "preferred_shifts": ["Afternoon"],
        "max_shifts_per_week": 4,
        "notes": "Prefers not to work Tuesdays",
        "confirmed": false,
        "confirmed_by": null,
        "confirmed_by_name": null,
        "confirmed_at": null
      },
      "status": "pending"
    }
  ],
  "stats": {
    "total": 15,
    "confirmed": 12,
    "pending": 2,
    "missing": 1
  }
}
```

**Status values:**

- `confirmed` - Preferences have been reviewed and confirmed
- `pending` - Preferences set but not yet confirmed
- `missing` - No preferences have been set

**Errors:**

- `403 Forbidden` - Only team leaders and administrators can view team availability

---

### POST /api/team/availability

Bulk confirm all pending preferences.

**Request:**

```http
POST /api/team/availability
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Confirmed preferences for 3 employee(s)",
  "confirmed_count": 3
}
```

**Errors:**

- `403 Forbidden` - Only team leaders and administrators can confirm preferences

---

## Shifts API

Manage shift scheduling and assignments.

### GET /api/shifts

List shifts with optional filtering.

**Request:**

```http
GET /api/shifts?start_date=2025-11-01&end_date=2025-11-30&bureau_id=uuid&employee_id=uuid
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**

- `start_date` (string, ISO date) - Filter shifts starting from this date
- `end_date` (string, ISO date) - Filter shifts up to this date
- `bureau_id` (string, UUID) - Filter by bureau
- `employee_id` (string, UUID) - Filter by assigned employee

**Response (200 OK):**

```json
{
  "shifts": [
    {
      "id": "uuid",
      "employee": "Gianluca Semeraro",
      "employee_id": "uuid",
      "role": "Senior Breaking News Correspondent, Italy",
      "bureau": "Milan",
      "bureau_id": "uuid",
      "date": "2025-11-01",
      "startTime": "08:00",
      "endTime": "16:00",
      "status": "confirmed"
    }
  ]
}
```

---

### POST /api/shifts

Create a new shift with optional employee assignment. Includes pre-save conflict validation.

**Request:**

```http
POST /api/shifts
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "bureau_id": "uuid",
  "start_time": "2025-11-01T08:00:00Z",
  "end_time": "2025-11-01T16:00:00Z",
  "employee_id": "uuid",
  "status": "draft",
  "notes": "Morning shift",
  "force": false
}
```

**Body Parameters:**

- `force` (boolean, optional) - If `true`, creates shift even if conflicts are detected

**Response (201 Created):**

```json
{
  "shift": {
    "id": "uuid",
    "bureau_id": "uuid",
    "start_time": "2025-11-01T08:00:00Z",
    "end_time": "2025-11-01T16:00:00Z",
    "status": "draft"
  }
}
```

**Response (409 Conflict):** - When conflicts detected and `force` is not `true`

```json
{
  "error": "Conflict detected",
  "conflicts": [
    {
      "type": "Double Booking",
      "severity": "high",
      "description": "Employee is already scheduled for this time"
    }
  ],
  "message": "Set force: true to create anyway"
}
```

---

### GET /api/shifts/upcoming

Get upcoming shifts for the dashboard (next 7 days by default).

**Request:**

```http
GET /api/shifts/upcoming?days=14
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**

- `days` (number, default: 7) - Number of days to look ahead

**Response (200 OK):**

```json
{
  "shifts": [
    {
      "id": "uuid",
      "employee": "Sara Rossi",
      "date": "2025-11-01",
      "startTime": "08:00",
      "endTime": "16:00",
      "bureau": "Milan"
    }
  ]
}
```

---

### PUT /api/shifts/:id

Update an existing shift.

**Request:**

```http
PUT /api/shifts/uuid-here
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "start_time": "2025-11-01T09:00:00Z",
  "end_time": "2025-11-01T17:00:00Z",
  "status": "published"
}
```

**Response (200 OK):**

```json
{
  "shift": {
    "id": "uuid",
    "start_time": "2025-11-01T09:00:00Z",
    "status": "published"
  }
}
```

---

### PATCH /api/shifts/:id

Move a shift (drag-and-drop support). Includes pre-move conflict validation.

**Request:**

```http
PATCH /api/shifts/uuid-here
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "date": "2025-11-02",
  "start_time": "08:00",
  "end_time": "16:00",
  "validate_only": false,
  "force": false
}
```

**Body Parameters:**

- `date` (string, required) - New date for the shift (YYYY-MM-DD)
- `start_time` (string, optional) - New start time (HH:mm), defaults to existing
- `end_time` (string, optional) - New end time (HH:mm), defaults to existing
- `validate_only` (boolean, optional) - If `true`, only check for conflicts without moving
- `force` (boolean, optional) - If `true`, move even if conflicts exist (logged for audit)

**Response (200 OK):**

```json
{
  "id": "uuid",
  "employee": "Marco Rossi",
  "employee_id": "uuid",
  "bureau": "Milan",
  "date": "2025-11-02",
  "startTime": "08:00",
  "endTime": "16:00",
  "status": "confirmed",
  "forced": false,
  "conflicts_overridden": 0
}
```

**Response (409 Conflict):** - When conflicts detected and `force` is not `true`

```json
{
  "error": "Move would create conflicts",
  "conflicts": [
    {
      "type": "Double Booking",
      "severity": "high",
      "employee": "Marco Rossi",
      "description": "Marco Rossi is already scheduled for 08:00 - 16:00 on Nov 02",
      "date": "2025-11-02",
      "details": {
        "shifts": [
          { "time": "08:00 - 16:00", "bureau": "Milan", "label": "Moved shift" },
          { "time": "08:00 - 16:00", "bureau": "Rome", "label": "Existing shift" }
        ]
      }
    }
  ],
  "message": "This move would create scheduling conflicts. Set force=true to move anyway."
}
```

**Validation-Only Response (200 OK):** - When `validate_only` is `true`

```json
{
  "valid": false,
  "conflicts": [...],
  "current": { "date": "2025-11-01", "startTime": "08:00", "endTime": "16:00" },
  "proposed": { "date": "2025-11-02", "startTime": "08:00", "endTime": "16:00" }
}
```

---

### DELETE /api/shifts/:id

Delete a shift.

**Request:**

```http
DELETE /api/shifts/uuid-here
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Shift deleted successfully"
}
```

---

### DELETE /api/shifts/reset

**DEV ONLY**: Delete all shifts, assignments, and conflicts. Only available on localhost.

**Request:**

```http
DELETE /api/shifts/reset
Authorization: Bearer YOUR_TOKEN
Host: localhost:3000
```

**Response (200 OK):**

```json
{
  "message": "Schedule reset successfully",
  "deleted": {
    "shifts": true,
    "assignments": true,
    "conflicts": true
  }
}
```

**Errors:**

- `403` - "This endpoint is only available in development mode on localhost"
- `401` - Unauthorized

**Notes:**

- This endpoint is restricted to `localhost` and `127.0.0.1` only
- Will not work in production deployments
- Useful for clearing test data during development
- A "DEV: Reset" button is available in the Schedule page UI on localhost

---

## Schedule Health / Conflicts API

Manage scheduling conflicts, warnings, and AI-powered resolution.

### GET /api/conflicts

List conflicts with optional filtering.

**Request:**

```http
GET /api/conflicts?status=unresolved&severity=high&limit=50
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters:**

- `status` (string) - Filter by status (unresolved, acknowledged, resolved)
- `severity` (string) - Filter by severity (high, medium, low)
- `limit` (number, default: 100) - Maximum number of results

**Response (200 OK):**

```json
{
  "conflicts": [
    {
      "id": "uuid",
      "type": "Double Booking",
      "severity": "high",
      "status": "unresolved",
      "employee": "Alessia Pe'",
      "employee_id": "uuid",
      "description": "Employee is scheduled for overlapping shifts",
      "date": "2025-11-02",
      "shifts": [
        { "time": "08:00 - 16:00", "bureau": "Milan" },
        { "time": "14:00 - 22:00", "bureau": "Rome" }
      ],
      "detected_at": "2025-10-30T10:00:00Z"
    }
  ]
}
```

---

### PATCH /api/conflicts/:id

Acknowledge or resolve a conflict.

**Request:**

```http
PATCH /api/conflicts/uuid-here
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "action": "resolve"
}
```

**Body Parameters:**

- `action` (string, required) - Either "acknowledge" or "resolve"

**Response (200 OK):**

```json
{
  "conflict": {
    "id": "uuid",
    "status": "resolved",
    "resolved_at": "2025-10-30T15:00:00Z",
    "resolved_by": "uuid"
  }
}
```

---

### DELETE /api/conflicts/:id

Dismiss a conflict (false positive).

**Request:**

```http
DELETE /api/conflicts/uuid-here
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "message": "Conflict dismissed successfully"
}
```

---

## Dashboard API

Aggregated statistics for the dashboard.

### GET /api/dashboard/stats

Get dashboard statistics.

**Request:**

```http
GET /api/dashboard/stats
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "stats": {
    "totalEmployees": 15,
    "activeEmployees": 15,
    "totalShifts": 120,
    "upcomingShifts": 45,
    "unresolvedConflicts": 3,
    "highSeverityConflicts": 1,
    "shiftsThisWeek": 28,
    "shiftsThisMonth": 120,
    "bureaus": {
      "Milan": {
        "employees": 8,
        "shifts": 65
      },
      "Rome": {
        "employees": 7,
        "shifts": 55
      }
    }
  }
}
```

---

## AI Scheduling API

AI-powered scheduling and assistance using Claude Haiku 4.5.

> **Access Control:** Schedule generation requires **team leader** or **admin** role. Regular staff cannot generate schedules.

### POST /api/ai/generate-schedule

Generate an optimized schedule using AI. Only accessible to team leaders and admins.

**Request:**

```http
POST /api/ai/generate-schedule
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "bureau_id": "uuid",
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "shift_patterns": [
    {
      "name": "Morning Shift",
      "start_time": "08:00",
      "end_time": "16:00",
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    {
      "name": "Afternoon Shift",
      "start_time": "14:00",
      "end_time": "22:00",
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    }
  ],
  "constraints": {
    "min_senior_per_shift": 1,
    "max_shifts_per_week": 5,
    "respect_preferences": true,
    "avoid_back_to_back": true
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "schedule": {
    "generated_shifts": [
      {
        "date": "2025-11-01",
        "start_time": "08:00",
        "end_time": "16:00",
        "employee_id": "uuid",
        "employee_name": "Gianluca Semeraro",
        "role": "senior",
        "bureau": "Milan"
      }
    ],
    "summary": {
      "total_shifts": 120,
      "shifts_per_employee": {
        "Gianluca Semeraro": 20,
        "Sabina Suzzi": 18
      },
      "conflicts_detected": 0
    },
    "ai_notes": "Schedule optimized for role balance and preference compliance."
  },
  "saved": false,
  "shift_ids": [],
  "unconfirmed_preferences_count": 3
}
```

> **Note:** The `unconfirmed_preferences_count` field indicates how many employees have preferences that haven't been reviewed by a team leader. Consider reviewing team availability before generating schedules for best results.

**Errors:**

- `400` - Invalid date range or constraints
- `402` - AI service unavailable (check ANTHROPIC_API_KEY)
- `403` - Only team leaders and administrators can generate schedules
- `500` - AI generation failed

---

### POST /api/ai/resolve-conflict

Get AI suggestions for resolving a conflict and optionally auto-apply the recommended fix.

**Request:**

```http
POST /api/ai/resolve-conflict
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "conflict_id": "uuid",
  "apply": true
}
```

**Body Parameters:**

- `conflict_id` (string, required) - UUID of the conflict to resolve
- `apply` (boolean, optional) - If `true`, automatically applies the recommended resolution

**Response (200 OK):**

```json
{
  "suggestions": [
    {
      "action": "reassign",
      "description": "Move shift to Andrea Mandala' who is available",
      "employee_id": "uuid",
      "rationale": "Andrea has fewer shifts this week and prefers morning shifts",
      "impact": "low"
    },
    {
      "action": "adjust_time",
      "description": "Adjust shift end time to avoid overlap",
      "rationale": "Minimal change that removes the conflict",
      "impact": "low"
    }
  ],
  "ai_recommendation": "Reassign to Andrea Mandala' - minimal disruption",
  "applied": true,
  "resolution_details": {
    "action_taken": "reassign",
    "old_employee": "Gianluca Semeraro",
    "new_employee": "Andrea Mandala'"
  }
}
```

---

### POST /api/ai/save-schedule

Save a pre-generated AI schedule to the database. This endpoint allows saving a schedule that was already generated (via preview), without re-generating it.

**Request:**

```http
POST /api/ai/save-schedule
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "schedule": {
    "shifts": [
      {
        "date": "2025-12-05",
        "start_time": "08:00",
        "end_time": "16:00",
        "bureau": "Milan",
        "assigned_to": "Gianluca Semeraro",
        "role_level": "senior",
        "shift_type": "Morning",
        "reasoning": "Sr-cover"
      }
    ],
    "fairness_metrics": { ... },
    "recommendations": [ ... ]
  },
  "skip_conflict_check": false
}
```

**Body Parameters:**

- `schedule` (object, required) - The generated schedule object containing shifts array
- `skip_conflict_check` (boolean, optional) - If `true`, saves even if conflicts exist (default: `false`)

**Response (200 OK):**

```json
{
  "success": true,
  "saved_shifts": 172,
  "shift_ids": ["uuid1", "uuid2", "..."]
}
```

**Response (409 Conflict):**

If conflicts are detected and `skip_conflict_check` is `false`:

```json
{
  "error": "Schedule has 10 conflict(s). Use skip_conflict_check: true to save anyway.",
  "conflicts": [
    {
      "type": "Rest Period Violation",
      "severity": "high",
      "employee": "Gianluca Semeraro",
      "description": "Gianluca Semeraro has only 8h rest between shifts (minimum 11h required)",
      "shift1": { "date": "2025-12-05", "start": "16:00", "end": "00:00" },
      "shift2": { "date": "2025-12-06", "start": "08:00", "end": "16:00" }
    }
  ],
  "conflict_count": 10
}
```

**Errors:**

- `400` - Invalid schedule data
- `401` - Unauthorized
- `409` - Schedule has conflicts (can override with `skip_conflict_check: true`)
- `500` - Failed to save schedule

---

### GET /api/ai/status

Check AI service health and configuration.

**Request:**

```http
GET /api/ai/status
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**

```json
{
  "status": "operational",
  "model": "claude-sonnet-4.5",
  "api_key_configured": true,
  "last_request": "2025-10-30T14:30:00Z",
  "rate_limit": {
    "requests_remaining": 950,
    "resets_at": "2025-10-30T15:00:00Z"
  }
}
```

---

### POST /api/ai/chatbot

Get AI-powered guidance for using ShiftSmart features. Uses Claude Haiku 4.5 for fast, cost-effective responses.

**Request:**

```http
POST /api/ai/chatbot
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "question": "How do I create a new shift?",
  "history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

**Body Parameters:**

- `question` (string, required) - The user's question about ShiftSmart
- `history` (array, optional) - Previous conversation messages for context (max 6 recommended)

**Response (200 OK):**

```json
{
  "answer": "To create a new shift:\n1. Go to the **Schedule** page from the sidebar\n2. Click the **Add Shift** button in the top right\n3. Select an employee, bureau, date, and times\n4. Click **Create Shift**"
}
```

**Notes:**

- Responses may contain markdown bold (`**text**`) which should be rendered appropriately
- The AI has knowledge of all ShiftSmart features including Schedule Health, AI scheduling, drag-and-drop, and employee management
- If AI is not configured, returns a friendly fallback message

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional context"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Resource created
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable entity (validation error)
- `500` - Internal server error

### Common Error Codes

- `AUTH_REQUIRED` - Authentication token missing
- `INVALID_TOKEN` - Token expired or invalid
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `AI_UNAVAILABLE` - AI service not configured or unavailable

---

## Rate Limiting

- **Standard endpoints:** 100 requests/minute per user
- **AI endpoints:** 10 requests/minute per user
- **Bulk operations:** 20 requests/minute per user

Rate limit headers included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730304000
```

---

## Versioning

ShiftSmart API uses **semantic versioning** (MAJOR.MINOR.PATCH).

### Current Version: 1.0.0

**Breaking changes** will increment the MAJOR version. The API version is included in:

- Response headers: `X-API-Version: 1.0.0`
- Package version: `package.json`
- This documentation

### Version History

- **1.0.0** (2025-10-30) - Production release with AI scheduling
- **0.4.0** - API-only backend
- **0.3.0** - Core endpoints
- **0.2.0** - Real data and auth
- **0.1.0** - Initial planning

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues:** <https://github.com/ArlynGajilanTR/ShiftSmart/issues>
- **Documentation:** See project README.md
- **Deployment:** See DEPLOYMENT.md

---

**Last Updated:** October 30, 2025  
**API Version:** 1.0.0  
**Maintained by:** Reuters Breaking News Team
