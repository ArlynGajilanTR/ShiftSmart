# ShiftSmart v1 - Quick Start 🚀

Welcome to ShiftSmart! This guide will get you up and running in under 10 minutes.

## What You'll Need

- ✅ Node.js 18 or higher
- ✅ A Supabase account (free tier is fine)
- ✅ A code editor

## 5-Minute Setup

### Step 1: Environment Variables (1 min)

1. Create a `.env.local` file in the project root:

   ```bash
   cp .env.local.example .env.local
   ```

2. Use the pre-configured **ShiftSmart-v2** Supabase project:

   ```env
   # ShiftSmart-v2 Supabase Project (Production)
   NEXT_PUBLIC_SUPABASE_URL=https://wmozxwlmdyxdnzcxetgl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtb3p4d2xtZHl4ZG56Y3hldGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTQ3ODEsImV4cCI6MjA4MDI3MDc4MX0.tTTm0G5Qwwo3dDNZBaZPnEfrLKQHbEy_0ykWVPtmwQ0
   ```

> ✅ The database is **already configured** with schema, team data, and your admin account!

### Step 2: Database (Already Set Up! ✅)

> **No action needed!** The ShiftSmart-v2 database is fully configured:
>
> - ✅ Schema with 8 tables, indexes, triggers, and RLS policies
> - ✅ Milan Bureau: 8 Breaking News team members
> - ✅ Rome Bureau: 8 Breaking News team members
> - ✅ Admin account: arlyn.gajilan@thomsonreuters.com / `testtest`
> - ✅ Shift preferences configured for all team members

**If you need to reset the database**, run in Supabase SQL Editor:

1. Copy contents from `supabase/schema.sql`
2. Re-seed data using the Supabase MCP tools

### Step 3: Install & Run (1 min)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## First Time Use

### Login with Your Admin Account

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Login with:
   - **Email:** arlyn.gajilan@thomsonreuters.com
   - **Password:** testtest
3. You'll have full admin access to both bureaus!

### Bureaus (Pre-Configured)

Two bureaus are already set up:

| Bureau                | Code      | Team Members | Timezone    |
| --------------------- | --------- | ------------ | ----------- |
| Reuters Italy - Milan | ITA-MILAN | 8            | Europe/Rome |
| Reuters Italy - Rome  | ITA-ROME  | 8            | Europe/Rome |

### Option A: Import Sample Data (Recommended)

1. Go to [http://localhost:3000/import](http://localhost:3000/import)
2. Download the template
3. Use `data/sample_schedule.csv` or create your own
4. Paste your bureau ID
5. Upload and import!

### Option B: Manual Setup

1. Create users in Supabase:
   - Auth → Add User → Create accounts
   - Then add details in `users` table

2. Create shifts in `shifts` table
3. Assign in `shift_assignments` table

## Using ShiftSmart

### 1. Welcome Screen

- First visit goes to `/welcome`
- Select your bureau
- View feature overview

### 2. Dashboard

- Main scheduling interface at `/dashboard`
- Drag users from left sidebar onto shifts
- Watch for conflicts in right panel

### 3. View Options

- **Week**: Weekly planning
- **Month**: Monthly overview
- **Quarter**: Long-term planning
- **Event**: Custom date ranges

### 4. Schedule Health (formerly Conflicts)

The **Schedule Health** dashboard provides AI-powered conflict prevention and resolution.

**🛡️ Conflicts Prevented**: Shows conflicts caught by AI before they were saved

**⚠️ Active Issues**: Current conflicts requiring attention

- **High** (Red): Double booking, no rest period, understaffed
- **Medium** (Yellow): Overtime risk, all-junior shifts
- **Low** (Orange): Preference violations

**AI Resolution**: Click "Resolve" to get AI-powered suggestions that actually fix the issue (not just mark it resolved)

### 5. Save

- Click "Save" button (top right)
- All assignments saved to database
- Conflicts logged for review

## Quick Tips

💡 **Drag & Drop**: Drag staff onto any shift to assign

💡 **Bureau Toggle**: Switch between departments easily

💡 **Navigation**: Use ← → arrows or "Today" button

💡 **Role Colors**:

- 🔵 Senior = Blue
- 🟣 Lead = Purple
- 🟢 Junior = Green
- ⚪ Support = Gray

💡 **CSV Import**: Bulk import existing schedules

## Troubleshooting

### "Database connection error"

→ Check `.env.local` credentials

### "No tables found"

→ Run `supabase/schema.sql` in SQL Editor

### "Import failed"

→ Verify bureau ID and CSV format

### "Conflicts not showing"

→ Refresh page or check browser console

## Next Steps

1. ✅ Set up your bureaus
2. ✅ Import or create users
3. ✅ Start scheduling shifts
4. ✅ Monitor conflicts
5. ✅ Save and publish

## Features at a Glance

| Feature                   | Status |
| ------------------------- | ------ |
| 📅 Multi-view scheduling  | ✅     |
| 👥 Role-based balancing   | ✅     |
| 🖱️ Drag & drop            | ✅     |
| 🛡️ AI conflict prevention | ✅     |
| 🤖 AI conflict resolution | ✅     |
| 🏢 Bureau management      | ✅     |
| 📊 CSV import/export      | ✅     |
| 🔐 Secure auth            | ✅     |

## Resources

- **Full Setup**: See `SETUP.md`
- **PRD**: See `PRD.md`
- **Schema**: See `supabase/schema.sql`
- **Sample Data**: See `data/sample_schedule.csv`

## Supabase Project Details

| Property         | Value           |
| ---------------- | --------------- |
| **Project Name** | ShiftSmart-v2   |
| **Region**       | us-west-2       |
| **Database**     | PostgreSQL 17.6 |
| **Status**       | ACTIVE_HEALTHY  |

## Support

Questions? Check:

1. The documentation files
2. Browser console for errors
3. Supabase Dashboard → Logs
4. Database table contents in Supabase Table Editor

---

**Ready to schedule smarter?** Let's go! 🚀

_Last Updated: December 2, 2025_
