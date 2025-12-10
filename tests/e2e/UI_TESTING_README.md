# UI/UX Button Testing Suite

Comprehensive Playwright test suite that systematically tests all 88+ clickable buttons across the ShiftSmart application, verifying API connections and UI functionality.

## 📋 Test Coverage

### Pages Tested

1. ✅ **Welcome Page** - Navigation and landing
2. ✅ **Login Page** - Authentication flow
3. ✅ **Signup Page** - User registration
4. ✅ **Dashboard Page** - Stats, calendar, navigation
5. ✅ **Employees Page** - List, search, filter, CRUD
6. ✅ **Employee Detail Page** - Edit, preferences, history
7. ✅ **Schedule Page** - Calendar views, drag-drop, AI generation
8. ✅ **Conflicts Page** - Resolution workflow
9. ✅ **Settings Page** - Profile and preferences
10. ✅ **My Availability Page** - Personal shift preferences and save flow
11. ✅ **Team Availability Page** - Manager/leader view of team preferences
    - Stats cards (Total Employees, Confirmed, Pending, Missing)
    - Search and filter controls (by name, bureau, status)
    - Individual confirm button with loading state
    - Bulk confirm all preferences
    - Edit employee preferences dialog
    - Client-side pagination (25 employees per page)
12. ✅ **My Time Off Page** - Time-off entry management and migration handling
13. ✅ **ShiftSmart Chatbot** - In-app AI assistant trigger and basic Q&A

### Total Tests: 70+ button interactions verified

### 🆕 Role-Based Workflow Tests

14. ✅ **Staffer Workflow** - Complete end-to-end staffer journey
    - Login and dashboard access
    - Set shift preferences (My Availability)
    - Enter time-off dates (My Time Off)
    - View schedule with "My Shifts" filter
    - Settings and profile access
    - Complete workflow journey test

15. ✅ **Manager Workflow** - Complete end-to-end manager journey (35/35 tests passing)
    - Dashboard with full stats
    - Team availability review and confirmation
    - Team time-off visibility
    - AI schedule generation
    - Drag-and-drop schedule editing
    - Conflict resolution
    - Employee management
    - Complete workflow journey test

16. ✅ **Access Control** - Role-based permission verification (26/26 tests passing)
    - Staffer page access restrictions
    - Manager feature visibility
    - Admin full access
    - Unauthenticated user redirects
    - API access control
    - Cross-role feature matrix

17. ✅ **Cross-Role Integration** - Data flow between user types (12/12 tests passing)
    - Staffer preferences → Manager visibility
    - Manager schedule → Staffer view
    - Data consistency across sessions
    - Workflow handoff points (preference → schedule, time-off → exclusion)
    - Real-time data sync
    - Multi-bureau visibility

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Application running on `http://localhost:3000`
- Backend API accessible

### Installation

```bash
cd ~/shiftsmart-v1

# Install Playwright (if not already installed)
npm install -D @playwright/test

# Install browsers
npx playwright install chromium
```

### Running Tests

```bash
# Run all UI tests
npm run test tests/e2e/tests/ui-*.spec.ts

# Run specific test file
npm run test tests/e2e/tests/ui-02-dashboard.spec.ts

# Run in headed mode (see browser)
npm run test:headed tests/e2e/tests/ui-*.spec.ts

# Run in debug mode
npm run test:debug tests/e2e/tests/ui-*.spec.ts

# Run in UI mode
npm run test:ui
```

### View Test Report

```bash
npm run test:report
```

## 📁 Test Structure

```
tests/e2e/
├── playwright.config.ts          # Playwright configuration
├── helpers/
│   ├── auth.ts                  # Authentication helpers (legacy)
│   ├── test-users.ts            # Multi-role test user credentials
│   └── api-interceptor.ts       # API call tracking
└── tests/
    ├── ui-01-welcome-login.spec.ts    # Welcome & Login pages
    ├── ui-02-dashboard.spec.ts        # Dashboard page
    ├── ui-03-employees.spec.ts        # Employees & Employee Detail
    ├── ui-04-schedule.spec.ts         # Schedule page
    ├── ui-05-conflicts.spec.ts        # Conflicts page
    ├── ui-06-settings.spec.ts         # Settings page
    ├── ui-07-my-availability.spec.ts  # My Availability page
    ├── ui-08-team-availability.spec.ts# Team Availability page
    ├── ui-09-my-time-off.spec.ts      # My Time Off page
    ├── ui-10-chatbot.spec.ts          # ShiftSmart chatbot assistant
    ├── drag-drop-conflict.spec.ts     # Drag-and-drop with conflict handling
    ├── api-integration.spec.ts        # API integration tests
    └── workflows/                     # 🆕 Role-based workflow tests
        ├── staffer-workflow.spec.ts       # Complete staffer E2E journey
        ├── manager-workflow.spec.ts       # Complete manager E2E journey
        ├── access-control.spec.ts         # Role permission verification
        └── cross-role-integration.spec.ts # Data flow between roles
```

