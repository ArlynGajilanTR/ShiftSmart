# Testing the Generate Preview Button Fix

## Pre-Testing Checklist

Before you begin testing, ensure:
- [ ] Development server is running (`npm run dev`)
- [ ] You have browser developer tools available (F12)
- [ ] You're logged into the application
- [ ] You've run `npm run check:ai` to verify configuration

---

## Test Scenario 1: AI Not Configured (Graceful Failure)

**Purpose:** Verify the app handles missing AI configuration gracefully

### Steps:

1. **Ensure AI is not configured:**
   ```bash
   # Comment out or remove ANTHROPIC_API_KEY from .env.local
   # Restart the server
   npm run dev
   ```

2. **Open browser and navigate to:**
   ```
   http://localhost:3000/dashboard/schedule
   ```

3. **Open browser console (F12)**

4. **Click "Generate Schedule" button** (Sparkles icon in top right)

5. **Observe the dialog that opens**

### Expected Results:

✅ **Visual Feedback:**
- Red alert box appears at top of dialog
- Alert says: "AI Not Configured"
- Alert includes message about ANTHROPIC_API_KEY
- "Generate Preview" button is disabled
- Button text shows "AI Not Available"

✅ **Console Logs:**
```
[Schedule] Checking AI configuration status...
[Schedule] AI Status Response: { ai_enabled: false, ... }
```

✅ **No Errors:**
- No JavaScript errors in console
- App doesn't crash
- Dialog remains open and usable

### Screenshot Locations to Check:

1. Top of dialog - Red alert box
2. Bottom of dialog - Disabled button
3. Browser console - Debug logs

---

## Test Scenario 2: AI Configured (Success Flow)

**Purpose:** Verify AI schedule generation works when properly configured

### Steps:

1. **Ensure AI is configured:**
   ```bash
   # Add to .env.local:
   # ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   
   # Verify configuration
   npm run check:ai
   
   # Should show: ✅ CONFIGURATION LOOKS GOOD!
   
   # Restart server
   npm run dev
   ```

2. **Open browser with console (F12)**

3. **Navigate to:**
   ```
   http://localhost:3000/dashboard/schedule
   ```

4. **Click "Generate Schedule" button**

5. **Watch the button state changes:**
   - Initial: "Generate Preview"
   - After dialog opens: Shows spinner briefly with "Checking AI..."
   - After check completes: Returns to "Generate Preview" (enabled)

6. **Fill in the form:**
   - Start Date: First day of next month
   - End Date: Last day of next month
   - Period Type: Month
   - Bureau: Both Bureaus
   - Keep existing shifts: Unchecked

7. **Click "Generate Preview" button**

8. **Monitor console logs**

9. **Wait for generation to complete** (10-30 seconds)

### Expected Results:

✅ **Button States:**
1. "Checking AI..." with spinner (briefly)
2. "Generate Preview" (enabled, green)
3. "Generating..." with spinner (during generation)
4. Preview appears

✅ **Console Logs (in order):**
```
[Schedule] Generate button clicked { start_date: "...", end_date: "...", ... }
[Schedule] Checking AI status...
[Schedule] AI Status: { ai_enabled: true, ... }
[Schedule] Calling AI generate schedule...
[Schedule] AI Response: { success: true, schedule: {...} }
```

✅ **Success Toast:**
- Green toast notification appears
- Message: "Schedule generated successfully"
- Description: "Generated X shifts"

✅ **Preview Display:**
- Dialog changes to show preview
- Summary cards show shift counts and metrics
- Fairness metrics section shows distributions
- Table shows first 10 shifts
- "Approve & Save to Calendar" button appears

### Screenshot Locations to Check:

1. Initial dialog with form (AI configured alert should NOT appear)
2. Button states during generation
3. Preview with schedule details
4. Success toast notification
5. Console logs showing full flow

---

## Test Scenario 3: AI Configured but No Employees

**Purpose:** Verify proper error handling when data is missing

### Steps:

1. **With AI configured and server running**

2. **Open Schedule Management page**

3. **Click "Generate Schedule"**

4. **Select a future date range where no employees are available**
   - Or temporarily comment out employees in database

5. **Click "Generate Preview"**

### Expected Results:

✅ **Error Handling:**
- Error toast appears
- Message indicates no employees found
- Button returns to "Generate Preview" state
- Dialog remains open
- No crash or freeze

