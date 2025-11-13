# ⚠️ ACTION REQUIRED: Vercel Deployment

**Status:** Code fixes are ✅ COMPLETE and PUSHED  
**Issue:** Vercel deployment needs environment variables and redeploy  
**Urgency:** HIGH - Required for generate schedule to work

---

## 🎯 What You Need to Do (5 Minutes)

### 1. Set Environment Variables in Vercel (2 minutes)

Go to your Vercel project:
1. **Navigate to:** https://vercel.com/[your-project]/settings/environment-variables
2. **Verify/Add** these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (from your .env.local) | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production |

**⚠️ CRITICAL:** Select "Production" environment for each variable!

---

### 2. Trigger Redeploy (3 minutes)

After setting variables:

1. **Go to:** https://vercel.com/[your-project]/deployments
2. **Find** the latest deployment
3. **Click** the "..." menu (three dots)
4. **Click** "Redeploy"
5. **IMPORTANT:** Uncheck "Use existing Build Cache"
6. **Click** "Redeploy" button
7. **Wait** 2-5 minutes for deployment to complete

---

### 3. Verify It Works (2 minutes)

After deployment completes:

1. **Go to** your Vercel app URL
2. **Log in**
3. **Navigate to** Schedule Management
4. **Click** "Generate Schedule"
5. **Open** Browser Console (F12)
6. **Watch for:**
   - ✅ `[Schedule] AI Status: { ai_enabled: true }`
   - ✅ Schedule preview appears
   - ✅ No errors

---

## 🚨 Why This Is Necessary

**The Problem:**
- All code fixes are in GitHub ✅
- Vercel auto-deploys from GitHub ✅
- **BUT:** Environment variables are separate from code
- **AND:** Vercel caches builds (old code may still be running)

**The Solution:**
1. Set environment variables in Vercel Dashboard
2. Force a fresh deployment (no cache)
3. New code + environment variables = Working feature!

---

## 🔍 Quick Test (If Unsure)

Test if environment variables are set:

```bash
# Replace YOUR_APP_URL with your Vercel URL
curl https://your-app.vercel.app/api/ai/status

# IF ai_enabled is false:
{
  "ai_enabled": false,
  "configuration_status": "Set ANTHROPIC_API_KEY..."
}
# → You need to set environment variables!

# IF ai_enabled is true:
{
  "ai_enabled": true,
  "model": "claude-sonnet-4-20250514"
}
# → Environment variables are set correctly!
```

---

## 📋 Vercel Dashboard Quick Links

Replace `[your-project]` with your project name:

- **Settings:** https://vercel.com/[your-project]/settings/environment-variables
- **Deployments:** https://vercel.com/[your-project]/deployments
- **Logs:** https://vercel.com/[your-project]/logs

---

## ⏱️ Expected Timeline

- Set environment variables: **2 minutes**
- Trigger redeploy: **1 minute**
- Deployment completes: **2-5 minutes**
- Test feature: **2 minutes**

**Total:** ~10 minutes

---

## ✅ Success Criteria

After following the steps above, you should see:

1. ✅ Vercel deployment shows "Ready" (green checkmark)
2. ✅ `/api/ai/status` returns `{ "ai_enabled": true }`
3. ✅ Generate Schedule button is enabled
4. ✅ Clicking generates a preview with shifts
5. ✅ No errors in browser console

---

## 🆘 If Still Not Working

If you've completed all steps above and it still doesn't work:

**Check Vercel Function Logs:**
1. Vercel Dashboard → Deployments → Latest → "View Function Logs"
2. Click "Generate Schedule" in your app
3. Watch for errors in real-time
4. Share the error messages

**Common Issues:**
- API key not in "Production" environment → Move to Production
- Old build cache → Redeploy without cache
- Database not seeded → Run seed script in Supabase
- Authentication issue → Log out and log in again

---

## 📞 Quick Reference

```bash
# Test AI Status (no auth required)
curl https://your-app.vercel.app/api/ai/status

# Test with Authentication
# 1. Login first (get token)
# 2. Then test generate:
curl -X POST https://your-app.vercel.app/api/ai/generate-schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-11-15",
    "end_date": "2025-11-21",
    "type": "week",
    "bureau": "both"
  }'
```

---

## 🎯 TL;DR

**Your code is correct and deployed to GitHub.**  
**Vercel needs to:**
1. Have environment variables set (ANTHROPIC_API_KEY)
2. Be redeployed to pick up latest code

**Do this now:**
- Go to Vercel → Settings → Environment Variables → Add ANTHROPIC_API_KEY
- Go to Deployments → Redeploy (no cache)
- Wait 5 minutes
- Test the feature

---

**Code Status:** ✅ ALL FIXES COMPLETE AND PUSHED  
**Vercel Status:** ⚠️ NEEDS ENVIRONMENT VARIABLES + REDEPLOY  
**ETA to Working:** ~10 minutes after you set env vars and redeploy

---

**Last Updated:** November 13, 2025  
**Latest Commit:** Will be pushed after removing sensitive data

