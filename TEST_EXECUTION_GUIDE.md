# ShiftSmart Test Execution Guide

**Quick Reference for Running Tests**

---

## 🎯 One Command to Rule Them All

```bash
cd tests && ./run-comprehensive-tests.sh
```

This runs **all 300+ tests** and generates a detailed report.

---

## 📋 Test Categories & Commands

### 1. Unit Tests (150+ tests)

```bash
npm run test:unit              # Run once
npm run test:unit:watch        # Watch mode
npm run test:coverage          # With coverage report
```

### 2. API Tests (100+ tests)

```bash
npm run test:api               # Standard (24 endpoints)
npm run test:api:enhanced      # Enhanced (edge cases + security)
```

### 3. Database Tests (60+ tests)

```bash
npm run test:database
```

### 4. E2E UI Tests (100+ tests)

```bash
npm test                       # Headless
npm run test:headed            # With browser
npm run test:debug             # Debug mode
npm run test:ui                # Interactive UI
```

### 5. Accessibility Tests (20+ tests)

```bash
npm run test:a11y
```

### 6. Performance Tests

```bash
npm run test:performance       # Requires k6
```

### 7. Code Quality

```bash
npm run lint                   # ESLint
npx tsc --noEmit              # Type check
```

---

## 🚀 Quick Test Workflows

### Before Committing

```bash
npm run lint
npm run test:unit
npx tsc --noEmit
```

### Before Pull Request

```bash
cd tests
./run-comprehensive-tests.sh
```

### During Development

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch unit tests
npm run test:unit:watch

# Terminal 3: Run E2E when needed
npm run test:headed
```

---

## 📊 View Test Reports

### Unit Test Coverage

```bash
npm run test:coverage
open coverage/index.html
```

### E2E Test Report

```bash
npm run test:report
```

### Accessibility Report

Located in `playwright-report/` after running `npm run test:a11y`

---

## 🔧 Test Environment Setup

### Required Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

### Install Dependencies

```bash
npm install
npx playwright install --with-deps
```

### Seed Test Data

```sql
-- Run in Supabase SQL editor
-- 1. supabase/schema.sql
-- 2. supabase/seed-breaking-news-team.sql
-- 3. supabase/create-dev-admin.sql
```

---

## 🐛 Debugging Tests

### Failed Unit Test

```bash
# Run specific file
npx jest tests/unit/lib/utils.test.ts

# Run with pattern
npx jest --testNamePattern="password"

# Verbose mode
npx jest --verbose
```

### Failed API Test

```bash
# Check API is running
curl http://localhost:3000/api/dashboard/stats

# Run with debug
cd tests
DEBUG=1 bash test-api-endpoints.sh
```

### Failed E2E Test

```bash
# Debug mode (step through)
npm run test:debug

# Run specific test
npx playwright test tests/e2e/tests/ui-01-welcome-login.spec.ts

# With trace
npx playwright test --trace on
```

---

## 📈 Test Coverage Goals

- ✅ Unit Tests: 90%+ code coverage
- ✅ API Endpoints: 100% (24/24)
- ✅ UI Workflows: 100% critical paths
- ✅ Accessibility: WCAG 2.1 AA (0 violations)
- ✅ Performance: < 500ms (p95)

---

## 🎓 Learning Resources

- [Comprehensive Testing Plan](./tests/COMPREHENSIVE_TESTING_PLAN.md) - Full strategy
- [Testing Quickstart](./tests/TESTING_QUICKSTART.md) - Quick reference
- [Testing Summary](./TESTING_SUMMARY.md) - Overview
- [API Reference](./API_REFERENCE.md) - API documentation

---

## ✅ Pre-Deployment Checklist

- [ ] `npm install` - Dependencies installed
- [ ] `npm run lint` - No linting errors
- [ ] `npx tsc --noEmit` - No type errors
- [ ] `npm run test:unit` - All unit tests pass
- [ ] `npm run test:api` - All API tests pass
- [ ] `npm test` - All E2E tests pass
- [ ] `npm run test:a11y` - No accessibility violations
- [ ] Manual smoke test complete

---

**Last Updated:** November 5, 2025  
**Quick Reference:** Keep this handy for daily testing!
