# ShiftSmart Development Guide

**Version:** 1.2.0  
**Last Updated:** November 6, 2025

---

## 🚀 Quick Start for New Developers

### 1. Initial Setup (10 minutes)
```bash
# Clone repository
git clone https://github.com/ArlynGajilanTR/ShiftSmart.git
cd shiftsmart-v1

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Setup database
# Run in Supabase SQL editor:
# 1. supabase/schema.sql
# 2. supabase/seed-breaking-news-team.sql
# 3. supabase/create-dev-admin.sql (optional)

# Start development server
npm run dev
```

Visit: http://localhost:3000

---

## 📁 Project Structure

```
shiftsmart-v1/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes (24 endpoints)
│   │   ├── auth/                 # Authentication
│   │   ├── employees/            # Employee management
│   │   ├── shifts/               # Shift scheduling
│   │   ├── conflicts/            # Conflict detection
│   │   ├── dashboard/            # Dashboard stats
│   │   └── ai/                   # AI integration
│   ├── dashboard/                # Frontend pages
│   │   ├── employees/            # Employee management UI
│   │   ├── schedule/             # Schedule management UI
│   │   ├── conflicts/            # Conflict resolution UI
│   │   └── settings/             # Settings UI
│   ├── login/                    # Login page
│   └── signup/                   # Signup page
├── lib/                          # Shared utilities
│   ├── ai/                       # AI integration (Claude)
│   ├── auth/                     # Authentication utilities
│   ├── scheduling/               # Scheduling logic
│   ├── supabase/                 # Database clients
│   └── validation/               # Business logic validation
├── components/                   # React components
│   └── ui/                       # UI components (shadcn/ui)
├── tests/                        # Test suites (300+ tests)
│   ├── unit/                     # Unit tests (Jest)
│   ├── e2e/                      # E2E tests (Playwright)
│   ├── api-enhanced/             # Enhanced API tests
│   ├── database/                 # Database tests
│   └── performance/              # Performance tests
├── supabase/                     # Database schema & seeds
└── docs/                         # Documentation
```

---

## 🔄 Development Workflow

### Daily Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start dev server
npm run dev

# 4. Run tests in watch mode (separate terminal)
npm run test:unit:watch

# 5. Make changes and test

# 6. Before committing
npm run lint                      # Check code quality
npx tsc --noEmit                 # Check types
npm run test:unit                # Run unit tests
npm run test:api                 # Run API tests

# 7. Commit changes
git add .
git commit -m "feat: your feature description"

# 8. Push and create PR
git push origin feature/your-feature-name
```

---

## 🧪 Testing Strategy

### Test Pyramid (300+ tests)

```
           E2E Tests (100+)         ← Slow, comprehensive
          ╱                    ╲
         ╱  Integration Tests   ╲    ← Medium speed
        ╱    (API: 20 tests)     ╲
       ╱                          ╲
      ╱    Unit Tests (59 tests)   ╲  ← Fast, focused
     ╱______________________________╲
```

### When to Run What

| Situation | Tests to Run | Duration |
|-----------|--------------|----------|
| **During development** | `npm run test:unit:watch` | Real-time |
| **Before commit** | `npm run test:unit` | 3 seconds |
| **Before PR** | `npm run test:all` | 5 minutes |
| **Before deploy** | Full E2E suite | 10 minutes |

### Test Commands
```bash
# Unit tests (fastest)
npm run test:unit              # Run once
npm run test:unit:watch        # Watch mode
npm run test:coverage          # With coverage

# API tests
npm run test:api               # Standard tests
npm run test:api:enhanced      # With edge cases

# Database tests
npm run test:database          # Schema & constraints

# E2E tests
npm test                       # Headless
npm run test:headed            # With browser
npm run test:debug             # Debug mode

# All tests
cd tests && ./run-comprehensive-tests.sh
```

---

## 🎯 Feature Development Guide

### Adding a New API Endpoint

1. **Create route handler**
```typescript
// app/api/your-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

export async function GET(request: NextRequest) {
  const { user, error } = await verifyAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  
  // Your logic here
  return NextResponse.json({ data: 'success' });
}
```

2. **Add to API client**
```typescript
// lib/api-client.ts
export const api = {
  yourFeature: {
    list: () => apiRequest<YourType[]>('/api/your-feature'),
  },
};
```

3. **Write tests**
```bash
# Add to tests/test-api-endpoints.sh
run_test "Your feature test" "GET" "/api/your-feature" "" "200" "true"
```

4. **Update documentation**
- Add to `API_REFERENCE.md`
- Update `CHANGELOG.md`

### Adding a New UI Page

1. **Create page component**
```typescript
// app/dashboard/your-page/page.tsx
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"

