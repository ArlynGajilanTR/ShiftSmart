# ShiftSmart Tester Handoff Guide

**Version:** 1.4.0  
**Date:** December 10, 2025  
**Purpose:** Human testing guide for UAT testers to verify ShiftSmart workflows

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Test Accounts](#test-accounts)
3. [Getting Started](#getting-started)
4. [Staffer Workflow Tests](#staffer-workflow-tests)
5. [Team Leader Workflow Tests](#team-leader-workflow-tests)
6. [Feature Checklist](#feature-checklist)
7. [Feedback Form](#feedback-form)
8. [Known Issues](#known-issues)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

ShiftSmart is an internal scheduling application for Reuters Breaking News editorial teams in Milan and Rome. It features:

- **AI-powered schedule generation** using Claude Haiku 4.5
- **Drag-and-drop scheduling** with conflict detection
- **Availability and time-off management** for staff
- **Team management** for leaders to review and confirm preferences

### User Types

| User Type       | Description                            | Primary Actions                                         |
| --------------- | -------------------------------------- | ------------------------------------------------------- |
| **Staffer**     | Editorial team member who works shifts | Set preferences, enter time-off, view schedule          |
| **Team Leader** | Senior staff who manage scheduling     | Review team, confirm preferences, generate AI schedules |
| **Admin**       | Full system access                     | All features + employee management                      |

---

## Test Accounts

### Admin Account (Full Access)

- **Email:** `arlyn.gajilan@thomsonreuters.com`
- **Password:** `testtest`
- **Bureau:** Rome
- **Role:** Admin + Team Leader

### Team Leaders (Schedule Management)

| Name              | Email                                  | Password   | Bureau |
| ----------------- | -------------------------------------- | ---------- | ------ |
| Sabina Suzzi      | `sabina.suzzi@thomsonreuters.com`      | `changeme` | Milan  |
| Gianluca Semeraro | `gianluca.semeraro@thomsonreuters.com` | `changeme` | Milan  |

### Staff Accounts (For Testing Staffer Workflow)

| Name             | Email                                 | Password   | Bureau | Role                 |
| ---------------- | ------------------------------------- | ---------- | ------ | -------------------- |
| Sara Rossi       | `sara.rossi@thomsonreuters.com`       | `changeme` | Milan  | Senior Correspondent |
| Alvise Armellini | `alvise.armellini@thomsonreuters.com` | `changeme` | Rome   | Senior Correspondent |
| Alessia Pe'      | `alessia.pe@thomsonreuters.com`       | `changeme` | Milan  | Correspondent        |
| Gavin Jones      | `gavin.jones@thomsonreuters.com`      | `changeme` | Rome   | Editor (Manager)     |

---

## Getting Started

### Access the Application

1. **URL:** [http://localhost:3000](http://localhost:3000) (development) or production URL
2. Navigate to the login page
3. Enter credentials from the test accounts table above
4. Click "Log In"

### Verify Successful Login

- [ ] You are redirected to `/dashboard`
- [ ] You see "ShiftSmart" heading
- [ ] Sidebar navigation is visible
- [ ] Statistics cards are displayed (Total Employees, Upcoming Shifts, etc.)

---

## Staffer Workflow Tests

**Test as:** Any staff account (recommended: `sara.rossi@thomsonreuters.com`)

### Test S1: Login and Dashboard Access

**Steps:**

1. Go to login page
2. Enter staffer email and password
3. Click "Log In"

**Expected Results:**

- [ ] Redirected to `/dashboard`
- [ ] See "Total Employees" and "Upcoming Shifts" cards
- [ ] Sidebar shows: Dashboard, Schedule, My Availability, My Time Off, Settings

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test S2: Set Shift Preferences (My Availability)

**Steps:**

1. Click "My Availability" in sidebar
2. Review current preference selections
3. Toggle some preferred days (Mon-Sun checkboxes)
4. Toggle preferred shift types (Morning, Afternoon, Evening, Night)
5. Select max shifts per week from dropdown
6. Add a note (e.g., "Unavailable Tuesdays for childcare")
7. Click "Save Preferences"

**Expected Results:**

- [ ] Page loads with "My Availability" heading
- [ ] Day checkboxes are interactive
- [ ] Shift type checkboxes work
- [ ] Max shifts dropdown works
- [ ] Notes textarea accepts input
- [ ] Save button becomes enabled after changes
- [ ] Success toast appears after saving
- [ ] Status shows "Pending Approval" (if not confirmed by team leader)

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test S3: Enter Time-Off (My Time Off)

**Steps:**

1. Click "My Time Off" in sidebar
2. Click "Add Time Off Entry" button
3. Select a start date (30+ days in future)
4. Select an end date (same or later)
5. Choose type: Vacation, Personal, Sick, or Other
6. Optionally add notes
7. Click "Add Entry"

**Expected Results:**

- [ ] Page loads with "My Time Off" heading
- [ ] Blue info banner explains pre-approval requirement
- [ ] Form appears when clicking add button
- [ ] Date pickers work correctly
- [ ] Type dropdown shows all options
- [ ] Entry appears in list after adding
- [ ] Can delete future entries

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test S4: View Schedule

**Steps:**

1. Click "Schedule" in sidebar
2. Navigate between days/weeks using arrows
3. Click "Today" button
4. Try different view options if available (Week, Month)

**Expected Results:**

- [ ] Schedule page loads
- [ ] Calendar/schedule view displays
- [ ] Navigation arrows work
- [ ] Today button returns to current date
- [ ] Any existing shifts are visible

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test S5: Settings and Profile

**Steps:**

1. Click "Settings" in sidebar
2. Review your profile information
3. Try editing your name or phone number
4. Try changing password (optional)

**Expected Results:**

- [ ] Settings page loads
- [ ] Current profile info is displayed
- [ ] Can edit name/phone
- [ ] Password change form works (if tested)

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test S6: Complete Staffer Journey

**Steps:**

1. Login as staffer
2. Set availability preferences
3. Add a time-off entry
4. View schedule
5. Access settings
6. Logout

**Expected Results:**

- [ ] All pages accessible without errors
- [ ] Data persists across page navigation
- [ ] Logout redirects to login page

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

## Team Leader Workflow Tests

**Test as:** Team leader account (`sabina.suzzi@thomsonreuters.com`) or Admin (`arlyn.gajilan@thomsonreuters.com`)

### Test TL1: Review Team Availability

**Steps:**

1. Login as team leader or admin
2. Click "Team" in sidebar (may show as "Employees" or include Team Management)
3. Navigate to Team Management page (`/dashboard/team`)
4. Review the Availability tab
5. Check stats cards (Total, Confirmed, Pending, Missing)
6. Search for a specific employee
7. Filter by bureau or status

**Expected Results:**

- [ ] Team Management page accessible
- [ ] Stats cards show correct counts
- [ ] Employee table displays all team members
- [ ] Search filter works
- [ ] Bureau filter works
- [ ] Status filter works
- [ ] Can see each employee's preferences

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL2: Confirm Staff Preferences

**Steps:**

1. On Team Management → Availability tab
2. Find an employee with "Pending" status
3. Click the checkmark button to confirm their preferences
4. Try "Confirm All Pending" button

**Expected Results:**

- [ ] Individual confirm button works
- [ ] Loading spinner during confirmation
- [ ] Status changes to "Confirmed" after
- [ ] "Confirm All Pending" opens confirmation dialog
- [ ] Batch confirmation works

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL3: Review Team Time-Off

**Steps:**

1. On Team Management page
2. Click "Time Off" tab
3. Review upcoming time-off entries
4. Check the stats (Total Requests, Employees Off, etc.)

**Expected Results:**

- [ ] Time Off tab is accessible
- [ ] Stats cards show counts by type
- [ ] Table shows all team members' time-off
- [ ] Includes employee name, bureau, dates, type

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL4: Generate AI Schedule

**Steps:**

1. Navigate to Schedule page (`/dashboard/schedule`)
2. Click "Generate Schedule" button
3. Configure generation options:
   - Select period type (Week/Month/Quarter)
   - Select date range
   - Select bureau (Milan/Rome/Both)
4. Click "Generate"
5. Review the preview
6. Either Save or Cancel

**Expected Results:**

- [ ] "Generate Schedule" button visible (team leaders/admins only)
- [ ] Generation dialog opens
- [ ] Can configure all options
- [ ] AI generates schedule (5-15 seconds)
- [ ] Preview shows generated shifts
- [ ] Can see metrics (shifts generated, preference satisfaction)
- [ ] Can save or cancel/regenerate

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL5: Manual Schedule Adjustments

**Steps:**

1. On Schedule page with existing shifts
2. Try clicking on a shift to view details
3. If drag-and-drop is enabled, try moving a shift
4. Try adding a new shift manually (if "Add Shift" button exists)

**Expected Results:**

- [ ] Shifts display correctly
- [ ] Shift details viewable
- [ ] Drag-and-drop works (if enabled)
- [ ] Conflict warnings appear if creating conflicts

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL6: Schedule Health / Conflicts

**Steps:**

1. Navigate to "Schedule Health" (Conflicts page)
2. Review any existing conflicts
3. Check severity levels (High/Medium/Low)
4. Try resolving or acknowledging a conflict (if any exist)

**Expected Results:**

- [ ] Schedule Health page accessible
- [ ] Shows prevented conflicts count
- [ ] Shows active issues
- [ ] Conflict cards display type, severity, description
- [ ] "Resolve with AI" button works

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

### Test TL7: Employee Management

**Steps:**

1. Navigate to Employees page (`/dashboard/employees`)
2. Review employee list
3. Search for an employee
4. Click on an employee to view details
5. Try editing an employee (if editing is enabled)

**Expected Results:**

- [ ] Employees page accessible
- [ ] Table shows all employees
- [ ] Search filter works
- [ ] Can view employee details
- [ ] Bureau/role information displayed

**Notes:**

```
Pass/Fail: ___
Issues Found:

```

---

## Feature Checklist

### Core Features

| Feature                       | Status         | Tested? | Notes |
| ----------------------------- | -------------- | ------- | ----- |
| User Login/Logout             | ✅ Implemented | [ ]     |       |
| Dashboard Statistics          | ✅ Implemented | [ ]     |       |
| My Availability (Preferences) | ✅ Implemented | [ ]     |       |
| My Time Off                   | ✅ Implemented | [ ]     |       |
| Schedule View                 | ✅ Implemented | [ ]     |       |
| Settings/Profile              | ✅ Implemented | [ ]     |       |

### Team Leader Features

| Feature                   | Status         | Tested? | Notes |
| ------------------------- | -------------- | ------- | ----- |
| Team Availability View    | ✅ Implemented | [ ]     |       |
| Confirm Preferences       | ✅ Implemented | [ ]     |       |
| Batch Confirm All         | ✅ Implemented | [ ]     |       |
| Team Time-Off View        | ✅ Implemented | [ ]     |       |
| AI Schedule Generation    | ✅ Implemented | [ ]     |       |
| Schedule Health Dashboard | ✅ Implemented | [ ]     |       |
| Employee Management       | ✅ Implemented | [ ]     |       |

### Export Features

| Feature               | Status       | Tested? | Notes                         |
| --------------------- | ------------ | ------- | ----------------------------- |
| Export ICS (Calendar) | ✅ API Ready | [ ]     | Staff can export their shifts |
| Export PDF (Schedule) | ✅ API Ready | [ ]     | Team leaders can export       |

### AI Features

| Feature                | Status         | Tested? | Notes                   |
| ---------------------- | -------------- | ------- | ----------------------- |
| AI Schedule Generation | ✅ Implemented | [ ]     | Uses Claude Haiku 4.5   |
| AI Conflict Resolution | ✅ Implemented | [ ]     |                         |
| AI Chatbot Guide       | ✅ Implemented | [ ]     | "Ask ShiftSmart" button |

---

## Feedback Form

Please complete this form after testing and return to the development team.

### Tester Information

- **Name:** ******\_\_\_\_******
- **Date Tested:** ******\_\_\_\_******
- **Browser Used:** ******\_\_\_\_******
- **Role Tested:** [ ] Staffer [ ] Team Leader [ ] Admin

### Overall Assessment

1. **Did you successfully complete the staffer workflow?**
   - [ ] Yes, completely
   - [ ] Yes, with some issues
   - [ ] No, blocked by errors

   If issues, describe: ******\_\_\_\_******

2. **Did you successfully complete the team leader workflow?**
   - [ ] Yes, completely
   - [ ] Yes, with some issues
   - [ ] No, blocked by errors
   - [ ] N/A (tested as staffer only)

   If issues, describe: ******\_\_\_\_******

3. **AI Schedule Generation worked as expected?**
   - [ ] Yes
   - [ ] Partially
   - [ ] No
   - [ ] Did not test

   If issues, describe: ******\_\_\_\_******

4. **Rate the overall user experience (1-5):**
   - [ ] 1 - Very Poor
   - [ ] 2 - Poor
   - [ ] 3 - Average
   - [ ] 4 - Good
   - [ ] 5 - Excellent

5. **Most confusing part of the interface:**

   ***

6. **Features that worked well:**

   ***

7. **Bugs or errors encountered (describe with steps to reproduce):**

   ```
   Bug 1:
   Steps:
   Expected:
   Actual:

   Bug 2:
   Steps:
   Expected:
   Actual:
   ```

8. **Suggestions for improvement:**

   ***

9. **Additional comments:**
   ***

---

## Known Issues

### E2E Test Failures (Development Environment)

The following tests occasionally fail due to timeout issues in the CI environment, but **should work correctly when manually tested**:

1. **Login timeout issues** - Development server may be slow to respond; simply retry
2. **Time-off form tests** - The form opens but may need a moment to render

### Functional Notes

1. **Preferences require confirmation** - After a staffer saves preferences, they show as "Pending" until a team leader confirms
2. **Time-off is informational** - The My Time Off feature captures pre-approved dates; it's not a request system
3. **AI schedule generation requires API key** - The ANTHROPIC_API_KEY must be configured for AI features

---

## Troubleshooting

### Cannot Login

1. Verify you're using the correct email (check for typos)
2. Password is case-sensitive (`testtest` for admin, `changeme` for others)
3. Clear browser cache and try again
4. Check if server is running at the correct URL

### Page Not Loading

1. Check browser console for errors (F12)
2. Verify network connectivity
3. Try refreshing the page
4. Log out and log back in

### AI Features Not Working

1. Verify ANTHROPIC_API_KEY is configured in the environment
2. Check `/api/ai/status` endpoint for configuration status
3. AI features require team leader or admin role

### Export Not Working

1. PDF export is only available to team leaders/admins
2. ICS export is available to all users but for their own shifts only
3. Verify there are shifts in the date range you're trying to export

---

## Contact

For questions or issues during testing, contact:

- **Development Team:** [engineering@reuters.com]
- **Project Lead:** Arlyn Gajilan

---

**Thank you for helping us test ShiftSmart!**

_Last Updated: December 10, 2025_
