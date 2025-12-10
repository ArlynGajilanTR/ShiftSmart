# ShiftSmart QA Questionnaire

**Version:** 1.0  
**Date:** December 10, 2025  
**Purpose:** Structured Q&A for testers to provide actionable feedback

---

## Instructions

Complete this questionnaire after testing ShiftSmart. Your answers will help us identify issues, prioritize fixes, and refine the MVP before full deployment.

**Rating Scale:**

- 1 = Not working at all
- 2 = Major issues
- 3 = Works with minor issues
- 4 = Works well
- 5 = Works perfectly

---

## Section A: Authentication & Access

### A1. Login Process

**Question:** Were you able to log in successfully with test credentials?

- [ ] Yes, first attempt
- [ ] Yes, after multiple attempts
- [ ] No

**If issues occurred, what error did you see?**

```

```

**Rating (1-5):** \_\_\_

---

### A2. Session Persistence

**Question:** Did your session stay active while navigating between pages?

- [ ] Yes, always stayed logged in
- [ ] Sometimes logged out unexpectedly
- [ ] Frequently logged out

**Rating (1-5):** \_\_\_

---

### A3. Logout Process

**Question:** Did logout work correctly?

- [ ] Yes, returned to login page
- [ ] Stayed on the same page
- [ ] Error occurred

**Rating (1-5):** \_\_\_

---

## Section B: Dashboard

### B1. Dashboard Loading

**Question:** Did the dashboard load and display statistics?

- [ ] Yes, all stats displayed
- [ ] Partially loaded
- [ ] Failed to load

**What statistics did you see?**

```

```

**Rating (1-5):** \_\_\_

---

### B2. Navigation

**Question:** Were all sidebar menu items accessible?

- [ ] Yes, all worked
- [ ] Some items didn't work
- [ ] Navigation was broken

**Which items didn't work (if any)?**

```

```

**Rating (1-5):** \_\_\_

---

## Section C: My Availability (Staffers)

### C1. Page Load

**Question:** Did the My Availability page load correctly?

- [ ] Yes, all elements visible
- [ ] Partially loaded
- [ ] Failed to load

**Rating (1-5):** \_\_\_

---

### C2. Preference Selection

**Question:** Could you select preferred days and shift types?

- [ ] Yes, all checkboxes worked
- [ ] Some didn't respond
- [ ] None worked

**Which days/shifts could you NOT select?**

```

```

**Rating (1-5):** \_\_\_

---

### C3. Saving Preferences

**Question:** Did saving preferences work?

- [ ] Yes, saved successfully with confirmation
- [ ] Saved but no confirmation shown
- [ ] Failed to save

**What message did you see after saving?**

```

```

**Rating (1-5):** \_\_\_

---

### C4. Status Display

**Question:** After saving, what status was displayed?

- [ ] "Pending Approval"
- [ ] "Confirmed"
- [ ] No status shown
- [ ] Error shown

**Rating (1-5):** \_\_\_

---

## Section D: My Time Off

### D1. Page Load

**Question:** Did the My Time Off page load correctly?

- [ ] Yes, with all elements
- [ ] Partially loaded
- [ ] Failed to load

**Rating (1-5):** \_\_\_

---

### D2. Add Time Off Form

**Question:** Could you open the add time-off form?

- [ ] Yes, form appeared
- [ ] Button didn't respond
- [ ] Form was broken

**Rating (1-5):** \_\_\_

---

### D3. Date Selection

**Question:** Did the date pickers work correctly?

- [ ] Yes, could select dates
- [ ] Partially worked
- [ ] Could not select dates

**Rating (1-5):** \_\_\_

---

### D4. Creating Entry

**Question:** Could you create a time-off entry?

- [ ] Yes, entry appeared in list
- [ ] Form submitted but entry didn't appear
- [ ] Error when submitting

**What error message (if any)?**

```

```

**Rating (1-5):** \_\_\_

---

### D5. Entry Management

**Question:** Could you edit or delete existing entries?

- [ ] Yes, both worked
- [ ] Only delete worked
- [ ] Only edit worked
- [ ] Neither worked
- [ ] No entries to test with

**Rating (1-5):** \_\_\_

---

## Section E: Schedule View