export default function YourPage() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    api.yourFeature.list().then(setData)
  }, [])
  
  return <div>Your content</div>
}
```

2. **Add navigation**
```typescript
// app/dashboard/layout.tsx
// Add to sidebar navigation
```

3. **Write E2E tests**
```typescript
// tests/e2e/tests/your-page.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Your Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/your-page');
  });

  test('should load correctly', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

---

## 🗄️ Database Changes

### Adding a New Table

1. **Update schema**
```sql
-- supabase/schema.sql
CREATE TABLE your_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_your_table_name ON your_table(name);

-- Add RLS policy
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access" ON your_table FOR ALL USING (true);
```

2. **Create migration**
```bash
# Run in Supabase SQL editor
# Test in dev environment first
```

3. **Add TypeScript types**
```typescript
// types/index.ts
export interface YourTable {
  id: string;
  name: string;
  created_at: string;
}
```

4. **Write database tests**
```typescript
// tests/database/your-table.test.ts
describe('Your Table', () => {
  it('should enforce constraints', async () => {
    // Test constraint enforcement
  });
});
```

---

## 🤖 AI Integration

### Using Claude for Scheduling

```typescript
import { generateSchedule } from '@/lib/ai/scheduler-agent';

const result = await generateSchedule({
  period: {
    start_date: '2025-11-01',
    end_date: '2025-11-07',
    type: 'week',
  },
  bureau: 'Milan',
});

if (result.success) {
  // Use result.data.shifts
}
```

### Customizing AI Prompts

Edit: `lib/ai/prompts/schedule-generation.ts`

---

## 🔒 Authentication & Authorization

### Protecting Routes

```typescript
// Server-side (API routes)
import { verifyAuth } from '@/lib/auth/verify';

export async function GET(request: NextRequest) {
  const { user, error } = await verifyAuth(request);
  if (error) return NextResponse.json({ error }, { status: 401 });
  
  // Protected logic
}
```

```typescript
// Client-side (React components)
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) router.push('/login');
  }, [router]);
  
  return <div>Protected content</div>;
}
```

---

## 📊 Monitoring & Debugging

### Checking Test Status
```bash
# Quick health check
npm run test:unit          # Should show 59/59 passing
npm run test:api           # Should show 20/20 passing
npx tsc --noEmit          # Should show 0 errors
```

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### Database Connection Issues
```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Test connection
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

#### Test Failures
```bash
# Run specific test
npx jest tests/unit/lib/utils.test.ts

# Debug mode
npm run test:debug

# Clear cache
npm run test:unit -- --clearCache
```

---

## 📦 Dependencies Management

### Adding Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name

# Update package.json and run tests
npm run test:unit
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all (carefully!)
npm update

# Run full test suite after updates
cd tests && ./run-comprehensive-tests.sh
```

---

## 🚢 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing: `cd tests && ./run-comprehensive-tests.sh`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Code reviewed and approved
- [ ] CHANGELOG.md updated
- [ ] Environment variables configured

### Deployment Steps
```bash
# 1. Merge to main
git checkout main
git merge feature/your-feature
git push origin main

# 2. Tag release
git tag -a v1.2.1 -m "Release v1.2.1"
git push origin v1.2.1

# 3. Deploy (Vercel/Railway)
# Automatic deployment on push to main

# 4. Verify deployment
curl https://your-domain.com/api/dashboard/stats
```

### Post-Deployment
- [ ] Smoke test production
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Update documentation

---

## 🎨 Code Style Guidelines

### TypeScript
- Use strict typing (no `any` unless necessary)
- Prefer interfaces over types for object shapes
- Use async/await over promises
- Add JSDoc comments for public functions

### React
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Follow "use client" directive when needed

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`
- API routes: `route.ts`

### Git Commits
```bash
# Format: type(scope): message
feat(api): add employee export endpoint
fix(ui): resolve dashboard loading issue
docs: update testing guide
test: add unit tests for AI scheduler
refactor(auth): improve token validation
```

---

## 📚 Key Documentation

### Essential Reading
1. [README.md](./README.md) - Project overview
2. [TESTING_QUICKSTART.md](./tests/TESTING_QUICKSTART.md) - Testing basics
3. [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
4. [CHANGELOG.md](./CHANGELOG.md) - Version history

### Reference Guides
- [COMPREHENSIVE_TESTING_PLAN.md](./tests/COMPREHENSIVE_TESTING_PLAN.md) - Full testing strategy
- [TEST_EXECUTION_GUIDE.md](./TEST_EXECUTION_GUIDE.md) - Test commands
- [TEST_FIXES_REPORT.md](./TEST_FIXES_REPORT.md) - Recent fixes
- [PRD.md](./PRD.md) - Product requirements
- [MVP_REQUIREMENTS.md](./MVP_REQUIREMENTS.md) - MVP scope

---

## 🆘 Getting Help

### Resources
1. **Documentation**: Check `/docs` directory
2. **Tests**: Look at test files for examples
3. **API Reference**: See `API_REFERENCE.md`
4. **Git History**: `git log` for context

### Common Questions

**Q: How do I run a single test?**
```bash
npx jest tests/unit/lib/utils.test.ts
```

**Q: How do I debug a test?**
```bash
npm run test:debug
```

**Q: Where are the test credentials?**
- See README.md "Test Credentials" section
- Default password: `changeme`

**Q: How do I add a new test?**
- See "Feature Development Guide" above
- Follow existing test patterns

---

## 🎯 Best Practices

### DO
✅ Write tests for new features  
✅ Run tests before committing  
✅ Use TypeScript strictly  
✅ Document complex logic  
✅ Keep commits atomic  
✅ Update CHANGELOG.md  
✅ Review code before PR  

### DON'T
❌ Commit without testing  
❌ Use `any` type unnecessarily  
❌ Skip TypeScript checks  
❌ Push directly to main  
❌ Hardcode credentials  
❌ Ignore linting errors  
❌ Leave console.logs  

---

## 📈 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2025-11-06 | Comprehensive testing infrastructure |
| 1.1.1 | 2025-11-05 | Dev admin setup script |
| 1.1.0 | 2025-10-30 | Frontend-backend integration |
| 1.0.0 | 2025-10-25 | Initial production release |

---

**Happy Coding! 🚀**

For questions or issues, see documentation in `/docs` or check test examples.

---

**Last Updated:** November 6, 2025  
**Version:** 1.2.0  
**Maintained by:** Reuters Breaking News Team

