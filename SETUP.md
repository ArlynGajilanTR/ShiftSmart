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

2. Use the pre-configured **ShiftSmart-v2** credentials in `.env.local`:

   ```env
   # ShiftSmart-v2 Supabase Project (Production - us-west-2)
   NEXT_PUBLIC_SUPABASE_URL=https://wmozxwlmdyxdnzcxetgl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb3p4d2xtZHl4ZG56Y3hldGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTQ3ODEsImV4cCI6MjA4MDI3MDc4MX0.tTTm0G5Qwwo3dDNZBaZPnEfrLKQHbEy_0ykWVPtmwQ0
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Get from Supabase Dashboard → Settings → API
   ```

## Step 2: Database Setup (Already Configured ✅)

> **The ShiftSmart-v2 database is fully set up!** No manual migration needed.

### What's Pre-Configured

| Component             | Status | Details                              |
| --------------------- | ------ | ------------------------------------ |
| **Schema**            | ✅     | 8 tables with indexes, triggers, RLS |
| **Milan Bureau**      | ✅     | 8 Breaking News team members         |
| **Rome Bureau**       | ✅     | 8 Breaking News team members         |
| **Admin Account**     | ✅     | arlyn.gajilan@thomsonreuters.com     |
| **Shift Preferences** | ✅     | 16 team members configured           |

### Admin Account

- **Email:** arlyn.gajilan@thomsonreuters.com
- **Password:** testtest
- **Role:** admin (full access to all features)
- **Shift Role:** editor (highest scheduling permissions)

### If You Need to Reset

Only run these if you need to recreate the database:

1. Copy contents from `supabase/schema.sql`
2. Run in SQL Editor
3. Use Supabase MCP to re-seed team data

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
