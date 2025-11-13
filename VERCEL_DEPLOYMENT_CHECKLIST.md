# Vercel Deployment Checklist - Generate Schedule Fix

**Issue:** Generate Schedule feature not working on Vercel  
**Code Status:** ✅ All fixes committed and pushed  
**Deployment:** Needs environment variables and redeploy

---

## 🔴 Critical: Environment Variables

The fixes are in the code, but **Vercel needs the environment variables set**.

### Step 1: Set Environment Variables in Vercel

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these variables (if not already set):

```bash
# REQUIRED - AI Features
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# REQUIRED - Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** Use the SAME values from your `.env.local` file

3. **Important:** Make sure to select "Production" environment for each variable

4. Save all variables

### Step 2: Trigger New Deployment

After setting environment variables, you **MUST** redeploy:

**Option A: Via Vercel Dashboard**
1. Go to Deployments tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache: No"

**Option B: Via Git Push (Already Done)**
```bash
# Latest changes already pushed
git log --oneline -1
# Should show: ac0b360 fix(tests): update failing test + add diagnostic tools
```

**Option C: Via Vercel CLI**
```bash
vercel --prod
```

---

## ✅ Verify Deployment

### Check 1: Latest Code is Deployed

Visit your Vercel deployment and check:
1. Go to: `https://your-app.vercel.app`
2. Open DevTools (F12) → Network tab
3. Go to Schedule Management
4. Check that the latest version is running

### Check 2: Environment Variables Work

Test the AI status endpoint:
```bash
# Replace YOUR_APP_URL and YOUR_TOKEN
curl https://your-app.vercel.app/api/ai/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected if variables are set:
{
  "ai_enabled": true,
  "model": "claude-sonnet-4-20250514"
}

# If variables NOT set:
{
  "ai_enabled": false,
  "configuration_status": "AI features are disabled. Set ANTHROPIC_API_KEY..."
}
```

### Check 3: Database Has Data

Verify Supabase has the Breaking News team:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run:
```sql
SELECT COUNT(*) FROM users WHERE team = 'Breaking News';
-- Should return 15
```

If 0, run: `supabase/seed-breaking-news-team.sql`

---

## 🐛 Vercel-Specific Issues

### Issue 1: Environment Variables Not Set

**Symptoms:**
- "AI Not Configured" error
- `ai_enabled: false` in status endpoint

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY`
3. Click "Save"
4. **Redeploy** (this is critical!)

### Issue 2: Old Build Cached

**Symptoms:**
- Changes not appearing
- Old behavior persists

**Solution:**
1. Go to Deployments
2. Redeploy with "Use existing Build Cache: **No**"
3. Wait for deployment to complete

### Issue 3: Build Failed

**Symptoms:**
- Deployment shows error
- Site not accessible

**Solution:**
1. Check Vercel deployment logs
2. Look for build errors
3. Common issues:
   - TypeScript errors (we have none ✅)
   - Missing dependencies (all present ✅)
   - Environment variable references in build

### Issue 4: API Routes Not Found

**Symptoms:**
- 404 on `/api/ai/generate-schedule`
- Routes not working

**Solution:**
1. Verify Next.js version compatibility
2. Check vercel.json (if exists)
3. Ensure API routes are in `app/api/` directory (they are ✅)

---

## 📋 Complete Deployment Steps

### Do This Now:

1. **Check Environment Variables**
   ```bash
   # In Vercel Dashboard:
   Settings → Environment Variables
   
   Verify these exist:
   ✓ ANTHROPIC_API_KEY (Production)
   ✓ NEXT_PUBLIC_SUPABASE_URL (Production)
   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY (Production)
   ✓ SUPABASE_SERVICE_ROLE_KEY (Production)
   ```

2. **Trigger Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on latest
   - Uncheck "Use existing Build Cache"
   - Click "Redeploy"

3. **Wait for Deployment** (2-5 minutes)

4. **Test the Feature**
   - Go to your Vercel URL
   - Log in
   - Navigate to Schedule Management
   - Click "Generate Schedule"
   - Open Browser Console (F12) and watch for:
     - `[Schedule] Generate button clicked`
     - `[Schedule] AI Status: { ai_enabled: true }`
     - `[Schedule] AI Response: { ... }`

---

## 🔍 Debug Vercel Deployment

### Check Vercel Logs:

1. Go to Vercel Dashboard → Deployments → [Latest]
2. Click "View Function Logs"
3. Look for:
   - `Calling Claude Sonnet 4.5 for schedule generation...`
   - `[AI Response] Raw Claude output...`
   - `[Parse Success] Parsed N shifts successfully`
   - Any error messages

### Test API Directly on Vercel:

```bash
# 1. Get your Vercel URL
VERCEL_URL="https://your-app.vercel.app"

# 2. Login
TOKEN=$(curl -s -X POST "$VERCEL_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"gianluca.semeraro@thomsonreuters.com","password":"changeme"}' \
  | jq -r '.session.access_token')

echo "Token: $TOKEN"

# 3. Check AI status
curl -s "$VERCEL_URL/api/ai/status" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Generate schedule
curl -s -X POST "$VERCEL_URL/api/ai/generate-schedule" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-11-15",
    "end_date": "2025-11-21",
    "type": "week",
    "bureau": "both",
    "save_to_database": false
  }' | jq
```

---

## ⚠️ Common Vercel Gotchas

### 1. Environment Variables Scope
- Variables must be set for **Production** environment
- Changing variables requires **redeploy** to take effect
- Preview deployments may not have production variables

### 2. Function Timeout
- Vercel has 10-second timeout (Hobby) or 60-second (Pro)
- Claude API calls take 5-20 seconds typically
- If timing out, upgrade to Pro plan

### 3. Cold Starts
- First request after idle may be slow
- Serverless functions "wake up" on first use
- Subsequent requests will be fast

### 4. Build Cache
- Vercel caches builds for speed
- Sometimes cache causes old code to run
- Force fresh build: Redeploy without cache

---

## ✅ Success Criteria

After redeployment, verify:

- [ ] Vercel deployment shows "Ready"
- [ ] Environment variables all set
- [ ] AI status endpoint returns `ai_enabled: true`
- [ ] Can log in successfully
- [ ] Schedule Management page loads
- [ ] Generate Schedule button clickable
- [ ] Browser console shows `[Schedule]` logs
- [ ] Schedule preview displays
- [ ] No errors in Vercel Function Logs

---

## 📞 Quick Support Commands

### Check Deployment Status:
```bash
# Via Vercel CLI
vercel ls

# Check latest deployment
vercel inspect your-deployment-url
```

### View Environment Variables:
```bash
# Via Vercel CLI
vercel env ls
```

### Pull Production Environment:
```bash
# Via Vercel CLI
vercel env pull .env.production
cat .env.production
```

---

## 🎯 TL;DR - Do This Now:

1. **Vercel Dashboard** → Settings → Environment Variables
2. **Add** `ANTHROPIC_API_KEY` if missing
3. **Go to** Deployments → Click "Redeploy" (no cache)
4. **Wait** 2-5 minutes
5. **Test** the generate schedule feature

---

**The code is correct** ✅  
**The fixes are pushed** ✅  
**Vercel needs redeploy with env vars** ⚠️

---

**Last Updated:** November 13, 2025  
**Latest Commit:** ac0b360  
**Status:** Code ready, needs Vercel redeploy

