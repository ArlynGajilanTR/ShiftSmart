# 🔧 Database Update Required

## Issue Found

The seed script had a **fake** bcrypt hash that won't validate against the password "changeme".

## What I Fixed

✅ Updated `supabase/seed-breaking-news-team.sql` with a real bcrypt hash for password "changeme"

## Action Needed

**Please re-run the seed script in Supabase:**

1. Go to: <https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new>
2. Copy the contents of: `~/shiftsmart-v1/supabase/seed-breaking-news-team.sql`
3. Paste and click "Run"
4. You should see: "Successfully seeded 15 Breaking News team members"

## Then We Can Run Tests

Once re-seeded, the tests will pass because:

- Email: `gianluca.semeraro@thomsonreuters.com`
- Password: `changeme` ✅ (now has correct hash)

**Should I commit this fix to GitHub first, or do you want to re-seed now?**
