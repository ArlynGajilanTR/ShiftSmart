# AI Schedule Generation - Setup & Troubleshooting Guide

## Overview

The "Generate Preview" button in the Schedule Management page uses Claude Sonnet 4.5 AI to automatically generate optimized shift schedules. This guide helps you set up and troubleshoot AI features.

---

## Quick Setup

### 1. Get an Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Configure Environment Variable

Create or edit `.env.local` in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Restart the Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

---

## How to Check if AI is Working

### Method 1: Check AI Status Endpoint

```bash
# First, get your auth token by logging in
# Then test the status endpoint
curl http://localhost:3000/api/ai/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (Working):**

```json
{
  "ai_enabled": true,
  "model": "claude-sonnet-4-20250514",
  "features": {
    "schedule_generation": true,
    "conflict_resolution": true,
    "fairness_analysis": true
  },
  "configuration_status": "AI features are enabled and ready to use"
}
```

**Expected Response (Not Configured):**

```json
{
  "ai_enabled": false,
  "model": "claude-sonnet-4-20250514",
  "features": {
    "schedule_generation": false,
    "conflict_resolution": false,
    "fairness_analysis": false
  },
  "configuration_status": "AI features are disabled. Set ANTHROPIC_API_KEY environment variable to enable."
}
```

### Method 2: UI Indicator

1. Log in to the application
2. Go to Dashboard → Schedule Management
3. Click "Generate Schedule" button
4. Look for the alert message:
   - ✅ **Green Alert**: AI is configured and ready
   - ❌ **Red Alert**: AI is not configured (shows setup instructions)

---

## Common Issues & Solutions

### Issue 1: "AI Not Configured" Error

**Symptoms:**

- Red alert in the Generate Schedule dialog
- Button shows "AI Not Available"
- Console shows: `AI scheduling not configured`

**Solution:**

1. Verify `.env.local` file exists in project root
2. Check that `ANTHROPIC_API_KEY` is set correctly
3. Ensure the key starts with `sk-ant-`
4. Restart the development server
5. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+F5)

### Issue 2: "No authentication token found" Error

**Symptoms:**

- Error message about authentication
- Button click seems to do nothing

**Solution:**

1. Make sure you're logged in
2. Check browser console for errors
3. Try logging out and logging back in
4. Clear browser localStorage and login again

### Issue 3: Button is Disabled

**Symptoms:**

- "Generate Preview" button is grayed out
- Shows "Checking AI..." indefinitely

**Solution:**

1. Check browser console for errors (F12)
2. Verify API endpoint is running: `http://localhost:3000/api/ai/status`
3. Check network tab for failed requests
4. Verify authentication token in localStorage

### Issue 4: "Failed to generate schedule" Error

**Symptoms:**

- Button works but generation fails
- Error toast appears after clicking

**Possible Causes & Solutions:**

**A. Invalid API Key**

- Verify the API key is correct
- Check Anthropic console for key status
- Regenerate the API key if needed

**B. No Employees in Database**

- Run the database seed: `npm run db:seed`
- Verify employees exist in the Breaking News team
- Check Supabase dashboard

**C. API Rate Limit**

- Wait a few minutes
- Check Anthropic console for usage
- Upgrade API plan if needed

**D. Network/Connection Issues**

- Check internet connection
- Verify Anthropic API is accessible
- Check firewall/proxy settings

---

## Debugging with Browser Console

### Enable Debug Logging

The schedule page now includes comprehensive logging. Open browser console (F12) and watch for:

```
[Schedule] Generate button clicked
[Schedule] Checking AI configuration status...
[Schedule] AI Status Response: { ai_enabled: true, ... }
[Schedule] Calling AI generate schedule...
[Schedule] AI Response: { schedule: {...}, ... }
```

### Understanding Console Messages

| Message                            | Meaning                               |
| ---------------------------------- | ------------------------------------- |
| `Generate button clicked`          | Button handler triggered successfully |
| `Checking AI configuration status` | Calling AI status API                 |
| `AI Status Response`               | Shows if AI is enabled                |
| `Calling AI generate schedule`     | Starting schedule generation          |
| `AI Response`                      | Schedule generated successfully       |
| `Failed to generate schedule`      | Error occurred (check details)        |

---

## Testing the Fix

### 1. Test Without API Key

1. Remove or comment out `ANTHROPIC_API_KEY` from `.env.local`
2. Restart server
3. Navigate to Schedule Management
4. Click "Generate Schedule"
5. **Expected**: Red alert appears, button shows "AI Not Available"

### 2. Test With Valid API Key

1. Add valid `ANTHROPIC_API_KEY` to `.env.local`
2. Restart server
3. Navigate to Schedule Management
4. Click "Generate Schedule"
5. Fill in the form (dates, bureau, etc.)
6. Click "Generate Preview"
7. **Expected**:
   - Loading spinner appears
   - Schedule generates successfully
   - Preview shows shifts with fairness metrics

---

## Environment Variables Reference

### Required for AI Features

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### Required for Database

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## API Endpoint Details

### Generate Schedule Endpoint

**Endpoint:** `POST /api/ai/generate-schedule`

**Request Body:**

```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "type": "month",
  "bureau": "both",
  "preserve_existing": false,
  "save_to_database": false
}
```

**Response (Success):**

```json
{
  "success": true,
  "schedule": {
    "shifts": [...],
    "fairness_metrics": {...},
    "recommendations": [...]
  },
  "saved": false,
  "shift_ids": []
}
```

**Response (Error):**

```json
{
  "error": "AI scheduling not configured. Please set ANTHROPIC_API_KEY environment variable."
}
```

---

## Improvements Made

### 1. Enhanced Error Handling

- Pre-flight AI configuration check
- Specific error messages for different failure modes
- Console logging at each step

### 2. Better User Feedback

- Visual alert when AI is not configured
- Button state changes based on AI availability
- Loading state during configuration check

### 3. Debugging Support

- Comprehensive console logging
- Clear error messages with solutions
- Status endpoint for quick checks

### 4. Graceful Degradation

- Button automatically disables when AI unavailable
- Clear instructions on how to fix configuration
- No silent failures

---

## Support & Contact

For issues not covered in this guide:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test API endpoints directly with curl/Postman
4. Check Supabase dashboard for database issues
5. Review Anthropic console for API usage/errors

---

## Quick Command Reference

```bash
# Check if server is running
curl http://localhost:3000/api/ai/status

# Start development server
npm run dev

# Reseed database
npm run db:seed

# Run tests
npm run test

# Check environment variables (Unix/Mac)
printenv | grep ANTHROPIC

# Check environment variables (Windows)
set ANTHROPIC
```

---

**Last Updated:** 2025-01-11  
**Version:** 1.2.0
