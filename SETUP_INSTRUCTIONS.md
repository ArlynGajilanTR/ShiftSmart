# ShiftSmart Setup Instructions

## Initial Setup for Breaking News Team (MVP)

> ✅ **Good news!** The ShiftSmart-v2 database is **already configured** with all team data.

### Supabase Project Details

| Property         | Value                |
| ---------------- | -------------------- |
| **Project Name** | ShiftSmart-v2        |
| **Project ID**   | wmozxwlmdyxdnzcxetgl |
| **Region**       | us-west-2            |
| **Database**     | PostgreSQL 17.6      |
| **Status**       | ACTIVE_HEALTHY       |

### Step 1: Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wmozxwlmdyxdnzcxetgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb3p4d2xtZHl4ZG56Y3hldGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTQ3ODEsImV4cCI6MjA4MDI3MDc4MX0.tTTm0G5Qwwo3dDNZBaZPnEfrLKQHbEy_0ykWVPtmwQ0
```

### What's Already Set Up

The database has been configured with:

- **Milan Bureau** (ITA-MILAN) - Europe/Rome timezone
  - 8 Breaking News team members (3 Senior + 5 Correspondents)
- **Rome Bureau** (ITA-ROME) - Europe/Rome timezone
  - 8 Breaking News team members (1 Editor + 1 Admin + 3 Senior + 3 Correspondents)
- **Test Credentials:**
  | Account | Password |
  |---------|----------|
  | arlyn.gajilan@thomsonreuters.com (Admin) | `testtest` |
  | All other team members | `changeme` |
- **Shift Preferences:** All 16 team members have preferences configured

### Step 2: Login to the App

**Admin Account (Recommended):**

1. Go to <http://localhost:3000/login>
2. Login with:
   - **Email:** arlyn.gajilan@thomsonreuters.com
   - **Password:** testtest
3. You'll have full admin access to both bureaus

**Other Team Members:**

You can also login as any Breaking News team member (password: `changeme`):

| Name              | Email                                | Bureau | Role             |
| ----------------- | ------------------------------------ | ------ | ---------------- |
| Gavin Jones       | gavin.jones@thomsonreuters.com       | Rome   | Editor (Manager) |
| Gianluca Semeraro | gianluca.semeraro@thomsonreuters.com | Milan  | Senior           |
| Giulia Segreti    | giulia.segreti@thomsonreuters.com    | Rome   | Senior           |

> All team members use password `changeme` (except admin who uses `testtest`).

### Step 4: Access Dashboard

1. After login, you'll be automatically redirected to the dashboard
2. Start exploring employees, schedules, and conflicts

## Importing Staff via CSV

### CSV Format

Your CSV should have these columns:

```
date,start_time,end_time,staff_name,staff_email,role,bureau
```

Example:

```csv
date,start_time,end_time,staff_name,staff_email,role,bureau
2025-11-01,09:00,17:00,John Doe,john@reuters.com,senior,Milan
2025-11-01,09:00,17:00,Jane Smith,jane@reuters.com,junior,Rome
```

### Import Process

1. **Prepare your CSV** with Breaking News team members
   - Include staff from both Milan and Rome
   - Specify roles: senior, junior, lead, or support

2. **Go to** <http://localhost:3000/import>

3. **Get Bureau IDs**:
   - In Supabase → Table Editor → `bureaus`
   - Copy the UUID for Milan
   - Copy the UUID for Rome

4. **Import Milan staff**:
   - Select CSV with Milan staff
   - Enter Milan bureau ID
   - Click Import

5. **Import Rome staff**:
   - Select CSV with Rome staff
   - Enter Rome bureau ID
   - Click Import

## Database Structure

### Bureaus

- **Milan** - Breaking News team members in Milan
- **Rome** - Breaking News team members in Rome

### Users

Each user has:

- **bureau_id** - Links to either Milan or Rome
- **shift_role** - senior, junior, lead, or support
- **preferences.team** - "Breaking News" (stored in JSON)

### Teams

For MVP, all users are on the **Breaking News** team. Team info is stored in the `preferences` JSON field.

## Troubleshooting

### "No bureaus available" error

- Database should already have bureaus configured
- Check Supabase Table Editor → `bureaus` table
- Verify you're using the correct Supabase URL

### Can't login

- Verify you're using the correct password (`testtest` for admin)
- Check user exists in `users` table
- Verify user has a `bureau_id` assigned

### Bureau selection page shows after login

- User needs a `bureau_id` in their profile
- All pre-seeded users already have bureau assignments

## Team Data Summary

| Bureau | Code      | Members | Seniors | Correspondents | Editor    |
| ------ | --------- | ------- | ------- | -------------- | --------- |
| Milan  | ITA-MILAN | 8       | 3       | 5              | 0         |
| Rome   | ITA-ROME  | 8       | 3       | 3              | 1 + Admin |

_Last Updated: December 10, 2025_