✅ **Console Logs:**
```
[Schedule] Generate button clicked
[Schedule] Checking AI status...
[Schedule] AI Status: { ai_enabled: true }
[Schedule] Calling AI generate schedule...
[Schedule] Failed to generate schedule: No employees found
```

---

## Test Scenario 4: Network/API Errors

**Purpose:** Verify error handling for API failures

### Steps:

1. **With AI configured**

2. **Simulate network issues:**
   - In browser DevTools, go to Network tab
   - Throttle to "Offline" mode
   - Or use invalid API key

3. **Try to generate schedule**

### Expected Results:

✅ **Error Handling:**
- Error toast with descriptive message
- Button returns to ready state
- No infinite loading
- Clear error in console

---

## Test Scenario 5: Dialog State Management

**Purpose:** Verify dialog state resets properly

### Steps:

1. **Open Generate Schedule dialog**
2. **Close it (click Cancel)**
3. **Open it again**
4. **Verify state is fresh:**
   - AI status check runs again
   - Previous preview is cleared
   - Form is reset to defaults

### Expected Results:

✅ **State Management:**
- Each time dialog opens, fresh AI check occurs
- Previous generation results don't persist
- Button state resets correctly
- Console shows new check on each open

---

## Test Scenario 6: Authentication Issues

**Purpose:** Verify handling of auth failures

### Steps:

1. **Clear localStorage:**
   ```javascript
   // In browser console:
   localStorage.clear()
   ```

2. **Try to generate schedule without logging in again**

### Expected Results:

✅ **Auth Handling:**
- Error about authentication
- Clear message to log in again
- Redirect to login page (may happen)

---

## Debugging Checklist

If something doesn't work as expected:

### Check Browser Console

Look for:
- [ ] `[Schedule]` prefixed logs showing flow
- [ ] Any red error messages
- [ ] Network request failures

### Check Network Tab

Look for:
- [ ] `GET /api/ai/status` - Should return 200
- [ ] `POST /api/ai/generate-schedule` - Check response
- [ ] Any 401 (auth) or 500 (server) errors

### Check Application State

In browser console, run:
```javascript
// Check if token exists
localStorage.getItem('auth_token')

// Check user
localStorage.getItem('user')
```

### Check Server Logs

Terminal running `npm run dev` should show:
- API requests being received
- Any server-side errors
- Database connection status

### Quick Fixes

**Problem:** Button always disabled
- **Fix:** Clear browser cache and localStorage
- **Fix:** Check console for AI status response

**Problem:** No console logs appearing
- **Fix:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- **Fix:** Verify code changes were saved

**Problem:** API returns 500 error
- **Fix:** Check server terminal for errors
- **Fix:** Verify database connection
- **Fix:** Check ANTHROPIC_API_KEY format

---

## Success Criteria

All tests pass when:

✅ **Without AI configured:**
- Clear error messages appear
- Button is disabled appropriately
- No crashes or silent failures

✅ **With AI configured:**
- Generation works end-to-end
- Preview displays correctly
- Can save to database

✅ **Error scenarios:**
- All errors show clear messages
- App recovers gracefully
- User knows what to do next

---

## Performance Expectations

| Operation | Expected Time |
|-----------|--------------|
| Open dialog | < 1 second |
| AI status check | < 2 seconds |
| Schedule generation | 10-30 seconds |
| Save to database | 2-5 seconds |

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

All modern browsers should work identically.

---

## Accessibility Testing

While testing, verify:
- [ ] Button is keyboard accessible (Tab + Enter)
- [ ] Error messages are announced by screen readers
- [ ] Dialog can be closed with Escape key
- [ ] Focus management works correctly

---

## Final Verification

After completing all tests:

1. **Verify configuration checker:**
   ```bash
   npm run check:ai
   ```

2. **Check file changes:**
   ```bash
   git status
   ```

3. **Review changes:**
   - `app/dashboard/schedule/page.tsx`
   - `AI_SETUP_TROUBLESHOOTING.md`
   - `scripts/check-ai-config.js`
   - `package.json`
   - `README.md`

4. **Document any issues found**

---

## Reporting Issues

If you find problems, include:
- Browser and version
- Steps to reproduce
- Console error messages
- Network tab showing failed requests
- Expected vs actual behavior
- Screenshots if relevant

---

**Happy Testing!** 🧪

If all tests pass, the "Generate Preview" button is now fully functional with proper error handling and user feedback.

