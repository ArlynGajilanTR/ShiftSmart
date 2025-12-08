# ShiftSmart Remediation Roadmap

> Generated from comprehensive codebase examination on December 8, 2025

## Overview

This document outlines a phased approach to address all issues identified during the ShiftSmart application audit. Each phase is designed to be completed in a single development session with its own git branch, automated testing protocol, and handoff documentation.

---

## Issues Summary

| ID      | Issue                                                   | Severity    | Phase |
| ------- | ------------------------------------------------------- | ----------- | ----- |
| BUG-001 | Signup API parameter mismatch (`bureau_id` vs `bureau`) | 🔴 Critical | 1     |
| BUG-002 | Settings page uses hardcoded data, not wired to API     | 🟡 Medium   | 2     |
| BUG-003 | Chatbot API missing authentication verification         | 🟡 Medium   | 3     |
| DOC-001 | README version mismatch (claims Next.js 16/React 19)    | 🟢 Low      | 3     |

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REMEDIATION PHASES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Critical Auth Fix         Phase 2: Settings Page              │
│  ┌─────────────────────┐            ┌─────────────────────┐             │
│  │ fix/signup-bureau   │ ────────▶  │ feat/settings-api   │             │
│  │                     │            │                     │             │
│  │ • Fix signup API    │            │ • User profile API  │             │
│  │ • Add signup tests  │            │ • Password change   │             │
│  │ • E2E signup flow   │            │ • Wire settings UI  │             │
│  └─────────────────────┘            └─────────────────────┘             │
│           │                                    │                         │
│           ▼                                    ▼                         │
│  Phase 3: Security & Documentation                                       │
│  ┌─────────────────────────────────────────────┐                        │
│  │ fix/security-docs                           │                        │
│  │                                             │                        │
│  │ • Add chatbot auth   • Fix README versions  │                        │
│  │ • Security audit     • Update API docs      │                        │
│  └─────────────────────────────────────────────┘                        │
│                         │                                                │
│                         ▼                                                │
│                   [Merge to main]                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Critical Authentication Fix

**Branch:** `fix/signup-bureau`  
**Priority:** 🔴 Critical  
**Estimated Time:** 1-2 hours  
**Handoff Document:** `docs/handoffs/PHASE_1_HANDOFF.md`

### Scope

- Fix the signup API parameter mismatch between frontend and backend
- Ensure new user registration works end-to-end

### Success Criteria

- [ ] All automated signup tests pass
- [ ] Manual smoke test: Can register a new user via UI
- [ ] No regressions in existing auth flows

### Testing Protocol

1. Unit tests for signup API route
2. Integration test for full signup flow
3. E2E test for signup page

---

## Phase 2: Settings Page Implementation

**Branch:** `feat/settings-api`  
**Priority:** 🟡 Medium  
**Estimated Time:** 2-3 hours  
**Handoff Document:** `docs/handoffs/PHASE_2_HANDOFF.md`  
**Prerequisite:** Phase 1 completed and merged

### Scope

- Create user profile update API endpoint
- Create password change API endpoint
- Wire settings page to real APIs
- Load current user data on mount

### Success Criteria

- [ ] All automated settings tests pass
- [ ] Users can update their profile information
- [ ] Users can change their password
- [ ] Form validation works correctly

### Testing Protocol

1. Unit tests for profile update API
2. Unit tests for password change API
3. Integration tests for settings page
4. E2E test for settings workflow

---

## Phase 3: Security & Documentation

**Branch:** `fix/security-docs`  
**Priority:** 🟡 Medium  
**Estimated Time:** 1-2 hours  
**Handoff Document:** `docs/handoffs/PHASE_3_HANDOFF.md`  
**Prerequisite:** Phase 2 completed and merged

### Scope

- Add authentication to chatbot API
- Fix README version numbers
- Update API_REFERENCE.md with new endpoints
- Final security audit

### Success Criteria

- [ ] Chatbot API requires authentication
- [ ] All documentation is accurate
- [ ] Security advisory check passes
- [ ] All tests pass

### Testing Protocol

1. Unit test for chatbot auth
2. Documentation linting
3. Full regression test suite

---

## Branch Strategy

```bash
main
 │
 ├── fix/signup-bureau (Phase 1)
 │   └── PR → main (after tests pass)
 │
 ├── feat/settings-api (Phase 2, from updated main)
 │   └── PR → main (after tests pass)
 │
 └── fix/security-docs (Phase 3, from updated main)
     └── PR → main (after tests pass)
```

---

## Testing Commands Reference

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:api           # API route tests
npm run test:e2e           # End-to-end tests

# Run tests for specific phase
npm test -- --testPathPattern="signup"      # Phase 1
npm test -- --testPathPattern="settings"    # Phase 2
npm test -- --testPathPattern="chatbot"     # Phase 3

# Run with coverage
npm test -- --coverage
```

---

## Handoff Document Location

All handoff documents are stored in `docs/handoffs/`:

| Phase | Document             | Purpose                 |
| ----- | -------------------- | ----------------------- |
| 1     | `PHASE_1_HANDOFF.md` | Context for Phase 2     |
| 2     | `PHASE_2_HANDOFF.md` | Context for Phase 3     |
| 3     | `PHASE_3_HANDOFF.md` | Final completion report |

---

## Quick Start for Each Phase

### Starting Phase 1

```bash
git checkout main
git pull origin main
git checkout -b fix/signup-bureau
# Read: docs/handoffs/PHASE_1_HANDOFF.md
```

### Starting Phase 2

```bash
git checkout main
git pull origin main  # After Phase 1 merged
git checkout -b feat/settings-api
# Read: docs/handoffs/PHASE_2_HANDOFF.md
```

### Starting Phase 3

```bash
git checkout main
git pull origin main  # After Phase 2 merged
git checkout -b fix/security-docs
# Read: docs/handoffs/PHASE_3_HANDOFF.md
```

---

## Version History

| Version | Date       | Author   | Changes                  |
| ------- | ---------- | -------- | ------------------------ |
| 1.0     | 2025-12-08 | AI Audit | Initial roadmap creation |
