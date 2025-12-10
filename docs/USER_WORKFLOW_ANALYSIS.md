# ShiftSmart User Workflow Analysis

**Version:** 1.0.0  
**Date:** December 10, 2025  
**Branch:** `investigation/user-workflow-analysis`  
**Author:** AI Investigation

---

## Executive Summary

This document analyzes the ideal workflows for ShiftSmart's two primary user personas—**Staffers** and **Managers**—and maps them against the current implementation. The analysis reveals **significant feature gaps** that prevent delivery of core MVP functionality, particularly around schedule export/sharing and notification systems.

**Key Finding:** The current codebase lacks articulated end-to-end workflow documentation. While individual features exist, there is no unified view of how users accomplish their goals from start to finish.

---

## Table of Contents

1. [User Personas](#user-personas)
2. [Staffer Workflow Analysis](#staffer-workflow-analysis)
3. [Manager Workflow Analysis](#manager-workflow-analysis)
4. [Feature Gap Matrix](#feature-gap-matrix)
5. [Architectural Issues](#architectural-issues)
6. [Recommendation: Workflow Documentation](#recommendation-workflow-documentation)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Risk Assessment](#risk-assessment)

---

## User Personas

### Persona 1: Staffer (Editorial Staff)

**Role:** Staff member in the Breaking News team (Milan or Rome bureau)  
**System Role:** `staff`  
**Editorial Roles:** `correspondent`, `senior`, `editor`

**Goals:**

- Submit shift preferences and availability
- Record pre-approved time off
- View assigned shifts
- **Download schedule to Outlook calendar**
- Get notified of schedule changes

**Pain Points (Current):**

- Cannot export schedule to calendar applications
- No dedicated "My Schedule" view
- No notifications for new assignments

### Persona 2: Manager (Team Leader/Admin)

**Role:** Team leader, scheduler, or administrator  
**System Role:** `admin`, `manager`, `scheduler`, or `is_team_leader: true`

**Goals:**

- Review and approve staffer shift preferences
- **Batch approve time-off requests**
- Generate AI-optimized schedules (weekly, monthly, quarterly)
- Fine-tune schedules via drag-and-drop
- **Share schedule as PDF**
- Resolve scheduling conflicts

**Pain Points (Current):**

- Time-off is "pre-approved" model—no approval workflow exists
- Cannot export schedules to PDF
- Cannot share schedules electronically
- No bulk operations for time-off management

---

## Staffer Workflow Analysis

### Ideal Staffer Journey

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        STAFFER END-TO-END WORKFLOW                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. ONBOARDING                                                               │
│     ┌─────────┐    ┌─────────────┐    ┌─────────────┐                        │
│     │  Login  │───▶│ Set Profile │───▶│ Set Avail-  │                        │
│     │         │    │             │    │ ability     │                        │
│     └─────────┘    └─────────────┘    └─────────────┘                        │
│                                                                               │
│  2. REGULAR USE                                                              │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐            │
│     │ Enter Time  │───▶│ View My     │───▶│ Download to Outlook │            │
│     │ Off Dates   │    │ Schedule    │    │ (.ics export)       │            │
│     └─────────────┘    └─────────────┘    └─────────────────────┘            │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────────┐                                   │
│                    │ Receive Notification│  (when schedule changes)          │
│                    │ of New Assignment   │                                   │
│                    └─────────────────────┘                                   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Current Implementation Status

| Step | Feature             | Status         | Location                                              |
| ---- | ------------------- | -------------- | ----------------------------------------------------- |
| 1a   | Login               | ✅ Complete    | `/login`                                              |
| 1b   | Set Profile         | ✅ Complete    | `/dashboard/settings`                                 |
| 1c   | Set Availability    | ✅ Complete    | `/dashboard/my-availability`                          |
| 2a   | Enter Time Off      | ✅ Complete    | `/dashboard/my-time-off`                              |
| 2b   | View My Schedule    | ⚠️ Partial     | `/dashboard/schedule` (shared view, not personalized) |
| 2c   | Download to Outlook | ❌ **Missing** | Not implemented                                       |
| 2d   | Notifications       | ❌ **Missing** | Not implemented                                       |

### Missing Features for Staffers

#### 1. Calendar Export (.ics)

**What it should do:**

- Export user's assigned shifts to iCalendar format
- One-click download or "Add to Outlook" button
- Include shift details (time, bureau, role)

**Current state:** No export functionality exists

**Technical scope:**

- Create `/api/shifts/export/ics` endpoint
- Generate `.ics` file format
- Add "Download to Calendar" button to UI

#### 2. My Schedule View

**What it should do:**

- Show only the logged-in user's shifts
- Filter by date range
- Highlight upcoming shifts

**Current state:** Users see the full team schedule

**Technical scope:**

- Add filter to Schedule page for `employee_id = current_user.id`
- Or create dedicated `/dashboard/my-schedule` page

#### 3. Notifications

**What it should do:**

- Notify users when they're assigned to a new shift
- Alert for schedule changes affecting their shifts
- Email and/or in-app notifications

**Current state:** No notification system

**Technical scope:**

- Create notifications table
- Implement email service (SendGrid/Resend)
- Add in-app notification UI

---

## Manager Workflow Analysis

### Ideal Manager Journey

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        MANAGER END-TO-END WORKFLOW                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. PREPARATION (Start of Schedule Period)                                   │
│     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐           │
│     │ Review Staff   │───▶│ Batch Approve  │───▶│ Review Team    │           │
│     │ Preferences    │    │ Time-Off       │    │ Availability   │           │
│     └────────────────┘    └────────────────┘    └────────────────┘           │
│                                                                               │
│  2. SCHEDULE GENERATION                                                      │
│     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐           │
│     │ Select Period  │───▶│ AI Generate    │───▶│ Review Preview │           │
│     │ (Week/Mo/Qtr)  │    │ Schedule       │    │                │           │
│     └────────────────┘    └────────────────┘    └────────────────┘           │
│                                                                               │
│  3. FINE-TUNING                                                              │
│     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐           │
│     │ Drag & Drop    │───▶│ Resolve        │───▶│ Approve/Save   │           │
│     │ Adjustments    │    │ Conflicts      │    │ Schedule       │           │
│     └────────────────┘    └────────────────┘    └────────────────┘           │
│                                                                               │
│  4. DISTRIBUTION                                                             │
│     ┌────────────────┐    ┌────────────────┐                                 │
│     │ Export as PDF  │───▶│ Share/Email    │                                 │
│     │                │    │ to Team        │                                 │
│     └────────────────┘    └────────────────┘                                 │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Current Implementation Status

| Step | Feature                  | Status         | Location                             |
| ---- | ------------------------ | -------------- | ------------------------------------ |
| 1a   | Review Preferences       | ✅ Complete    | `/dashboard/team` (Availability tab) |
| 1b   | Batch Approve Time-Off   | ❌ **N/A**     | Time-off is "pre-approved" model     |
| 1c   | Review Team Availability | ✅ Complete    | `/dashboard/team`                    |
| 2a   | Select Period            | ✅ Complete    | AI Generate dialog                   |
| 2b   | AI Generate Schedule     | ✅ Complete    | `/api/ai/generate-schedule`          |
| 2c   | Review Preview           | ✅ Complete    | Preview in UI                        |
| 3a   | Drag & Drop              | ✅ Complete    | `/dashboard/schedule`                |
| 3b   | Resolve Conflicts        | ✅ Complete    | `/dashboard/conflicts`               |
| 3c   | Save Schedule            | ✅ Complete    | `/api/ai/save-schedule`              |
| 4a   | Export as PDF            | ❌ **Missing** | Not implemented                      |
| 4b   | Share/Email              | ❌ **Missing** | Not implemented                      |

### Missing Features for Managers

#### 1. Time-Off Approval Workflow

**Current Architecture Issue:**

The current system uses a **"pre-approved" model** where staffers record time off that has ALREADY been approved through external channels. The UI explicitly states:

> "Only enter time-off dates that have already been approved through your bureau's official leave system."

**What users expect:**

- Staffers submit time-off _requests_
- Managers review and approve/deny
- Batch approve multiple requests

**Gap:** No approval workflow exists—by design

**Decision needed:**

- Option A: Keep pre-approved model (current)
- Option B: Build full approval workflow

#### 2. PDF Export

**What it should do:**

- Export schedule to PDF format
- Include all shifts for a date range
- Professional layout for printing/sharing

**Current state:** No export functionality

**Technical scope:**

- Implement PDF generation (react-pdf or server-side)
- Create `/api/shifts/export/pdf` endpoint
- Add "Export PDF" button to Schedule page

#### 3. Share Schedule

**What it should do:**

- Email PDF to all team members
- Or generate shareable link
- Include summary and shift list

**Current state:** No sharing functionality

**Technical scope:**

- Implement email service
- Create shareable links with view tokens
- Add "Share" button/dialog

---

## Feature Gap Matrix

### Priority Legend

- 🔴 **Critical** - Blocks core MVP value proposition
- 🟡 **High** - Significant user experience impact
- 🟢 **Medium** - Nice to have for MVP

### Staffer Features

| Feature                    | Status     | Priority    | Effort   | Notes                  |
| -------------------------- | ---------- | ----------- | -------- | ---------------------- |
| Login/Auth                 | ✅ Done    | -           | -        | Working                |
| Set Preferences            | ✅ Done    | -           | -        | Working                |
| Time Off Entry             | ✅ Done    | -           | -        | Working                |
| View Full Schedule         | ✅ Done    | -           | -        | Working                |
| **My Schedule View**       | ❌ Missing | 🟡 High     | 2-3 days | Add filter/page        |
| **Calendar Export (.ics)** | ❌ Missing | 🔴 Critical | 3-5 days | New endpoint + UI      |
| **Notifications**          | ❌ Missing | 🟢 Medium   | 5-7 days | Requires email service |

### Manager Features

| Feature                 | Status     | Priority    | Effort   | Notes                   |
| ----------------------- | ---------- | ----------- | -------- | ----------------------- |
| Review Team Preferences | ✅ Done    | -           | -        | Working                 |
| Confirm Preferences     | ✅ Done    | -           | -        | Individual + batch      |
| View Team Time-Off      | ✅ Done    | -           | -        | Read-only               |
| AI Schedule Generation  | ✅ Done    | -           | -        | Working well            |
| Drag & Drop Editing     | ✅ Done    | -           | -        | With conflict detection |
| Conflict Resolution     | ✅ Done    | -           | -        | AI-assisted             |
| **PDF Export**          | ❌ Missing | 🔴 Critical | 3-5 days | New feature             |
| **Share Schedule**      | ❌ Missing | 🔴 Critical | 3-5 days | Email/link sharing      |
| **Time-Off Approval**   | ❌ N/A     | 🟡 Decision | 5-7 days | Architectural decision  |

---

## Architectural Issues

### Issue 1: No Export Infrastructure

**Problem:** The application has no capability to export data in consumable formats (PDF, ICS, CSV for schedules).

**Impact:**

- Staffers cannot integrate with their calendar apps
- Managers cannot share finalized schedules externally
- Limits adoption in enterprise environment

**Root Cause:** Focus was on CRUD operations and AI generation; export was explicitly marked "Out of Scope" in MVP_REQUIREMENTS.md

### Issue 2: Pre-Approved Time-Off Model

**Problem:** Time-off is treated as informational data entry, not a workflow.

**Current Design:**

```
Staffer → Enter pre-approved dates → Data stored → AI respects dates
```

**Expected Design (by user):**

```
Staffer → Submit request → Manager reviews → Approve/Deny → Data stored
```

**Impact:** The "batch approve" workflow requested is fundamentally incompatible with current design.

**Architectural Decision Required:**

- If approval workflow is needed, requires:
  - New `status` field on `time_off_requests` table
  - New approval API endpoints
  - Updated UI for approval workflow
  - Notification system for approvals

### Issue 3: No Notification System

**Problem:** No mechanism to notify users of events (new assignments, schedule changes, approvals).

**Impact:**

- Users must actively check the app for updates
- No push notifications or emails
- Reduces real-time utility

**Required Infrastructure:**

- Email service integration (SendGrid, Resend, etc.)
- Notification preferences table
- Background job system for sending
- Optional: WebSocket for real-time in-app notifications

### Issue 4: Missing User-Centric Views

**Problem:** Schedule views are team-centric, not user-centric.

**Example:** `/dashboard/schedule` shows ALL shifts, not "my shifts"

**Impact:** Staffers must visually scan for their own assignments.

---

## Recommendation: Workflow Documentation

### Assessment: Is Articulated Workflow Documentation Needed?

**Answer: YES**

**Reasons:**

1. **No central reference** - Current docs describe features in isolation, not user journeys
2. **Feature gaps are not obvious** - Without workflow mapping, missing features aren't visible
3. **Development alignment** - Team needs shared understanding of what "done" means
4. **User testing baseline** - Cannot validate UX without documented expected flows
5. **Future planning** - Roadmap should align with completing workflow gaps

### Recommended Documentation Structure

Create the following artifacts:

1. **User Journey Maps** (per persona)
   - Step-by-step workflow with branching
   - Emotional journey annotations
   - Pain points and opportunities

2. **Feature Requirements** (per workflow step)
   - Functional requirements
   - Acceptance criteria
   - API contracts

3. **Swimlane Diagrams** (for multi-actor workflows)
   - Time-off approval (if implemented)
   - Schedule generation → approval → distribution

---

## Implementation Roadmap

### Phase 1: Critical Export Features (2 weeks)

**Objective:** Enable schedule distribution—the core value proposition

| Task                                 | Effort | Dependencies |
| ------------------------------------ | ------ | ------------ |
| 1.1 PDF Export API                   | 3 days | None         |
| 1.2 PDF Export UI                    | 2 days | 1.1          |
| 1.3 ICS Calendar Export API          | 2 days | None         |
| 1.4 ICS Export UI ("Add to Outlook") | 1 day  | 1.3          |
| 1.5 Testing & QA                     | 2 days | 1.1-1.4      |

**Deliverables:**

- `POST /api/shifts/export/pdf` - Generate PDF schedule
- `GET /api/shifts/export/ics` - Generate ICS calendar file
- UI buttons on Schedule page

### Phase 2: User-Centric Views (1 week)

**Objective:** Staffers can see their own schedule easily

| Task                                      | Effort | Dependencies |
| ----------------------------------------- | ------ | ------------ |
| 2.1 "My Schedule" filter on Schedule page | 2 days | None         |
| 2.2 OR dedicated My Schedule page         | 3 days | None         |
| 2.3 Personal shift count in dashboard     | 1 day  | None         |
| 2.4 Testing & QA                          | 1 day  | 2.1-2.3      |

### Phase 3: Notification System (2 weeks)

**Objective:** Users receive alerts for relevant events

| Task                                | Effort | Dependencies |
| ----------------------------------- | ------ | ------------ |
| 3.1 Email service integration       | 2 days | None         |
| 3.2 Notification preferences table  | 1 day  | None         |
| 3.3 Email templates                 | 2 days | 3.1          |
| 3.4 Trigger notifications on events | 3 days | 3.1-3.3      |
| 3.5 In-app notification UI          | 2 days | 3.2          |

**Events to notify:**

- New shift assignment
- Shift change/cancellation
- Preference confirmation
- Schedule published

### Phase 4 (Optional): Time-Off Approval Workflow (2 weeks)

**Objective:** Transform from "pre-approved entry" to "request → approval" model

⚠️ **Decision Required:** This is a significant architectural change. Recommend stakeholder review before implementation.

| Task                           | Effort   | Dependencies |
| ------------------------------ | -------- | ------------ |
| 4.1 Add status field migration | 0.5 days | None         |
| 4.2 Approval API endpoints     | 2 days   | 4.1          |
| 4.3 Manager approval UI        | 3 days   | 4.2          |
| 4.4 Staffer request status UI  | 2 days   | 4.2          |
| 4.5 Approval notifications     | 2 days   | Phase 3      |
| 4.6 Testing & QA               | 2 days   | All          |

---

## Risk Assessment

### Technical Risks

| Risk                        | Probability | Impact | Mitigation                                |
| --------------------------- | ----------- | ------ | ----------------------------------------- |
| PDF generation complexity   | Medium      | Medium | Use proven library (react-pdf, puppeteer) |
| ICS format edge cases       | Low         | Low    | Test with multiple calendar apps          |
| Email deliverability        | Medium      | High   | Use established service (SendGrid)        |
| Time-off workflow migration | High        | High   | Thorough planning, migration scripts      |

### Business Risks

| Risk                           | Probability | Impact | Mitigation                           |
| ------------------------------ | ----------- | ------ | ------------------------------------ |
| Feature creep extends timeline | High        | Medium | Strict phase boundaries              |
| User expectations exceed scope | Medium      | Medium | Clear communication                  |
| Approval workflow not needed   | Medium      | Medium | Validate requirement before building |

### Timeline Risks

| Risk                            | Probability | Impact | Mitigation                           |
| ------------------------------- | ----------- | ------ | ------------------------------------ |
| Phase 1 exceeds 2 weeks         | Low         | Medium | PDF/ICS are well-understood problems |
| Phase 3 (notifications) complex | Medium      | Medium | Start with email only, defer in-app  |
| Dependencies between phases     | Low         | Low    | Phases designed to be independent    |

---

## Summary & Next Steps

### Summary of Findings

1. **No workflow documentation exists** in the current codebase
2. **Critical export features are missing**: PDF and ICS export
3. **Notification system is absent**: Users cannot receive alerts
4. **Time-off model mismatch**: Pre-approved vs. approval workflow
5. **User-centric views lacking**: No "My Schedule" focus

### Recommended Actions

1. ✅ **Create this workflow analysis document** (Done)
2. 🔜 **Stakeholder review** - Validate time-off model decision
3. 🔜 **Phase 1 kickoff** - Export features (highest value)
4. 🔜 **Update MVP_REQUIREMENTS.md** - Move exports from "Out of Scope" to "In Scope"

### Estimated Total Timeline

| Phase                      | Duration | Cumulative |
| -------------------------- | -------- | ---------- |
| Phase 1: Exports           | 2 weeks  | 2 weeks    |
| Phase 2: My Schedule       | 1 week   | 3 weeks    |
| Phase 3: Notifications     | 2 weeks  | 5 weeks    |
| Phase 4: Time-Off Approval | 2 weeks  | 7 weeks    |

**Minimum MVP completion (Phases 1-2):** 3 weeks  
**Full feature completion (Phases 1-4):** 7 weeks

---

## Appendix: Current Documentation References

| Document                             | Coverage             | Gap                         |
| ------------------------------------ | -------------------- | --------------------------- |
| `PRD.md`                             | User roles, features | No workflow mapping         |
| `MVP_REQUIREMENTS.md`                | Scope definition     | Exports marked out of scope |
| `ARCHITECTURE.md`                    | Technical structure  | No user flows               |
| `README.md`                          | Feature overview     | No journey documentation    |
| `docs/FRONTEND_INTEGRATION_GUIDE.md` | API integration      | No workflow context         |

---

**Document Status:** COMPLETE  
**Next Review:** After stakeholder feedback on time-off model decision
