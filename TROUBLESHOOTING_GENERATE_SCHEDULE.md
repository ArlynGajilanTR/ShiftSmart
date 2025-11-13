# Troubleshooting: Generate Schedule Not Working

**Date:** November 13, 2025  
**Status:** All code is correct - This is a runtime/environment issue

---

## ✅ What We've Verified

All diagnostic checks pass:
- ✅ All code files are in place
- ✅ All fixes are implemented
- ✅ All 32 tests passing (100%)
- ✅ ANTHROPIC_API_KEY is set in .env.local
- ✅ Supabase configuration is complete
- ✅ TypeScript compiles without errors
- ✅ Code structure is correct

**The problem is NOT in the code itself.**

---

## 🔍 Common Issues & Solutions

### Issue 1: Dev Server Not Restarted

**Symptoms:**
- Changes not taking effect
- Old code still running

**Solution:**
```bash
# Stop any running dev servers
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs kill -9

# Start fresh
npm run dev
```

**Why:** Next.js needs to be restarted to pick up changes to server-side code.

---

### Issue 2: No Employees in Database

**Symptoms:**
- Error: "No employees found for scheduling"
- Schedule generates with 0 shifts

**Check:**
```bash
# Run diagnostic
node scripts/diagnose-generate-schedule.js
```

**Solution:**
1. Verify database has seeded data:
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run: `SELECT * FROM users WHERE team = 'Breaking News';`
   - Should return 15 employees

2. If no data, run seed script:
   ```sql
   -- In Supabase SQL Editor:
   -- Run supabase/seed-breaking-news-team.sql
   ```

---

### Issue 3: Authentication Issues

**Symptoms:**
- "No authentication token found"
- "Unauthorized" errors

**Solution:**
1. Make sure you're logged in
2. Clear browser localStorage:
   ```javascript
   // In browser console (F12):
   localStorage.clear();
   ```
3. Log in again
4. Try generate schedule

---

### Issue 4: Claude API Issues

**Symptoms:**
- Schedule generation hangs
- Timeout errors
- "Failed to generate AI schedule" errors

**Check:**
```bash
# Test Claude API directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Solutions:**
1. Check API key is valid in Anthropic Console
2. Check API usage/limits
3. Verify internet connection
4. Check firewall/proxy settings

---

### Issue 5: CORS or Network Errors

**Symptoms:**
- Network tab shows failed requests
- CORS errors in console

**Solution:**
1. Check if dev server is running on correct port (3000)
2. Verify API_URL in lib/api-client.ts is correct
3. Check browser console for specific error messages

---

## 🐛 Debugging Steps

### Step 1: Check Server Logs

```bash
# Start dev server with verbose logging
npm run dev

# Watch for errors like:
# - "Schedule generation error:"
# - "[Parse Error]"
# - "[Validation Error]"
```

### Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Navigate to Schedule Management
4. Click "Generate Schedule"
5. Watch for:
   - `[Schedule] Generate button clicked`
   - `[Schedule] Checking AI status...`
   - `[Schedule] AI Status: {...}`
   - `[Schedule] Calling AI generate schedule...`
   - `[Schedule] AI Response: {...}`

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click "Generate Schedule"
5. Look for:
   - `POST /api/ai/status` → Should return `{ "ai_enabled": true }`
   - `POST /api/ai/generate-schedule` → Should return schedule data

### Step 4: Test API Endpoints Directly

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gianluca.semeraro@thomsonreuters.com","password":"changeme"}' \
  | jq -r '.session.access_token')

echo "Token: $TOKEN"

# 2. Check AI status
curl -s http://localhost:3000/api/ai/status \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected: { "ai_enabled": true, "model": "claude-sonnet-4-20250514" }

# 3. Generate schedule
curl -s -X POST http://localhost:3000/api/ai/generate-schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-11-15",
    "end_date": "2025-11-21",
    "type": "week",
    "bureau": "both",
    "save_to_database": false
  }' | jq '.schedule.shifts | length'

# Should return a number > 0
```

