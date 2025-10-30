# ShiftSmart v1 - Quick Start 🚀

Welcome to ShiftSmart! This guide will get you up and running in under 10 minutes.

## What You'll Need

- ✅ Node.js 18 or higher
- ✅ A Supabase account (free tier is fine)
- ✅ A code editor

## 5-Minute Setup

### Step 1: Environment Variables (2 min)

1. Create a `.env.local` file in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Go to [Supabase](https://supabase.com) and create a new project (or use existing)

3. Get your credentials:
   - Project Settings → API
   - Copy the URL and `anon` key

4. Paste into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   ```

### Step 2: Database Setup (2 min)

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy ALL contents from `supabase/schema.sql`
4. Paste and click "Run"
5. ✅ You should see "Success" messages

### Step 3: Install & Run (1 min)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## First Time Use

### Create Your First Bureau

1. Go to Supabase → Table Editor → `bureaus`
2. Insert a new row:
   - **name**: "Main Office"
   - **code**: "MAIN"
   - **timezone**: "America/New_York"
   - Leave settings as default

3. Copy the bureau `id` (you'll need this for CSV import)

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

### 4. Conflict Management

**🔴 Red = Hard Conflict** (Must fix):
- Double booking
- No rest period
- All-junior shifts
- Understaffed

**🟡 Yellow = Soft Warning** (Review):
- User unavailable
- Overtime risk
- Preference violation

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

| Feature | Status |
|---------|--------|
| 📅 Multi-view scheduling | ✅ |
| 👥 Role-based balancing | ✅ |
| 🖱️ Drag & drop | ✅ |
| ⚠️ Conflict detection | ✅ |
| 🏢 Bureau management | ✅ |
| 📊 CSV import/export | ✅ |
| 🔐 Secure auth | ✅ |

## Resources

- **Full Setup**: See `SETUP.md`
- **PRD**: See `PRD.md`
- **Schema**: See `supabase/schema.sql`
- **Sample Data**: See `data/sample_schedule.csv`

## Support

Questions? Check:
1. The documentation files
2. Browser console for errors
3. Supabase logs
4. Database table contents

---

**Ready to schedule smarter?** Let's go! 🚀