### E1. Page Load

**Question:** Did the Schedule page load correctly?

- [ ] Yes, calendar displayed
- [ ] Partially loaded
- [ ] Failed to load

**Rating (1-5):** \_\_\_

---

### E2. Calendar Navigation

**Question:** Could you navigate between dates/weeks?

- [ ] Yes, arrows worked
- [ ] Only forward worked
- [ ] Only backward worked
- [ ] Navigation didn't work

**Rating (1-5):** \_\_\_

---

### E3. View Modes

**Question:** Could you switch between view modes (Week/Month)?

- [ ] Yes, all modes worked
- [ ] Some modes didn't work
- [ ] No view toggle available

**Rating (1-5):** \_\_\_

---

### E4. Shift Display

**Question:** Did existing shifts display correctly?

- [ ] Yes, all shifts visible
- [ ] Some shifts missing
- [ ] No shifts displayed (even if there should be)
- [ ] No shifts in the system

**Rating (1-5):** \_\_\_

---

## Section F: Team Management (Team Leaders Only)

### F1. Access

**Question:** Could you access the Team Management page?

- [ ] Yes, full access
- [ ] Access denied (but I should have access)
- [ ] Page didn't load
- [ ] N/A - tested as staffer

**Rating (1-5):** \_\_\_

---

### F2. Team Availability Table

**Question:** Did the employee availability table load?

- [ ] Yes, all employees displayed
- [ ] Some missing
- [ ] Table didn't load

**Rating (1-5):** \_\_\_

---

### F3. Filters

**Question:** Did search and filter options work?

- [ ] Yes, all filters worked
- [ ] Search worked but bureau filter didn't
- [ ] Bureau filter worked but search didn't
- [ ] Neither worked

**Rating (1-5):** \_\_\_

---

### F4. Confirming Preferences

**Question:** Could you confirm individual staff preferences?

- [ ] Yes, confirmation worked
- [ ] Button didn't respond
- [ ] Error when confirming

**Rating (1-5):** \_\_\_

---

### F5. Batch Confirmation

**Question:** Did "Confirm All Pending" work?

- [ ] Yes, all confirmed
- [ ] Dialog appeared but action failed
- [ ] Button didn't respond

**Rating (1-5):** \_\_\_

---

### F6. Time Off Tab

**Question:** Could you view team time-off entries?

- [ ] Yes, all entries visible
- [ ] Tab didn't load
- [ ] No data shown (unexpectedly)

**Rating (1-5):** \_\_\_

---

## Section G: AI Schedule Generation (Team Leaders Only)

### G1. Generate Button

**Question:** Was the "Generate Schedule" button visible?