---

## 📊 Expected Behavior

### Successful Flow:

1. **Click Generate Schedule button**
   - Browser console: `[Schedule] Generate button clicked`

2. **AI Status Check**
   - Browser console: `[Schedule] Checking AI status...`
   - Browser console: `[Schedule] AI Status: { ai_enabled: true }`

3. **Generate Schedule**
   - Browser console: `[Schedule] Calling AI generate schedule...`
   - Server logs: `Calling Claude Sonnet 4.5 for schedule generation...`
   - Server logs: `[AI Response] Raw Claude output (first 500 chars): ...`
   - Server logs: `[Parse Success] Parsed N shifts successfully`
   - Server logs: `[Validation Success] N shifts validated for 7 days`

4. **Display Preview**
   - Browser console: `[Schedule] AI Response: { schedule: {...} }`
   - Toast notification: "Schedule generated successfully"
   - Preview modal shows shifts

### If It Fails:

Check browser console and server logs for specific error messages:
- `AI Not Configured` → Issue #4 (Claude API)
- `No employees found` → Issue #2 (Database)
- `Unauthorized` → Issue #3 (Authentication)
- `Failed to parse AI response` → Issue #4 (Claude returning invalid JSON)
- `AI generated 0 shifts` → Issue #2 or #4 (No employees or prompt issue)

---

## 🔧 Quick Fixes

### Reset Everything:

```bash
# 1. Stop all servers
ps aux | grep "next" | grep -v grep | awk '{print $2}' | xargs kill -9

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies (if needed)
rm -rf node_modules package-lock.json
npm install

# 4. Start fresh
npm run dev
```

### Test From Scratch:

```bash
# 1. Run diagnostics
node scripts/diagnose-generate-schedule.js

# 2. Run tests
npm run test:unit -- getShiftType parseScheduleResponse scheduler-agent

# 3. Start server
npm run dev

# 4. Test in browser
open http://localhost:3000
```

---

## 💡 Still Not Working?

If you've tried everything above and it still doesn't work:

### Collect Debug Information:

1. **Browser Console Output:**
   ```javascript
   // Copy full console output after clicking "Generate Schedule"
   ```

2. **Server Logs:**
   ```bash
   # Include server terminal output
   ```

3. **Network Tab:**
   - Screenshot of failed request
   - Request headers
   - Response body

4. **Environment:**
   - Node version: `node --version`
   - npm version: `npm --version`
   - OS: `uname -a`

### Check Specific Error Messages:

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "AI Not Configured" | ANTHROPIC_API_KEY missing/invalid | Check .env.local, restart server |
| "No employees found" | Database not seeded | Run seed script |
| "Unauthorized" | Not logged in or token expired | Log out and log in again |
| "Failed to parse AI response" | Claude returning invalid JSON | Check Claude API key, check logs |
| "Network request failed" | Server not running or wrong URL | Verify `npm run dev` is running |
| "Internal server error" | Backend crash | Check server logs for stack trace |

---

## 📝 Additional Resources

- **Code Diagnostics:** `scripts/diagnose-generate-schedule.js`
- **Implementation Details:** `AI_SCHEDULE_FIXES_COMPLETE.md`
- **Test Coverage:** Run `npm run test:unit`
- **API Documentation:** `API_REFERENCE.md`

---

## ✅ Verification Checklist

Before reporting an issue, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] Server started successfully (no errors in terminal)
- [ ] Logged into the application
- [ ] Browser console is open (F12)
- [ ] Network tab is recording
- [ ] Clicked "Generate Schedule" button
- [ ] Checked browser console for error messages
- [ ] Checked server logs for error messages
- [ ] Checked network tab for failed requests
- [ ] Ran diagnostic script: `node scripts/diagnose-generate-schedule.js`
- [ ] Tests passing: `npm run test:unit`

---

**Last Updated:** November 13, 2025  
**Diagnostic Script:** `scripts/diagnose-generate-schedule.js`  
**Status:** Code is correct - Check runtime environment

