# Phase 3 Handoff: Security & Documentation

> **Branch:** `fix/security-docs`  
> **Issues:** BUG-003, DOC-001  
> **Severity:** 🟡 Medium  
> **Estimated Time:** 1-2 hours  
> **Prerequisites:** Phase 1 and Phase 2 completed and merged

---

## Previous Phases Completion Status

### Phase 1: Signup Fix

| Item             | Status     |
| ---------------- | ---------- |
| Signup API fixed | ⬜ Pending |
| Tests passing    | ⬜ Pending |
| PR merged        | ⬜ Pending |

### Phase 2: Settings Page

| Item                 | Status     |
| -------------------- | ---------- |
| Profile API created  | ⬜ Pending |
| Password API created | ⬜ Pending |
| Settings page wired  | ⬜ Pending |
| Tests passing        | ⬜ Pending |
| PR merged            | ⬜ Pending |

> **Note:** Update these sections after each phase is complete.

---

## Context

This phase addresses remaining security and documentation issues discovered during the codebase audit.

---

## Issues to Address

### BUG-003: Chatbot API Missing Authentication

**File:** `app/api/ai/chatbot/route.ts`

**Problem:** Unlike other AI endpoints, the chatbot doesn't verify authentication:

```typescript
// Current: No auth check
export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured (but not user auth!)
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }
    // ... continues without verifyAuth
```

**Comparison - Other AI endpoints DO check auth:**

```typescript
// app/api/ai/generate-schedule/route.ts - Line 11-14
const { user, error: authError } = await verifyAuth(request);
if (authError || !user) {
  return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
}
```

### DOC-001: README Version Mismatch

**File:** `README.md`

**Problem:** Documentation claims incorrect framework versions:

- README says: "Next.js 16", "React 19"
- Actual (`package.json`): `"next": "15.0.2"`, `"react": "^18.3.1"`

---

## Implementation Plan

### Part A: Add Chatbot Authentication

#### A1: Update Chatbot Route

**File:** `app/api/ai/chatbot/route.ts`

Add authentication verification:

```typescript
import { verifyAuth } from '@/lib/auth/verify';

export async function POST(request: NextRequest) {
  try {
    // ADD: Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if AI is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    // ... rest of implementation
  }
}
```

#### A2: Update Chatbot Component

**File:** `components/chatbot-guide.tsx`

Ensure auth token is sent with requests (should already be via api client, but verify).

### Part B: Fix Documentation

#### B1: Update README.md

Fix version numbers in the tech stack section:

```markdown
## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 18, TypeScript
- ...
```

#### B2: Update API_REFERENCE.md

- Add new `/api/users/me` endpoints from Phase 2
- Update any outdated endpoint documentation
- Verify all examples are accurate

#### B3: Update CHANGELOG.md

Add entries for all three phases.

### Part C: Security Audit

Run through a checklist of security best practices:

1. ✅ All API routes require authentication (except login/signup)
2. ✅ Passwords are hashed with bcrypt
3. ✅ Session tokens expire
4. ✅ Input validation on all endpoints
5. ✅ SQL injection prevention (Supabase parameterized queries)
6. ✅ XSS prevention (React escaping)
7. ⬜ CORS configured appropriately
8. ⬜ Rate limiting on sensitive endpoints

---

## Implementation Steps

### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b fix/security-docs
```

### Step 2: Fix Chatbot Authentication

Edit `app/api/ai/chatbot/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyAuth } from '@/lib/auth/verify'; // ADD THIS

// ... SHIFTSMART_KNOWLEDGE constant ...

export async function POST(request: NextRequest) {
  try {
    // ADD: Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if AI is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI chatbot not available',
          message: 'The AI assistant is not configured. Please contact your administrator.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    // ... rest of implementation unchanged ...
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 3: Write Chatbot Auth Test

Create/update `tests/api/chatbot.test.ts`:

```typescript
describe('POST /api/ai/chatbot', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    expect(response.status).toBe(401);
  });

  it('should accept authenticated requests', async () => {
    const response = await fetch('/api/ai/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    // May be 503 if no API key, but not 401
    expect(response.status).not.toBe(401);
  });
});
```

### Step 4: Update README.md

Fix the tech stack section:

```markdown
## Tech Stack

- **Framework:** Next.js 15.0.2 (App Router)
- **Frontend:** React 18.3.1, TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude Haiku 4.5 (Anthropic SDK)
- **Styling:** Tailwind CSS, Shadcn/ui
- **Authentication:** Custom session-based auth with bcrypt
- **Drag & Drop:** @dnd-kit
```

### Step 5: Update API_REFERENCE.md

Add the new endpoints from Phase 2:

````markdown
## User Profile

### Get Current User Profile

`GET /api/users/me`

Returns the authenticated user's profile.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Smith",
    "phone": "+39 02 1234 5678",
    "title": "Senior Breaking News Correspondent",
    "shift_role": "senior",
    "bureau": "Milan",
    "team": "Breaking News",
    "status": "active"
  }
}
```
````

### Update Current User Profile

`PUT /api/users/me`

Updates the authenticated user's profile.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Body:**

```json
{
  "full_name": "John Smith",
  "phone": "+39 02 1234 5678"
}
```

### Change Password

`PUT /api/users/me/password`

Changes the authenticated user's password.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Body:**

```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

