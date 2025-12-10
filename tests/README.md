# ShiftSmart Automated Testing Protocol

**Version:** 1.0.0  
**Date:** October 30, 2025  
**Purpose:** Automated testing to verify frontend-backend integration

---

## Test Suite Overview

### Test Categories

1. **Backend API Tests** - Verify all 24 endpoints work
2. **Integration Tests** - Verify frontend can call backend
3. **Authentication Flow Tests** - Verify login/logout works
4. **Data Flow Tests** - Verify data loads correctly
5. **E2E Tests** - Verify complete user workflows
6. **Role-Based Workflow Tests** - Verify staffer and manager E2E journeys (NEW)

### Test Tools

- **API Testing:** `curl` + bash scripts
- **Integration Testing:** Node.js test scripts
- **E2E Testing:** Playwright (browser automation)
- **Role-Based E2E:** Playwright with multi-user credentials
- **Assertions:** Exit codes and JSON validation

---

## 🧪 Test Scripts

All test scripts are in: `~/shiftsmart-v1/tests/`

### Run All Tests

```bash
cd ~/shiftsmart-v1/tests
./run-all-tests.sh
```

### Test Categories

```bash
./test-api-endpoints.sh      # Test all 24 API endpoints
./test-integration.sh         # Test frontend-backend integration
./test-authentication.sh      # Test login flow
./test-data-flow.sh          # Test data loading
```

---

## Test Results Format

### Success Output

```
✅ TEST PASSED: Login with valid credentials
✅ TEST PASSED: Dashboard loads stats
✅ TEST PASSED: Employees list returns 15 records

===========================================
SUMMARY: 24/24 tests passed (100%)
STATUS: ✅ ALL TESTS PASSED
===========================================
```

### Failure Output

```
❌ TEST FAILED: Login with valid credentials
   Expected: 200 OK
   Got: 401 Unauthorized
   Error: Invalid credentials

===========================================
SUMMARY: 23/24 tests passed (95.8%)
STATUS: ❌ TESTS FAILED
===========================================
```

---

## Test Execution Plan

### Phase 1: Backend API Tests

**Duration:** ~2 minutes  
**Tests:** 24 endpoint tests

1. Auth endpoints (4 tests)
2. Employee endpoints (7 tests)
3. Shift endpoints (6 tests)
4. Conflict endpoints (3 tests)
5. Dashboard endpoints (1 test)
6. AI endpoints (3 tests)

### Phase 2: Integration Tests

**Duration:** ~1 minute  
**Tests:** Frontend API client

1. API client initialization
2. Token management
3. Error handling
4. Response parsing

### Phase 3: E2E Tests (Browser)

**Duration:** ~3 minutes  
**Tests:** Complete user workflows

1. Welcome screen loads
2. Login flow
3. Dashboard displays data
4. Navigation works
5. Logout works

---

## Automated Test Execution

### Continuous Testing

```bash
# Watch mode - runs tests on file changes
npm run test:watch

# Single run
npm test

# With coverage
npm run test:coverage
```

### CI/CD Integration

Tests run automatically on:

- Every commit
- Every pull request
- Every deployment
- Scheduled (daily)

---

## Test Coverage Requirements

### Minimum Coverage

- **API Endpoints:** 100% (all 24)
- **Authentication:** 100%
- **Critical Paths:** 100%
- **UI Components:** 80%
- **Edge Cases:** 70%

### Current Coverage

Will be measured after first test run.

---

## Role-Based Workflow Tests (NEW)

### Overview

Complete E2E tests for the two core user types: **Staffers** and **Team Leaders/Managers**.

### Test Suites

Located in `tests/e2e/tests/workflows/`:

| Suite                  | File                             | Tests | Status | Coverage                                         |
| ---------------------- | -------------------------------- | ----- | ------ | ------------------------------------------------ |
| Staffer Workflow       | `staffer-workflow.spec.ts`       | 25    | ✅     | Login, preferences, time-off, schedule viewing   |
| Manager Workflow       | `manager-workflow.spec.ts`       | 35    | ✅     | Team review, AI scheduling, conflicts, employees |
| Access Control         | `access-control.spec.ts`         | 15+   | ⏳     | Role permission verification                     |
| Cross-Role Integration | `cross-role-integration.spec.ts` | 10+   | ⏳     | Data flow between user types                     |

### Test Configuration Notes

- **Serial Execution**: Workflow tests use `test.describe.configure({ mode: 'serial' })` to prevent parallel login conflicts
- **Dynamic Navigation**: Role-based navigation (Team Availability, Schedule Health) loads after user profile API - use `waitForDynamicNav()` helper
- **Timeouts**: Extended timeouts (10-15s) for API-dependent content
- **Logout Helper**: Uses `{ force: true }` to bypass Next.js dev overlay

### Test Users

| Role    | Email                                  | Password   |
| ------- | -------------------------------------- | ---------- |
| Admin   | `arlyn.gajilan@thomsonreuters.com`     | `testtest` |
| Manager | `gavin.jones@thomsonreuters.com`       | `changeme` |
| Staff   | `gianluca.semeraro@thomsonreuters.com` | `changeme` |

### Running Workflow Tests

```bash
cd tests/e2e

# Run all workflow tests
npx playwright test tests/workflows/

# Run specific suite
npx playwright test tests/workflows/staffer-workflow.spec.ts
npx playwright test tests/workflows/manager-workflow.spec.ts

# Run with UI mode
npx playwright test tests/workflows/ --ui
```

See `tests/e2e/UI_TESTING_README.md` for full documentation.

---

## Next Steps

1. ✅ Create test scripts
2. ✅ Add test data fixtures
3. ✅ Configure test environment
4. ✅ Create role-based workflow tests
5. ✅ Staffer workflow tests (25 tests passing)
6. ✅ Manager workflow tests (35 tests passing)
7. ⏳ Access control tests
8. ⏳ Cross-role integration tests
9. ⏳ Generate coverage report
10. ⏳ Set up CI/CD automation

---

**Ready to run tests!**
