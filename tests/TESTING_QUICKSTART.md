# ShiftSmart Testing Quick Start Guide

**Version:** 2.0  
**Updated:** November 5, 2025

---

## 🚀 Quick Start

### Run All Tests

```bash
cd tests
./run-comprehensive-tests.sh
```

This runs all test suites in sequence and generates a detailed report.

---

## 📋 Individual Test Suites

### 1. Unit Tests

```bash
# Run once
npm run test:unit

# Watch mode (auto-rerun on changes)
npm run test:unit:watch

# With coverage
npm run test:coverage
```

**What it tests:**

- Utility functions
- Password hashing and validation
- AI prompt generation
- Helper functions
- Data transformations

**Coverage goal:** 90%+

---

### 2. API Endpoint Tests

#### Standard API Tests

```bash
npm run test:api
```

Tests all 24 API endpoints with standard scenarios.

#### Enhanced API Tests

```bash
npm run test:api:enhanced
```

Tests edge cases, error handling, and security scenarios:

- SQL injection prevention
- XSS attack prevention
- Invalid input handling
- Rate limiting
- Authentication edge cases

---

### 3. Database Tests

```bash
npm run test:database
```

**What it tests:**

- Schema structure
- Unique constraints
- Foreign key constraints
- Check constraints (enums)
- Cascading deletes
- Triggers (updated_at)
- Indexes
- RLS policies

---

### 4. E2E UI Tests

```bash
# Headless mode (CI)
npm test

# Headed mode (see browser)
npm run test:headed

# Debug mode (step through)
npm run test:debug

# UI mode (interactive)
npm run test:ui

# View test report
npm run test:report
```

**What it tests:**

- Complete user workflows
- Login/logout flow
- Dashboard interactions
- Employee CRUD operations
- Schedule management
- Conflict resolution
- Settings changes
- Navigation
- Form submissions

---

### 5. Accessibility Tests

```bash
npm run test:a11y
```

**What it tests:**

- WCAG 2.1 AA compliance
- Color contrast ratios
- ARIA labels
- Form labels
- Heading hierarchy
- Keyboard navigation
- Screen reader support
- Focus indicators

---

### 6. Performance Tests

```bash
npm run test:performance
```

**Prerequisites:**

- Install k6: `brew install k6` (macOS) or see [k6.io](https://k6.io/)

**What it tests:**

- API response times under load
- Concurrent user handling
- Database query performance
- Memory usage
- CPU usage

**Thresholds:**

- 95th percentile < 500ms
- 99th percentile < 1s
- Error rate < 10%

---

### 7. Type Checking

```bash
npx tsc --noEmit
```

Checks for TypeScript type errors across the codebase.

---

### 8. Linting

```bash
npm run lint
```

Checks code quality and style consistency.

---

## 🔧 Prerequisites

### Required

- **Node.js**: v18+
- **npm**: v9+
- **Database**: Supabase instance with data seeded

### Optional (for specific tests)

- **k6**: For performance tests
- **Docker**: For isolated testing environment

---

## 🌐 Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (optional, for AI tests)
ANTHROPIC_API_KEY=your_anthropic_key

# Test (optional)
API_URL=http://localhost:3000
```

---

## 📊 Test Coverage

### Current Coverage

- **API Endpoints:** 100% (24/24 endpoints)
- **Unit Tests:** Target 90%+
- **E2E Tests:** All critical user paths
- **Accessibility:** WCAG 2.1 AA

### View Coverage Reports

**Unit test coverage:**

```bash
npm run test:coverage
open coverage/index.html
```

**E2E test report:**

```bash
npm run test:report
```

---

## 🐛 Debugging Failed Tests

### Unit Tests

```bash
# Run specific test file
npx jest tests/unit/lib/utils.test.ts

# Run tests matching pattern
npx jest --testNamePattern="password"

# Watch mode with verbose output
npm run test:unit:watch -- --verbose
```

### API Tests

```bash
# Run with debug output
cd tests
DEBUG=1 bash test-api-endpoints.sh
```

### E2E Tests

```bash
# Debug mode (step through test)
npm run test:debug

# Headed mode (see browser)
npm run test:headed

# Specific test file
npx playwright test tests/e2e/tests/ui-01-welcome-login.spec.ts
```

### Accessibility Tests

```bash
# Run specific page
npx playwright test --grep="Dashboard should be accessible"

# Generate detailed report
npm run test:a11y
npm run test:report
```

---

## 📝 Writing New Tests

### Unit Test Template

```typescript
// tests/unit/lib/my-function.test.ts
import { myFunction } from '@/lib/my-function';

describe('myFunction', () => {
  it('should do something when condition is met', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### E2E Test Template

```typescript
// tests/e2e/tests/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/my-feature');
  });

  test('should work correctly', async ({ page }) => {
    await page.click('button:has-text("Action")');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Every push to `main` or `develop`
- Every pull request
- Daily at 2 AM UTC

View results: [Actions tab](https://github.com/your-repo/actions)

### Manual Trigger

```bash
# Push to trigger CI
git push origin your-branch

# Or trigger manually in GitHub Actions UI
```

---

## 📈 Performance Benchmarks

### API Response Times (Target)

- List employees: < 100ms
- List shifts: < 200ms
- Dashboard stats: < 300ms
- AI generation: < 10s (week), < 30s (month)

### Load Handling (Target)

- 10 concurrent users: No degradation
- 50 concurrent users: < 10% degradation
- 100 concurrent users: < 20% degradation

---

## ✅ Test Checklist (Before Deploy)

- [ ] All unit tests pass
- [ ] All API tests pass
- [ ] All E2E tests pass
- [ ] No accessibility violations
- [ ] Performance benchmarks met
- [ ] Code coverage > 90%
- [ ] TypeScript type check passes
- [ ] ESLint passes
- [ ] Manual smoke test complete

---

## 🆘 Common Issues

### Issue: Tests fail due to missing dependencies

**Solution:**

```bash
npm install
npx playwright install --with-deps
```

### Issue: Database connection errors

**Solution:**
Check `.env.local` has correct Supabase credentials.

### Issue: API tests timeout

**Solution:**
Ensure backend is running: `npm run dev` in separate terminal.

### Issue: Playwright browsers not installed

**Solution:**

```bash
npx playwright install --with-deps
```

### Issue: Port already in use

**Solution:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## 📚 Additional Resources

- [Comprehensive Testing Plan](./COMPREHENSIVE_TESTING_PLAN.md)
- [E2E Testing README](./e2e/UI_TESTING_README.md)
- [API Reference](../API_REFERENCE.md)
- [Main README](../README.md)

---

## 🎯 Quick Commands Reference

```bash
# Run everything
./run-comprehensive-tests.sh

# Development workflow
npm run test:unit:watch          # Unit tests (watch)
npm run dev                       # Start dev server
npm run test:headed               # E2E tests (headed)

# Pre-commit checks
npm run lint                      # Lint code
npx tsc --noEmit                 # Type check
npm run test:unit                # Unit tests

# CI simulation (local)
npm run test:all                 # Run main test suites
```

---

**Last Updated:** November 5, 2025  
**Maintained by:** Reuters Breaking News Team
