# UI/UX Button Testing Suite

Comprehensive Playwright test suite that systematically tests all 88+ clickable buttons across the ShiftSmart application, verifying API connections and UI functionality.

## 📋 Test Coverage

### Pages Tested:
1. ✅ **Welcome Page** - Navigation and landing
2. ✅ **Login Page** - Authentication flow  
3. ✅ **Signup Page** - User registration
4. ✅ **Dashboard Page** - Stats, calendar, navigation
5. ✅ **Employees Page** - List, search, filter, CRUD
6. ✅ **Employee Detail Page** - Edit, preferences, history
7. ✅ **Schedule Page** - Calendar views, drag-drop, AI generation
8. ✅ **Conflicts Page** - Resolution workflow
9. ✅ **Settings Page** - Profile and preferences

### Total Tests: 50+ button interactions verified

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
│   ├── auth.ts                  # Authentication helpers
│   └── api-interceptor.ts       # API call tracking
└── tests/
    ├── ui-01-welcome-login.spec.ts    # Welcome & Login pages
    ├── ui-02-dashboard.spec.ts        # Dashboard page
    ├── ui-03-employees.spec.ts        # Employees & Employee Detail
    ├── ui-04-schedule.spec.ts         # Schedule page
    ├── ui-05-conflicts.spec.ts         # Conflicts page
    └── ui-06-settings.spec.ts          # Settings page
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

### Shifts
- `GET /api/shifts`
- `GET /api/shifts/upcoming`
- `PATCH /api/shifts/{id}` (drag-drop)

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

Default test credentials (from `tests/e2e/helpers/auth.ts`):
- Email: `gianluca.semeraro@thomsonreuters.com`
- Password: `changeme`

Update in `tests/e2e/helpers/auth.ts` if needed.

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

---

**Created:** October 30, 2025  
**Location:** `~/shiftsmart-v1/tests/e2e/`