````

### Step 6: Update CHANGELOG.md
Add entries for all phases:

```markdown
# Changelog

## [Unreleased]

### Fixed
- **BUG-001:** Fixed signup API parameter mismatch (bureau_id vs bureau)
- **BUG-003:** Added authentication to chatbot API endpoint

### Added
- User profile update API (`PUT /api/users/me`)
- Password change API (`PUT /api/users/me/password`)
- Settings page now functional with real API integration

### Changed
- Updated README with correct framework versions (Next.js 15, React 18)
- Updated API_REFERENCE.md with new endpoints
````

### Step 7: Run Full Test Suite

```bash
# Run all tests
npm test

# Run specific security-related tests
npm test -- --testPathPattern="auth|chatbot"

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## Testing Protocol

### Automated Tests (Required)

| Test Type  | File                                   | Command                     |
| ---------- | -------------------------------------- | --------------------------- |
| Unit       | `tests/api/chatbot.test.ts`            | `npm test -- chatbot`       |
| Security   | `tests/security/auth-required.test.ts` | `npm test -- auth-required` |
| Full Suite | All tests                              | `npm test`                  |

### Security Verification Checklist

```typescript
// tests/security/auth-required.test.ts
describe('All protected endpoints require authentication', () => {
  const protectedEndpoints = [
    { method: 'GET', path: '/api/employees' },
    { method: 'GET', path: '/api/shifts' },
    { method: 'GET', path: '/api/conflicts' },
    { method: 'POST', path: '/api/ai/generate-schedule' },
    { method: 'POST', path: '/api/ai/chatbot' }, // NEW
    { method: 'GET', path: '/api/users/me' }, // NEW
    { method: 'PUT', path: '/api/users/me' }, // NEW
    // ... all other protected endpoints
  ];

  protectedEndpoints.forEach(({ method, path }) => {
    it(`${method} ${path} should reject unauthenticated requests`, async () => {
      const response = await fetch(path, { method });
      expect(response.status).toBe(401);
    });
  });
});
```

---

## Acceptance Criteria

- [ ] Chatbot API requires authentication
- [ ] Unauthenticated chatbot requests return 401
- [ ] README shows correct versions (Next.js 15, React 18)
- [ ] API_REFERENCE.md includes all new endpoints
- [ ] CHANGELOG.md documents all changes from all phases
- [ ] All automated tests pass
- [ ] No security advisories from Supabase
- [ ] Lint passes with no errors

---

## Documentation Updates

This phase IS the documentation update phase. Ensure:

1. **README.md** - Versions corrected
2. **API_REFERENCE.md** - All endpoints documented
3. **CHANGELOG.md** - All changes logged
4. **REMEDIATION_ROADMAP.md** - Mark as complete

---

## Files Reference

| File                                   | Action        | Purpose           |
| -------------------------------------- | ------------- | ----------------- |
| `app/api/ai/chatbot/route.ts`          | MODIFY        | Add auth check    |
| `README.md`                            | MODIFY        | Fix versions      |
| `API_REFERENCE.md`                     | MODIFY        | Add new endpoints |
| `CHANGELOG.md`                         | MODIFY        | Document changes  |
| `tests/api/chatbot.test.ts`            | CREATE/UPDATE | Auth tests        |
| `tests/security/auth-required.test.ts` | CREATE        | Security audit    |

---

## Final Completion Checklist

Before marking Phase 3 (and entire remediation) complete:

### Phase 3 Tasks

- [ ] Branch `fix/security-docs` created
- [ ] Chatbot auth added
- [ ] README versions fixed
- [ ] API_REFERENCE.md updated
- [ ] CHANGELOG.md updated
- [ ] All tests passing
- [ ] PR created and reviewed
- [ ] PR merged to main

### Overall Remediation

- [ ] All 3 phases completed
- [ ] No regressions introduced
- [ ] All documentation accurate
- [ ] Full test suite passes
- [ ] Ready for production

---

## Post-Completion

After all phases are merged:

1. **Update version** in `package.json` if warranted
2. **Tag release** if following semantic versioning
3. **Archive handoff documents** or move to completed folder
4. **Update REMEDIATION_ROADMAP.md** with completion status
5. **Notify team** of completed fixes

```bash
# Optional: Tag the release
git tag -a v1.0.1 -m "Remediation complete: signup fix, settings page, security updates"
git push origin v1.0.1
```
