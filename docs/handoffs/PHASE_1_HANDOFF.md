# Phase 1 Handoff: Critical Authentication Fix

> **Branch:** `fix/signup-bureau`  
> **Issue:** BUG-001 - Signup API Parameter Mismatch  
> **Severity:** 🔴 Critical  
> **Estimated Time:** 1-2 hours

---

## Context

During the codebase audit on December 8, 2025, a critical bug was discovered in the user signup flow. The frontend and backend have mismatched field names, causing new user registration to fail.

---

## Problem Statement

### Frontend Sends (WRONG):

**File:** `app/signup/page.tsx` (lines 129-139)

```tsx
<SelectItem value="ITA-MILAN">Milan</SelectItem>
<SelectItem value="ITA-ROME">Rome</SelectItem>
```

The frontend sends `bureau_id: "ITA-MILAN"` (the bureau CODE).

### API Client Expects:

**File:** `lib/api-client.ts` (lines 76-89)

```typescript
signup: async (userData: {
  email: string;
  password: string;
  full_name: string;
  bureau_id: string;  // <-- expects bureau_id
  // ...
})
```

### Backend Receives (MISMATCHED):

**File:** `app/api/auth/signup/route.ts` (lines 7, 36-39)

```typescript
const { email, password, full_name, phone, bureau, title, shift_role } = await request.json();
// ...
const { data: bureauData } = await supabase.from('bureaus').select('id, name').eq('name', bureau); // <-- looks up by NAME, not code
```

### Database Schema:

**File:** `supabase/seed-breaking-news-team.sql`

```sql
-- Bureaus have:
-- name: 'Milan' or 'Rome'
-- code: 'ITA-MILAN' or 'ITA-ROME'
```

---

## Recommended Fix

**Option A (Recommended):** Update backend to accept `bureau_id` (the code) and lookup by code.

This is preferred because:

1. Using codes is more robust than names
2. Minimal frontend changes required
3. Codes are guaranteed unique (UNIQUE constraint)

### Files to Modify:

1. **`app/api/auth/signup/route.ts`**
   - Change parameter from `bureau` to `bureau_id`
   - Change lookup from `.eq('name', bureau)` to `.eq('code', bureau_id)`

2. **`lib/api-client.ts`** (optional)
   - Update JSDoc comment if needed

---

## Implementation Steps

### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b fix/signup-bureau
```

### Step 2: Fix Backend API

Edit `app/api/auth/signup/route.ts`:

```typescript
// Line 7: Change parameter name
const { email, password, full_name, phone, bureau_id, title, shift_role } = await request.json();

// Line 10: Update validation
if (!email || !password || !full_name || !bureau_id || !title || !shift_role) {

// Lines 36-39: Change lookup to use code
const { data: bureauData, error: bureauError } = await supabase
  .from('bureaus')
  .select('id, name')
  .eq('code', bureau_id)  // Changed from .eq('name', bureau)
  .single();
```

### Step 3: Write Tests

Create `tests/api/signup.test.ts` with the following test cases:

```typescript
describe('POST /api/auth/signup', () => {
  it('should create a new user with valid bureau_id (code)', async () => {
    // Test with bureau_id: 'ITA-MILAN'
  });

  it('should reject signup with invalid bureau_id', async () => {
    // Test with bureau_id: 'INVALID-CODE'
  });

  it('should reject signup with missing required fields', async () => {
    // Test missing email, password, etc.
  });

  it('should reject duplicate email', async () => {
    // Test duplicate email registration
  });

  it('should hash password before storing', async () => {
    // Verify password is not stored in plaintext
  });
});
```

### Step 4: Run Tests

```bash
# Run signup-specific tests
npm test -- --testPathPattern="signup"

# Run all auth tests
npm test -- --testPathPattern="auth"

# Run full test suite
npm test
```

### Step 5: E2E Smoke Test

Create or update `tests/e2e/signup.spec.ts`:

```typescript
describe('Signup Flow', () => {
  it('should allow new user registration', async () => {
    // Navigate to /signup
    // Fill form with test data
    // Select bureau (Milan or Rome)
    // Submit form
    // Verify redirect to /login
    // Verify can login with new credentials
  });
});
```

---

## Testing Protocol

### Automated Tests (Required)

| Test Type   | File                             | Command              |
| ----------- | -------------------------------- | -------------------- |
| Unit        | `tests/api/signup.test.ts`       | `npm test -- signup` |
| Integration | `tests/integration/auth.test.ts` | `npm run test:api`   |
| E2E         | `tests/e2e/signup.spec.ts`       | `npm run test:e2e`   |

### Manual Verification (Optional but Recommended)

1. Start dev server: `npm run dev`
2. Navigate to `/signup`
3. Fill out form with test data
4. Select "Milan" bureau
5. Submit
6. Verify redirect to `/login`
7. Login with new credentials
8. Verify dashboard loads

---

## Acceptance Criteria

- [ ] `npm test -- signup` passes (all new tests)
- [ ] `npm run test:api` passes (no regressions)
- [ ] New user can register via UI
- [ ] User data is stored correctly in database
- [ ] Password is hashed (not plaintext)
- [ ] Bureau is correctly associated with user

---

## Documentation Updates

After completing this phase, update:

1. **`API_REFERENCE.md`** - Update signup endpoint documentation
2. **`CHANGELOG.md`** - Add entry for bugfix

---

## Rollback Plan

If issues are discovered after merge:

```bash
git revert <commit-hash>
git push origin main
```

---

## Handoff to Phase 2

After this phase is complete:

1. Create PR to `main`
2. Ensure all CI checks pass
3. Merge PR
4. Update `docs/handoffs/PHASE_2_HANDOFF.md` with completion status
5. Start Phase 2 from fresh `main`

---

## Files Reference

| File                           | Action        | Lines        |
| ------------------------------ | ------------- | ------------ |
| `app/api/auth/signup/route.ts` | MODIFY        | 7, 10, 36-39 |
| `app/signup/page.tsx`          | NO CHANGE     | -            |
| `lib/api-client.ts`            | NO CHANGE     | -            |
| `tests/api/signup.test.ts`     | CREATE        | -            |
| `tests/e2e/signup.spec.ts`     | CREATE/UPDATE | -            |

---

## Completion Checklist

Before marking Phase 1 complete:

- [ ] Branch `fix/signup-bureau` created
- [ ] Backend API fixed
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] No regressions in existing tests
- [ ] PR created and reviewed
- [ ] PR merged to main
- [ ] Phase 2 handoff updated
