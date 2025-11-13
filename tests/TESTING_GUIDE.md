# ShiftSmart Automated Testing Suite

## 🧪 Complete Test Coverage

This comprehensive testing suite verifies that your frontend and backend are correctly integrated and working together.

---

## Test Suites

### 1. API Endpoint Tests (24 tests)

**File:** `test-api-endpoints.sh`  
**What it tests:**

- All 24 backend API endpoints
- Authentication flow (login, logout, session)
- Employee CRUD operations (7 endpoints)
- Shift CRUD operations (6 endpoints)
- Conflict management (3 endpoints)
- Dashboard stats (1 endpoint)
- AI endpoints (3 endpoints)

### 2. Integration Tests (7 tests)

**File:** `test-integration.sh`  
**What it tests:**

- Backend API accessibility
- Frontend accessibility
- Authentication token flow
- Token-based API requests
- Data integrity (15 Breaking News employees)
- Dashboard stats API
- CORS configuration

### 3. E2E Tests (15+ tests)

**Files:** `test-e2e.sh` + Playwright specs  
**What it tests:**

- **Authentication (5 tests):**
  - Login page display
  - Invalid credentials rejection
  - Valid credentials acceptance
  - Token storage in localStorage
  - Logout functionality
- **Dashboard (9 tests):**
  - Dashboard stats display
  - Employee count verification (15)
  - Calendar views (week/month/quarter)
  - Upcoming shifts table
  - Conflicts panel
  - Loading states
  - Navigation
  - Error handling
  - Reuters branding
- **API Integration (7 tests):**
  - Employee list fetching
  - Bureau filtering
  - Dashboard stats
  - Upcoming shifts
  - Conflicts list
  - Unauthenticated request rejection
  - Invalid token rejection

---

## 🚀 Running Tests

### Run All Tests

```bash
cd ~/shiftsmart-v1/tests
./run-all-tests.sh
```

### Run Individual Test Suites

#### API Endpoint Tests

```bash
cd ~/shiftsmart-v1/tests
export API_URL="https://your-api.vercel.app"  # Or http://localhost:3000
./test-api-endpoints.sh
```

#### Integration Tests

```bash
cd ~/shiftsmart-v1/tests
export API_URL="http://localhost:3000"
export FRONTEND_URL="http://localhost:3001"
./test-integration.sh
```

#### E2E Tests (Browser Automation)

```bash
# Start both frontend and backend first!
cd ~/v0-frontend && npm run dev &
cd ~/shiftsmart-v1 && npm run dev &

# Then run E2E tests
cd ~/shiftsmart-v1/tests
./test-e2e.sh
```

---

## 📊 Test Output

### Success Output

```
==========================================
ShiftSmart Complete Test Suite
==========================================

═══════════════════════════════════════════
Test Suite 1: API Endpoint Tests
═══════════════════════════════════════════

✅ PASS: Login with valid credentials
✅ PASS: Login with invalid credentials
✅ PASS: Get current session
✅ PASS: Logout
✅ PASS: List all employees
✅ PASS: List employees (Milan)
...

Total Tests: 24
Passed: 24
Failed: 0
Coverage: 100.0%

═══════════════════════════════════════════
Test Suite 2: Integration Tests
═══════════════════════════════════════════

✅ PASS: Backend API is accessible
✅ PASS: Authentication returns token
✅ PASS: Token-based request successful
   ✓ Found 15 employees (expected ≥15)
...

Total Tests: 7
Passed: 7
Failed: 0
Coverage: 100.0%

==========================================
COMPLETE TEST SUITE SUMMARY
==========================================
Total Test Suites: 2
Passed: 2
Failed: 0

╔═══════════════════════════════════════════╗
║                                           ║
║   ✅  ALL TESTS PASSED SUCCESSFULLY!  ✅   ║
║                                           ║
║   Backend and Frontend are connected!     ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### Failure Output

```
❌ FAIL: Login with valid credentials
   Expected: 200, Got: 401
   Response: {"error":"Invalid credentials"}

==========================================
SUMMARY: 23/24 tests passed (95.8%)
STATUS: ❌ TESTS FAILED
==========================================

Failed Tests:
  - Login with valid credentials
```

---

## 🔧 Prerequisites

### For API & Integration Tests

- Backend API running (locally or on Vercel)
- `curl` installed (pre-installed on macOS)
- Bash shell

### For E2E Tests

- Backend API running
- Frontend running
- Node.js and npm installed
- Playwright (auto-installed by test script)

---

## 🎯 What Gets Tested

### Authentication ✅

- [x] Login with valid credentials
- [x] Login with invalid credentials
- [x] Session retrieval
- [x] Token storage
- [x] Token validation
- [x] Logout

### Data Flow ✅

- [x] 15 Breaking News employees exist
- [x] Milan bureau has 8 employees
- [x] Rome bureau has 7 employees
- [x] Employee filtering works
- [x] Dashboard stats are accurate

### API Integration ✅

- [x] All 24 endpoints respond
- [x] Token authentication works
- [x] CORS configured correctly
- [x] Error responses are handled

### UI/UX ✅

- [x] Login page displays correctly
- [x] Dashboard loads data
- [x] Calendar views work
- [x] Navigation functions
- [x] Loading states display
- [x] Error handling works
- [x] Reuters branding applied

---

## 📝 Test Environment Setup

### Local Testing

```bash
# Terminal 1: Backend
cd ~/shiftsmart-v1
npm run dev

# Terminal 2: Frontend
cd ~/v0-frontend
npm run dev

# Terminal 3: Tests
cd ~/shiftsmart-v1/tests
./run-all-tests.sh
```

### Production Testing

```bash
# Test deployed backend
export API_URL="https://your-api.vercel.app"
cd ~/shiftsmart-v1/tests
./test-api-endpoints.sh
```

---

## 🐛 Troubleshooting

### "Connection refused"

**Problem:** Backend or frontend not running  
**Solution:** Start the servers first

### "401 Unauthorized"

**Problem:** Invalid credentials or expired token  
**Solution:** Check test credentials match database

### "404 Not Found"

**Problem:** Endpoint doesn't exist  
**Solution:** Verify API is deployed correctly

### E2E tests fail to start

**Problem:** Playwright not installed  
**Solution:** `cd tests/e2e && npm install && npx playwright install`

---

## 📊 Coverage Report

After running tests, generate a coverage report:

```bash
cd ~/shiftsmart-v1/tests/e2e
npx playwright show-report
```

This opens an HTML report with:

- Test results
- Screenshots of failures
- Video recordings
- Timing information
- Network logs

---

## 🔄 CI/CD Integration

These tests can be integrated into GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd tests && ./run-all-tests.sh
```

---

## ✅ Quick Verification

**To quickly verify everything works:**

```bash
# 1. Test backend is alive
curl https://your-api.vercel.app

# 2. Test authentication
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gianluca.semeraro@thomsonreuters.com","password":"changeme"}'

# 3. Run full test suite
cd ~/shiftsmart-v1/tests
./run-all-tests.sh
```

---

## 📚 Next Steps

1. ✅ Run all tests
2. ✅ Review any failures
3. ✅ Generate coverage report
4. ⏳ Set up CI/CD automation
5. ⏳ Add more E2E scenarios
6. ⏳ Add performance tests

---

**Ready to test? Run `./run-all-tests.sh`!**