- [ ] Yes
- [ ] No (but I'm a team leader/admin)
- [ ] N/A - tested as staffer

**Rating (1-5):** \_\_\_

---

### G2. Generation Dialog

**Question:** Did the generation dialog open correctly?

- [ ] Yes, all options visible
- [ ] Dialog opened but missing options
- [ ] Dialog didn't open

**Rating (1-5):** \_\_\_

---

### G3. AI Generation

**Question:** Did AI schedule generation work?

- [ ] Yes, schedule generated
- [ ] Took too long (>30 seconds)
- [ ] Failed with error
- [ ] Did not test

**If error, what message?**

```

```

**How long did it take (approximately)?**

```

```

**Rating (1-5):** \_\_\_

---

### G4. Preview Quality

**Question:** How was the generated schedule preview?

- [ ] Showed clear, useful information
- [ ] Hard to understand
- [ ] Incomplete information
- [ ] Did not test

**Rating (1-5):** \_\_\_

---

### G5. Saving Schedule

**Question:** Could you save the generated schedule?

- [ ] Yes, saved successfully
- [ ] Saved with warnings
- [ ] Failed to save
- [ ] Did not test

**Rating (1-5):** \_\_\_

---

## Section H: Schedule Health / Conflicts (Team Leaders Only)

### H1. Page Access

**Question:** Could you access the Schedule Health page?

- [ ] Yes
- [ ] No access
- [ ] N/A - tested as staffer

**Rating (1-5):** \_\_\_

---

### H2. Conflict Display

**Question:** Were conflicts displayed correctly?

- [ ] Yes, clear information
- [ ] Hard to understand
- [ ] No conflicts to view

**Rating (1-5):** \_\_\_

---

### H3. AI Resolution

**Question:** Did AI conflict resolution work?

- [ ] Yes, suggested solutions
- [ ] Button didn't work
- [ ] Error occurred
- [ ] No conflicts to test with

**Rating (1-5):** \_\_\_

---

## Section I: Employee Management (Team Leaders Only)

### I1. Page Access

**Question:** Could you access the Employees page?

- [ ] Yes
- [ ] No access
- [ ] N/A - tested as staffer

**Rating (1-5):** \_\_\_

---

### I2. Employee List

**Question:** Did the employee table load correctly?

- [ ] Yes, all employees shown
- [ ] Some missing
- [ ] Failed to load

**Rating (1-5):** \_\_\_

---

### I3. Employee Details

**Question:** Could you view individual employee details?

- [ ] Yes
- [ ] Partially
- [ ] No

**Rating (1-5):** \_\_\_

---

## Section J: Overall Experience

### J1. UI/UX Quality

**Question:** How would you rate the overall interface design?

- [ ] 1 - Very confusing
- [ ] 2 - Somewhat confusing
- [ ] 3 - Adequate
- [ ] 4 - Good
- [ ] 5 - Excellent

---

### J2. Speed/Performance

**Question:** How would you rate the application speed?

- [ ] 1 - Very slow
- [ ] 2 - Slow
- [ ] 3 - Acceptable
- [ ] 4 - Fast
- [ ] 5 - Very fast

---

### J3. Error Messages

**Question:** When errors occurred, were the messages helpful?

- [ ] Yes, clear and actionable
- [ ] Partially helpful
- [ ] Not helpful
- [ ] No errors occurred

---

### J4. Workflow Clarity

**Question:** Was it clear what to do at each step?

- [ ] Yes, very intuitive
- [ ] Mostly clear
- [ ] Somewhat confusing
- [ ] Very confusing

---

### J5. Missing Features

**Question:** What features did you expect but didn't find?

```




```

---

### J6. Top 3 Issues

**Question:** What are the 3 biggest issues you encountered?

**Issue 1:**

```

```

**Issue 2:**

```

```

**Issue 3:**

```

```

---

### J7. Top 3 Positives

**Question:** What are the 3 best things about the application?

**Positive 1:**

```

```

**Positive 2:**

```

```

**Positive 3:**

```

```

---

### J8. Ready for Production?

**Question:** In your opinion, is this application ready for team use?

- [ ] Yes, ready now
- [ ] Yes, after minor fixes
- [ ] Needs significant work
- [ ] Not ready

**Explain:**

```

```

---

### J9. Additional Comments

**Question:** Any other feedback or suggestions?

```




```

---

## Section K: Detailed Bug Reports

Use this section to document any bugs you found with reproducible steps.

### Bug Report 1

**Feature/Page:**

```

```

**Steps to Reproduce:**

```
1.
2.
3.
```

**Expected Result:**

```

```

**Actual Result:**

```

```

**Screenshot/Video Attached:** [ ] Yes [ ] No

---

### Bug Report 2

**Feature/Page:**

```

```

**Steps to Reproduce:**

```
1.
2.
3.
```

**Expected Result:**

```

```

**Actual Result:**

```

```

**Screenshot/Video Attached:** [ ] Yes [ ] No

---

### Bug Report 3

**Feature/Page:**

```

```

**Steps to Reproduce:**

```
1.
2.
3.
```

**Expected Result:**

```

```

**Actual Result:**

```

```

**Screenshot/Video Attached:** [ ] Yes [ ] No

---

## Submission

**Tester Name:** ******\_\_\_\_******

**Test Date:** ******\_\_\_\_******

**Browser & Version:** ******\_\_\_\_******

**Operating System:** ******\_\_\_\_******

**Total Time Spent Testing:** ******\_\_\_\_******

**Email for Follow-up Questions:** ******\_\_\_\_******

---

**Please save this document with your name and date (e.g., `QA_Questionnaire_JohnSmith_2025-12-10.md`) and return to the development team.**

_Thank you for your valuable feedback!_