## 🔍 What Tests Verify

For each button/test, we verify:

1. ✅ **Visibility** - Button is visible and accessible
2. ✅ **Clickability** - Button responds to clicks
3. ✅ **API Calls** - Correct endpoint called with proper data
4. ✅ **Navigation** - Correct page routing
5. ✅ **State Updates** - UI updates after actions
6. ✅ **Error Handling** - Error states display correctly
7. ✅ **Loading States** - Spinners and disabled states work
8. ✅ **Toast Notifications** - Success/error messages appear

## 📊 API Endpoints Verified

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`

### Employees

- `GET /api/employees`
- `GET /api/employees/{id}`
- `PUT /api/employees/{id}`
- `PUT /api/employees/{id}/preferences`
- `POST /api/employees/{id}/preferences/confirm`

### Team Availability

- `GET /api/team/availability` - List all employees with preference status
- `POST /api/team/availability` - Bulk confirm all pending preferences

### Shifts

- `GET /api/shifts`
- `GET /api/shifts/upcoming`
- `PATCH /api/shifts/{id}` (drag-drop move)
- `PATCH /api/shifts/{id}?validate_only=true` (conflict validation)
- `PATCH /api/shifts/{id}` with `force=true` (force move despite conflicts)

### Conflicts

- `GET /api/conflicts`
- `PATCH /api/conflicts/{id}` (resolve/acknowledge)
- `DELETE /api/conflicts/{id}`

### Dashboard

- `GET /api/dashboard/stats`

### AI Scheduling

- `POST /api/ai/generate-schedule`

## 🛠️ Configuration

### Environment Variables

Ensure your environment has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Test Credentials

Default test credentials are defined in `tests/e2e/helpers/test-users.ts`:

**Admin User:**

- Email: `arlyn.gajilan@thomsonreuters.com`
- Password: `testtest`

**Manager User:**

- Email: `gavin.jones@thomsonreuters.com`
- Password: `changeme`

**Staff User (Milan):**

- Email: `sara.rossi@thomsonreuters.com`
- Password: `changeme`

**Staff User (Rome):**

- Email: `alvise.armellini@thomsonreuters.com`
- Password: `changeme`

For role-based tests, use the helper functions from `test-users.ts`:

```typescript
import { loginAsAdmin, loginAsManager, loginAsStaffer } from '../helpers/test-users';
```

## 📝 Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ApiInterceptor } from '../helpers/api-interceptor';

test.describe('My Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/my-page');
  });

  test('My button works', async ({ page }) => {
    const apiInterceptor = new ApiInterceptor(page);
    await apiInterceptor.start();

    // Click button
    await page.click('button:has-text("My Button")');

    // Verify API call
    const apiCall = apiInterceptor.getLatestCall(/\/api\/my-endpoint/);
    expect(apiCall).not.toBeNull();

    await apiInterceptor.stop();
  });
});
```

## 🔧 Troubleshooting

### Tests fail with "Application not accessible"

- Ensure dev server is running: `npm run dev`
- Check port 3000 is available
- Verify backend is running

### API calls not intercepted

- Verify backend is running
- Check API URL configuration
- Ensure auth token is present

### Timeout errors

- Increase timeout in `playwright.config.ts`
- Check network latency
- Verify backend response times

### Parallel execution login conflicts

- Use `test.describe.configure({ mode: 'serial' })` at file level
- Tests that share auth state should run sequentially
- **IMPORTANT**: Run test suites sequentially (one at a time), not in parallel
- Running multiple serial suites simultaneously causes server overload and login timeouts
- See `manager-workflow.spec.ts` for example

### Dynamic navigation not found (Team Availability, Schedule Health)

- Role-based navigation loads after user profile API call
- Use `waitForDynamicNav()` helper before navigating
- Increase timeout for `getByRole('link')` assertions to 15s+

### Next.js dev overlay intercepting clicks

- Use `{ force: true }` option in click actions
- Example: `await button.click({ force: true })`

### Element locator ambiguity

- Use `getByRole()` instead of `text=` selectors
- Add `.first()` when multiple matches expected
- Use `{ exact: true }` for precise name matching
- Verify actual UI text matches test expectations (e.g., "Preferred Shift Types" not "Preferred Shifts")

### Test suite execution strategy

- **Sequential suite execution**: Run workflow test suites one at a time
- When run sequentially, all tests pass (98/98 total: 25 staffer + 35 manager + 26 access + 12 cross-role)
- Parallel suite execution causes server overload and cascading timeouts
- Individual test files use serial mode internally to prevent login conflicts

---

**Created:** October 30, 2025  
**Location:** `~/shiftsmart-v1/tests/e2e/`
