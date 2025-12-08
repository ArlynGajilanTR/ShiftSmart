# ShiftSmart Remediation Quick Start Guide

This guide provides the fastest path to implementing all fixes identified in the codebase audit.

---

## Pre-Flight Checklist

Before starting any phase:

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Install dependencies
npm install

# 3. Start the dev server (in separate terminal)
npm run dev

# 4. Run existing tests to establish baseline
npm test
```

---

## Phase 1: Signup Fix (30-60 minutes)

### Quick Commands

```bash
# Create branch
git checkout -b fix/signup-bureau

# Run signup tests (they should fail initially)
npm test -- signup
```

### The Fix (One File Change)

Edit `app/api/auth/signup/route.ts`:

```typescript
// Line 7: Change from
const { email, password, full_name, phone, bureau, title, shift_role } = await request.json();
// To
const { email, password, full_name, phone, bureau_id, title, shift_role } = await request.json();

// Line 10: Change from
if (!email || !password || !full_name || !bureau || !title || !shift_role) {
// To
if (!email || !password || !full_name || !bureau_id || !title || !shift_role) {

// Lines 36-39: Change from
.eq('name', bureau)
// To
.eq('code', bureau_id)
```

### Verify

```bash
# Run tests
npm test -- signup

# All tests should pass
# Commit and push
git add .
git commit -m "fix(auth): correct signup bureau_id parameter mismatch"
git push origin fix/signup-bureau
```

### Create PR → Merge → Continue to Phase 2

---

## Phase 2: Settings Page (1-2 hours)

### Quick Commands

```bash
# Update main and create branch
git checkout main
git pull origin main
git checkout -b feat/settings-api
```

### Files to Create

1. **`app/api/users/me/route.ts`** - Profile GET/PUT
2. **`app/api/users/me/password/route.ts`** - Password change

(See full implementations in `docs/handoffs/PHASE_2_HANDOFF.md`)

### Add to API Client

In `lib/api-client.ts`, add the `users` object to the api export.

### Update Settings Page

Wire `app/dashboard/settings/page.tsx` to use the new APIs.

### Verify

```bash
npm test -- users-me
npm test -- settings
```

### Create PR → Merge → Continue to Phase 3

---

## Phase 3: Security & Docs (30-60 minutes)

### Quick Commands

```bash
git checkout main
git pull origin main
git checkout -b fix/security-docs
```

### The Chatbot Fix (One File Change)

Edit `app/api/ai/chatbot/route.ts`:

```typescript
// Add import at top
import { verifyAuth } from '@/lib/auth/verify';

// Add auth check at start of POST function
export async function POST(request: NextRequest) {
  try {
    // ADD THIS:
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // ... rest of existing code
```

### Documentation Updates

1. **README.md**: Change "Next.js 16" → "Next.js 15", "React 19" → "React 18"
2. **API_REFERENCE.md**: Add new `/api/users/me` endpoints
3. **CHANGELOG.md**: Copy from `docs/CHANGELOG_TEMPLATE.md` and fill in

### Verify

```bash
npm test -- chatbot
npm test -- auth-required
npm test  # Full suite
```

### Create PR → Merge → Done! 🎉

---

## Test Commands Cheat Sheet

```bash
# Phase 1
npm test -- signup                    # Signup tests only

# Phase 2
npm test -- users-me                  # Profile/password tests
npm test -- settings                  # Settings E2E tests

# Phase 3
npm test -- chatbot                   # Chatbot auth tests
npm test -- auth-required             # Security audit tests

# Full suite
npm test                              # All tests
npm test -- --coverage                # With coverage report
```

---

## Troubleshooting

### Tests failing with connection errors

```bash
# Make sure dev server is running
npm run dev
```

### Database errors

```bash
# Reset Supabase local
npx supabase db reset
```

### Type errors after changes

```bash
# Regenerate types
npm run generate-types
```

---

## Estimated Total Time

| Phase     | Time          | Complexity |
| --------- | ------------- | ---------- |
| Phase 1   | 30-60 min     | Low        |
| Phase 2   | 1-2 hours     | Medium     |
| Phase 3   | 30-60 min     | Low        |
| **Total** | **2-4 hours** | -          |

---

## Support Documents

- Full roadmap: `docs/REMEDIATION_ROADMAP.md`
- Phase 1 details: `docs/handoffs/PHASE_1_HANDOFF.md`
- Phase 2 details: `docs/handoffs/PHASE_2_HANDOFF.md`
- Phase 3 details: `docs/handoffs/PHASE_3_HANDOFF.md`
- Test files: `tests/api/signup.test.ts`, `tests/api/users-me.test.ts`, `tests/api/chatbot.test.ts`
