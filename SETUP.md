# ShiftSmart v1 Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account
- Git (optional)

## Step 1: Environment Setup

1. Copy the example environment file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional)

## Step 2: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Run the SQL to create all tables, indexes, and policies
5. Verify the tables were created successfully

### Optional: Seed Sample Data

**For Breaking News team setup:**

1. Copy contents from `supabase/seed-breaking-news-team.sql`
2. Run in SQL Editor
3. This creates Milan and Rome bureaus with 15 real team members
4. Default password for all seeded users: `changeme`

**For development/testing:**

1. Copy contents from `supabase/create-dev-admin.sql`
2. Run in SQL Editor
3. This creates an admin account:
   - Email: arlyn.gajilan@thomsonreuters
   - Password: testtest
   - Role: admin (full access)

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 5: Initial Data Setup

### Option A: Manual Setup

1. Create a bureau:
   - Go to Supabase dashboard → Table Editor → bureaus
   - Insert a new row with name, code, and settings

2. Create users:
   - Go to Authentication → Add user
   - Then add user details in the users table

### Option B: CSV Import

1. Download the CSV template from `/import` page
2. Fill in your data following the template format
3. Get your bureau ID from Supabase (bureaus table)
4. Upload and import via the Import page

## Step 6: Start Scheduling

1. Go to `/welcome` to select your bureau
2. Navigate to `/dashboard` to start scheduling
3. Drag and drop users onto shifts
4. Watch for conflict warnings (soft/hard)
5. Save your schedule

## Project Structure

```
shiftsmart-v1/
├── app/                      # Next.js app router
│   ├── (auth)/              # Auth pages (login, welcome)
│   ├── (dashboard)/         # Main app pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── calendar/            # Calendar & drag-drop
│   └── ui/                  # Reusable UI components
├── lib/                     # Core logic
│   ├── supabase/            # Supabase clients
│   ├── scheduling/          # Scheduling algorithms
│   └── validation/          # Conflict detection
├── types/                   # TypeScript types
├── supabase/                # Database schema
└── data/                    # CSV seed data
```

## Features

### Multi-View Scheduling

- **Week View**: Plan shifts for a single week
- **Month View**: Overview of the entire month
- **Quarter View**: Long-term planning (3 months)
- **Special Events**: Custom date ranges for events

### Role-Based Balancing

- Automatically validates skill mix
- Prevents all-junior shifts
- Ensures minimum senior/lead coverage
- Configurable per bureau

### Conflict Detection

**Hard Conflicts** (Must fix):

- Double booking
- Rest period violations
- Skill gaps (all-junior shifts)
- Insufficient coverage

**Soft Warnings** (Review recommended):

- Preference violations
- Overtime risk
- Role imbalance

### Drag & Drop Interface

- Drag users from sidebar onto shifts
- Visual feedback on hover
- Color-coded status (empty/partial/full)
- Remove assignments with one click

## Configuration

Bureau settings can be configured in the database:

```json
{
  "min_senior_per_shift": 1,
  "max_junior_per_shift": 3,
  "require_lead": true,
  "shift_duration_hours": 8
}
```

User preferences:

```json
{
  "unavailable_dates": ["2025-11-15", "2025-11-20"],
  "preferred_days": [1, 2, 3, 4, 5],
  "max_shifts_per_week": 5,
  "preferred_shift_times": ["09:00", "17:00"]
}
```

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys in `.env.local`
- Check if the tables were created successfully
- Ensure Row Level Security policies are configured

### Import Errors

- Verify CSV format matches the template
- Check bureau ID exists in database
- Review error messages in the import results

### Conflicts Not Showing

- Refresh the page to reload data
- Check if conflicts table has RLS policies enabled
- Verify conflict detection logic is running

## Support

For issues or questions:

1. Check the documentation
2. Review the database schema
3. Check browser console for errors
4. Contact your development team
