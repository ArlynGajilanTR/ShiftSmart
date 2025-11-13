# ShiftSmart Setup Instructions

## Initial Setup for Breaking News Team (MVP)

### Step 1: Set up Supabase Database

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Run the database schema** (if not done already):
   - Copy contents from `supabase/schema.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Seed Breaking News team data**:
   - Copy contents from `supabase/seed-breaking-news-team.sql`
   - Paste into SQL Editor
   - Click "Run"

   This creates:
   - **Milan Bureau** (ITA-MILAN) - Europe/Rome timezone
   - **Rome Bureau** (ITA-ROME) - Europe/Rome timezone
   - 15 Breaking News team members with real data

4. **[Optional] Create dev admin user**:
   - Copy contents from `supabase/create-dev-admin.sql`
   - Paste into SQL Editor
   - Click "Run"

   This creates a development admin account:
   - **Email:** arlyn.gajilan@thomsonreuters
   - **Password:** testtest
   - **Role:** admin (full access to all features)
   - **Shift Role:** editor (highest scheduling permissions)

### Step 2: Disable Email Confirmation (Development Only)

For easier testing during development:

1. Go to **Authentication** → **Providers** → **Email**
2. Turn OFF "Confirm email"
3. Save

### Step 3: Login to the App

**Option A: Use Dev Admin Account** (if you ran `create-dev-admin.sql`):

1. Go to <http://localhost:3000/login>
2. Login with:
   - **Email:** arlyn.gajilan@thomsonreuters
   - **Password:** testtest
3. You'll have full admin access

**Option B: Use Seeded User Account**:

1. Go to <http://localhost:3000/login>
2. Login with any Breaking News team member:
   - **Example Email:** <gianluca.semeraro@thomsonreuters.com>
   - **Password:** changeme (all seeded users)
3. Access dashboard features

**Option C: Create New Account**:

1. Go to <http://localhost:3000/signup>
2. Fill in the form:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Password**: Choose a password (min 6 chars)
   - **Bureau**: Select either Milan or Rome
   - **Team**: "Breaking News" (pre-filled, read-only for MVP)
   - **Role Level**: Choose your role (Junior, Senior, Lead, or Support)
3. Click "Sign Up"

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

- Run the `setup-breaking-news-bureaus.sql` script
- Verify bureaus exist in Supabase Table Editor

### Can't login

- Check if email confirmation is disabled (Auth → Providers → Email)
- Verify user exists in `users` table
- Check user has a `bureau_id` assigned

### Bureau selection page shows after login

- User needs a `bureau_id` in their profile
- Update manually in Supabase or sign up again with bureau selected

## Next Steps

Once you have the staff CSV:

1. Share it with the development team
2. We'll format it properly for import
3. Run the import process
4. All Breaking News team members will be set up in Milan and Rome bureaus
5. You can start scheduling shifts!
