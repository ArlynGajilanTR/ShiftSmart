# ShiftSmart API Reference

**Version:** 1.0.0  
**Base URL:** `https://your-api-domain.vercel.app`  
**Last Updated:** October 30, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Employees API](#employees-api)
3. [Shifts API](#shifts-api)
4. [Conflicts API](#conflicts-api)
5. [Dashboard API](#dashboard-api)
6. [AI Scheduling API](#ai-scheduling-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Versioning](#versioning)

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

## Employees API

Manage Breaking News team members.

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

Update an employee's shift preferences.

**Request:**

```http
PUT /api/employees/uuid-here/preferences
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "preferred_days": ["Monday", "Tuesday", "Wednesday"],
  "preferred_shifts": ["Afternoon", "Evening"],
  "max_shifts_per_week": 4,
  "notes": "Prefers afternoon shifts"
}
```

**Response (200 OK):**

```json
{
  "preferences": {
    "id": "uuid",
    "preferred_days": ["Monday", "Tuesday", "Wednesday"],
    "max_shifts_per_week": 4
  }
}
```

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

AI-powered scheduling using Claude Sonnet 4.5.

### POST /api/ai/generate-schedule

Generate an optimized schedule using AI.

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
  }
}
```

**Errors:**

- `400` - Invalid date range or constraints
- `402` - AI service unavailable (check ANTHROPIC_API_KEY)
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
