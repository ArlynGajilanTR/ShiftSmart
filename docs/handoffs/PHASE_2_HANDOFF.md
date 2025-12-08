# Phase 2 Handoff: Settings Page Implementation

> **Branch:** `feat/settings-api`  
> **Issue:** BUG-002 - Settings Page Not Functional  
> **Severity:** 🟡 Medium  
> **Estimated Time:** 2-3 hours  
> **Prerequisite:** Phase 1 completed and merged

---

## Phase 1 Completion Status

| Item             | Status                |
| ---------------- | --------------------- |
| Signup API fixed | ✅ Complete           |
| Tests passing    | ✅ Complete           |
| PR merged        | ✅ Complete (c23cff0) |

> **Completed:** December 8, 2025 - Signup now accepts `bureau_id` and looks up by code.

---

## Context

The Settings page (`/dashboard/settings`) currently uses hardcoded mock data and placeholder handlers. Users cannot actually update their profile or change their password.

---

## Problem Statement

### Current State:

**File:** `app/dashboard/settings/page.tsx`

```typescript
// Lines 19-26: Hardcoded data (should fetch from user session)
const [formData, setFormData] = useState({
  name: 'John Smith',
  email: 'john.smith@reuters.com',
  phone: '+39 02 1234 5678',
  title: 'senior-editor',
  bureau: 'milan',
});

// Lines 33-41: Placeholder handlers (not wired to API)
const handleSave = () => {
  console.log('Saving settings:', formData); // Does nothing
};

const handlePasswordChange = () => {
  console.log('Changing password'); // Does nothing
};
```

---

## Implementation Plan

### Part A: Create Backend APIs

#### A1: User Profile Update API

**File to create:** `app/api/users/me/route.ts`

```typescript
// GET /api/users/me - Get current user profile
export async function GET(request: NextRequest) {
  // Verify auth
  // Return user data
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  // Verify auth
  // Validate input (full_name, phone)
  // Update user in database
  // Return updated user
}
```

#### A2: Password Change API

**File to create:** `app/api/users/me/password/route.ts`

```typescript
// PUT /api/users/me/password - Change password
export async function PUT(request: NextRequest) {
  // Verify auth
  // Verify current password
  // Validate new password (min 8 chars)
  // Hash new password
  // Update password in database
  // Invalidate other sessions (optional)
  // Return success
}
```

### Part B: Update API Client

**File:** `lib/api-client.ts`

Add new methods:

```typescript
users: {
  getProfile: async () => {
    return apiCall('/api/users/me');
  },

  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    return apiCall('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string
  }) => {
    return apiCall('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
},
```

### Part C: Update Settings Page

**File:** `app/dashboard/settings/page.tsx`

1. Fetch user data on mount (or from localStorage)
2. Wire `handleSave` to `api.users.updateProfile`
3. Wire `handlePasswordChange` to `api.users.changePassword`
4. Add form validation
5. Add loading/success/error states
6. Add toast notifications

---

## Implementation Steps

### Step 1: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/settings-api
```

### Step 2: Create Profile API

Create `app/api/users/me/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('*, bureaus(name, code)')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        title: userData.title,
        shift_role: userData.shift_role,
        bureau: userData.bureaus?.name,
        bureau_id: userData.bureau_id,
        team: userData.team,
        status: userData.status,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { full_name, phone } = await request.json();

    // Validate input
    if (full_name && full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const supabase = await createClient();

    const updates: any = {};
    if (full_name) updates.full_name = full_name.trim();
    if (phone !== undefined) updates.phone = phone || null;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('*, bureaus(name, code)')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        phone: updated.phone,
        title: updated.title,
        shift_role: updated.shift_role,
        bureau: updated.bureaus?.name,
        bureau_id: updated.bureau_id,
        team: updated.team,
        status: updated.status,
        role: updated.role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 3: Create Password Change API

Create `app/api/users/me/password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { createClient } from '@/lib/supabase/server';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { current_password, new_password } = await request.json();

    // Validate input
    if (!current_password || !new_password) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current password hash
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(current_password, userData.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password
    const newHash = await hashPassword(new_password);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 4: Update API Client

Add to `lib/api-client.ts`:

```typescript
// Add to the api object
users: {
  getProfile: async () => {
    return apiCall<{ user: any }>('/api/users/me');
  },

  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    return apiCall<{ user: any; message: string }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    return apiCall<{ message: string }>('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
},
```

### Step 5: Update Settings Page

See detailed implementation in the settings page update section below.

### Step 6: Write Tests

Create `tests/api/users-me.test.ts`:

```typescript
describe('GET /api/users/me', () => {
  it('should return current user profile', async () => {});
  it('should reject unauthenticated requests', async () => {});
});

describe('PUT /api/users/me', () => {
  it('should update user profile', async () => {});
  it('should validate full_name length', async () => {});
  it('should reject unauthenticated requests', async () => {});
});

describe('PUT /api/users/me/password', () => {
  it('should change password with valid current password', async () => {});
  it('should reject invalid current password', async () => {});
  it('should validate new password length', async () => {});
  it('should reject unauthenticated requests', async () => {});
});
```

---

## Testing Protocol

### Automated Tests (Required)

| Test Type   | File                                 | Command                |
| ----------- | ------------------------------------ | ---------------------- |
| Unit        | `tests/api/users-me.test.ts`         | `npm test -- users-me` |
| Unit        | `tests/api/password.test.ts`         | `npm test -- password` |
| Integration | `tests/integration/settings.test.ts` | `npm run test:api`     |
| E2E         | `tests/e2e/settings.spec.ts`         | `npm run test:e2e`     |

### Test Cases for E2E

```typescript
describe('Settings Page', () => {
  beforeEach(() => {
    // Login as test user
  });

  it('should load current user data on mount', async () => {});
  it('should update profile successfully', async () => {});
  it('should show validation error for short name', async () => {});
  it('should change password successfully', async () => {});
  it('should show error for incorrect current password', async () => {});
  it('should show error for short new password', async () => {});
});
```

---

## Acceptance Criteria

- [ ] GET `/api/users/me` returns current user profile
- [ ] PUT `/api/users/me` updates user profile
- [ ] PUT `/api/users/me/password` changes password
- [ ] Settings page loads current user data
- [ ] Profile save button updates user in database
- [ ] Password change works with validation
- [ ] Toast notifications for success/error
- [ ] All automated tests pass

---

## Documentation Updates

After completing this phase, update:

1. **`API_REFERENCE.md`** - Add new user endpoints
2. **`CHANGELOG.md`** - Add entry for new feature
3. **`README.md`** - Update features list if needed

---

## Files Reference

| File                                 | Action | Purpose             |
| ------------------------------------ | ------ | ------------------- |
| `app/api/users/me/route.ts`          | CREATE | Profile GET/PUT API |
| `app/api/users/me/password/route.ts` | CREATE | Password change API |
| `lib/api-client.ts`                  | MODIFY | Add user methods    |
| `app/dashboard/settings/page.tsx`    | MODIFY | Wire to APIs        |
| `tests/api/users-me.test.ts`         | CREATE | API tests           |
| `tests/e2e/settings.spec.ts`         | CREATE | E2E tests           |

---

## Completion Checklist

Before marking Phase 2 complete:

- [ ] Branch `feat/settings-api` created
- [ ] Profile API endpoints created
- [ ] Password change API created
- [ ] API client updated
- [ ] Settings page wired to APIs
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] No regressions in existing tests
- [ ] PR created and reviewed
- [ ] PR merged to main
- [ ] Phase 3 handoff updated
