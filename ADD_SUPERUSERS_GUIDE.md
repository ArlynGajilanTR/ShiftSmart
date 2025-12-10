# Add Superusers Guide

**Date:** December 10, 2025  
**Status:** Ready to execute

---

## Current Test Credentials

> **Note:** As of December 10, 2025, the ShiftSmart-v2 database uses these credentials:
>
> | Account                                  | Password   |
> | ---------------------------------------- | ---------- |
> | arlyn.gajilan@thomsonreuters.com (Admin) | `testtest` |
> | All other team members                   | `changeme` |

---

## New Superusers to Add

### 1. Rob Lang

- **Email:** `rob.lang@thomsonreuters.com`
- **Password:** `changeme` (default for non-primary admin)
- **Role:** admin (full access)
- **Shift Role:** editor (highest scheduling level)

### 2. Rafal Wojciech Nowak

- **Email:** `RafalWojciech.Nowak@thomsonreuters.com`
- **Password:** `changeme` (default for non-primary admin)
- **Role:** admin (full access)
- **Shift Role:** editor (highest scheduling level)

### 3. Guest Admin (Test Account)

- **Email:** `test.test@thomsonreuters.com`
- **Password:** `changeme` (default for non-primary admin)
- **Role:** admin (full access)
- **Shift Role:** editor (highest scheduling level)
- **Script:** `supabase/add-guest-admin.sql`

---

## How to Add These Users

### Method 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your ShiftSmart project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the SQL Script**
   - Copy the contents of `supabase/add-superusers.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd+Enter

4. **Verify Success**
   - You should see success messages:
     ```
     ✓ Rob Lang created successfully!
     ✓ Rafal Wojciech Nowak created successfully!
     ```
   - A table showing all 3 superusers will appear

### Method 2: Via psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the script
\i supabase/add-superusers.sql

# Exit
\q
```

### Method 3: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref [YOUR-PROJECT-REF]

# Run the migration
supabase db execute --file supabase/add-superusers.sql
```

---

## Verify Users Were Added

### Check via Supabase Dashboard

1. Go to **Table Editor** → **users**
2. Filter by email:
   - `rob.lang@thomsonreuters.com`
   - `RafalWojciech.Nowak@thomsonreuters.com`
   - `test.test@thomsonreuters.com`
3. Verify all have:
   - ✅ `role` = `admin`
   - ✅ `shift_role` = `editor`
   - ✅ `status` = `active`

### Check via SQL Query

```sql
SELECT
    email,
    full_name,
    role,
    shift_role,
    status,
    team
FROM users
WHERE email IN (
    'rob.lang@thomsonreuters.com',
    'RafalWojciech.Nowak@thomsonreuters.com',
    'test.test@thomsonreuters.com'
)
ORDER BY email;
```

### Test Login

1. Go to your app: http://localhost:3000 (or your Vercel URL)
2. Try logging in as Rob:
   - Email: `rob.lang@thomsonreuters.com`
   - Password: `changeme`
3. Try logging in as Rafal:
   - Email: `RafalWojciech.Nowak@thomsonreuters.com`
   - Password: `changeme`
4. Try logging in as Guest Admin:
   - Email: `test.test@thomsonreuters.com`
   - Password: `changeme`
5. All should have full access to:
   - Dashboard
   - Employee Management
   - Schedule Management
   - AI Features
   - Settings

---

## Permissions Granted

Both users have **identical permissions** to Arlyn Gajilan:

| Permission            | Granted |
| --------------------- | ------- |
| View Dashboard        | ✅      |
| Manage Employees      | ✅      |
| Create/Edit Shifts    | ✅      |
| Delete Shifts         | ✅      |
| Resolve Conflicts     | ✅      |
| Generate AI Schedules | ✅      |
| View All Bureaus      | ✅      |
| Manage Users          | ✅      |
| System Settings       | ✅      |

---

## Password Hash Details

### For `changeme` (default for non-primary admin users):

```
Hash: $2a$10$uXoJ.lZEy7GquXNml8sW0O9xUNlPCBF0eqrEA0/FLJepOYzWCEhB.
Algorithm: bcrypt
Rounds: 10
Plain text: changeme
```

### For `testtest` (primary admin only - arlyn.gajilan@thomsonreuters.com):

```
Hash: $2a$06$nsQgLQ3BgiP2QJ3RZ4aMoOegLfiOd2cDoyBo9Dkz2uFUOXsvSChOS
Algorithm: bcrypt
Rounds: 6
Plain text: testtest
```

> **Note:** The `supabase/add-superusers.sql` script uses the old `testtest` hash. If adding new superusers, update the script to use the `changeme` hash above for consistency.

---

## Security Notes

⚠️ **Important:**

1. These users have **full admin access** - they can:
   - View and modify all data
   - Create/delete employees
   - Manage all schedules
   - Access all bureaus
   - Generate AI schedules

2. The password `testtest` is for **development/testing only**
   - In production, users should change their passwords immediately
   - Consider implementing password reset functionality

3. Email case sensitivity:
   - Rob's email: lowercase
   - Rafal's email: CamelCase (as requested)
   - Both will work for login (case-insensitive comparison)

---

## Troubleshooting

### Issue: "Email already exists"

If you get a conflict error, the users already exist. The script will **UPDATE** them instead:

- Password will be reset to `testtest`
- Role will be set to `admin`
- Status will be set to `active`

### Issue: "No bureaus found"

If you see this error, you need to seed the bureaus first:

```sql
-- Run this first
\i supabase/seed-breaking-news-team.sql
```

Then run the add-superusers script.

### Issue: "Cannot connect to database"

Make sure:

- Your Supabase project is running
- You have the correct connection string
- Your IP is allowed in Supabase settings
- Network/firewall allows PostgreSQL connections

---

## Files Included

- `supabase/add-superusers.sql` - SQL script to add Rob Lang and Rafal Nowak
- `supabase/add-guest-admin.sql` - SQL script to add Guest Admin (test.test@thomsonreuters.com)
- `ADD_SUPERUSERS_GUIDE.md` - This guide

---

## Next Steps

After adding the users:

1. ✅ Run the SQL script in Supabase Dashboard
2. ✅ Verify both users appear in the users table
3. ✅ Test login for Rob Lang
4. ✅ Test login for Rafal Nowak
5. ✅ Verify admin permissions work
6. ✅ Notify Rob and Rafal of their accounts
7. 📧 Send them login credentials via secure channel

---

**Last Updated:** December 10, 2025  
**Script Location:** `supabase/add-superusers.sql`
