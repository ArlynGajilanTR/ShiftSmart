# Contributing to ShiftSmart

Thank you for your interest in contributing to ShiftSmart! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Standards

- Be respectful and professional
- Welcome diverse perspectives
- Focus on what's best for Reuters and the Breaking News team
- Show empathy towards other contributors

---

## Getting Started

### Prerequisites

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **Supabase Account:** For database access
- **Anthropic API Key:** For AI features (optional)
- **Python & pip:** For pre-commit hooks (optional but recommended)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/ArlynGajilanTR/ShiftSmart.git
cd ShiftSmart
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Install pre-commit hooks (recommended):**
```bash
pip install pre-commit
pre-commit install
```

5. **Run database migrations:**
- Open Supabase SQL Editor
- Run `supabase/schema.sql`
- Run `supabase/seed-breaking-news-team.sql`

6. **Start development server:**
```bash
npm run dev
```

### Engineering Build Rules

Before contributing, please familiarize yourself with our [Engineering Build Rules](./ENGINEERING_BUILD_RULES.md):

- **Surgical changes only** (prefer ≤3 files per PR)
- **Production data protection** (use test IDs from `.env.example`)
- **Pre-work verification** (review schema, gotchas, and API contracts)
- **No hardcoded values or tech debt**

**Key Resources:**
- [Engineering Build Rules](./ENGINEERING_BUILD_RULES.md) - Complete guidelines
- [Project Field Gotchas](./docs/PROJECT_FIELD_GOTCHAS.md) - Naming conventions
- [Database Schema](./supabase/schema.sql) - Schema reference
- [API Reference](./API_REFERENCE.md) - API contracts

---

## Development Workflow

### Branch Strategy

We use a simplified Git workflow:

- **`main`** - Production-ready code
- **Feature branches** - Named `feature/description` or `fix/description`

### Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git checkout main
git pull origin main
git checkout feature/your-feature-name
git rebase main
```

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes

**Example:**
```typescript
// Good
interface Employee {
  id: string;
  full_name: string;
  email: string;
  bureau_id: string;
}

// Avoid
const employee: any = { ... };
```

### File Organization

```
app/api/[feature]/
├── route.ts              # Main API handler
└── [id]/
    └── route.ts          # Nested resource handler

lib/[feature]/
├── client.ts             # Client-side utilities
├── server.ts             # Server-side utilities
└── types.ts              # Type definitions
```

### Naming Conventions

- **Files:** `kebab-case` (e.g., `schedule-generation.ts`)
- **Components:** `PascalCase` (not applicable for API-only)
- **Functions:** `camelCase` (e.g., `generateSchedule`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_SHIFTS_PER_WEEK`)
- **Types/Interfaces:** `PascalCase` (e.g., `ShiftAssignment`)

### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Line length:** Max 100 characters
- **Imports:** Organized (standard library → external → internal)

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { verifySession } from '@/lib/auth/verify';
import type { Employee } from '@/types';

export async function GET(req: NextRequest) {
  // Implementation
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic change)
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **chore:** Build process or auxiliary tool changes

### Examples

```bash
# Feature
git commit -m "feat(api): add AI schedule generation endpoint"

# Bug fix
git commit -m "fix(auth): resolve session token expiration issue"

# Documentation
git commit -m "docs(readme): update API endpoint documentation"

# Breaking change
git commit -m "feat(api)!: change employee response format

BREAKING CHANGE: Employee API now returns 'shift_role' instead of 'level'"
```

### Commit Message Rules

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Keep subject line under 72 characters
- Include body for complex changes
- Reference issues/PRs in footer

---

## Pull Request Process

### Before Submitting

1. **Verify surgical scope:**
   - Aim for ≤3 files changed (justify if more)
   - No opportunistic refactors mixed with bug fixes

2. **Pre-work verification:**
   - Review `supabase/schema.sql` for field names
   - Check `docs/PROJECT_FIELD_GOTCHAS.md` for naming rules
   - Verify `API_REFERENCE.md` for API contracts

3. **Test your changes:**
```bash
npm run build              # Build check
npm run lint               # Linting
npx tsc --noEmit          # Type check
npm run test:unit         # Unit tests
npm run test:api          # API tests
```

4. **Update documentation:**
- Update `API_REFERENCE.md` for API changes
- Update `CHANGELOG.md` with your changes
- Update `README.md` if needed
- Update `docs/PROJECT_FIELD_GOTCHAS.md` if adding new conventions

5. **Use test data only:**
   - Use `TEST_TENANT_ID`, `TEST_ACCOUNT_ID` from `.env.example`
   - Never commit production IDs or PII

6. **Write descriptive PR title:**
```
feat(shifts): Add drag-and-drop API endpoint
fix(auth): Resolve token refresh bug
docs(api): Document AI scheduling endpoints
```

### PR Template

**Use the provided PR template** (automatically loaded from `.github/pull_request_template.md`).

Key sections include:
- Surgical Change Checklist
- Risk Assessment & Rollback Plan
- Pre-Work Verification
- Testing Results

### Review Process

1. **Automated checks** must pass:
   - Surgical scope check (warns if >3 files)
   - Linting and build
   - All tests passing
   - TypeScript type check

2. **Code review** by at least one maintainer
3. **Build rules compliance:**
   - Surgical scope verified
   - No hardcoded values
   - Field names match schema
   - Uses test data only

4. **Approval** from project maintainer
5. **Merge** to main branch

---

## Testing

### Manual Testing

Test API endpoints using curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@reuters.com","password":"changeme"}'

# Test endpoint with token
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Checklist

When adding new features, test:

- ✅ **Happy path** - Normal operation
- ✅ **Error cases** - Invalid input, missing data
- ✅ **Edge cases** - Empty results, maximum values
- ✅ **Authentication** - Valid/invalid tokens
- ✅ **Authorization** - Proper role checks
- ✅ **Database** - Correct queries, transactions

---

## Documentation

### What to Document

1. **API Endpoints** - Add to API_REFERENCE.md
   - Endpoint path and method
   - Request/response examples
   - Query parameters
   - Error responses

2. **Code Comments** - For complex logic
   ```typescript
   // Calculate shift distribution ensuring senior staff coverage
   // Algorithm prioritizes preference compliance while maintaining role balance
   const distribution = calculateShiftDistribution(employees, shifts);
   ```

3. **Type Definitions** - Document interfaces
   ```typescript
   /**
    * Represents an employee in the Breaking News team
    */
   interface Employee {
     id: string;           // UUID
     full_name: string;    // Full name as in Reuters directory
     shift_role: 'editor' | 'senior' | 'correspondent';
     bureau_id: string;    // References bureaus.id
   }
   ```

4. **Environment Variables** - Add to .env.local.example
   ```bash
   # Anthropic AI Configuration (required for AI scheduling)
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Documentation Updates

Always update when:
- Adding new API endpoints
- Changing request/response formats
- Adding environment variables
- Modifying setup process
- Fixing bugs (add to CHANGELOG.md)

---

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR:** Incompatible API changes (e.g., 1.0.0 → 2.0.0)
- **MINOR:** New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH:** Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

### Updating Version

1. Update `package.json` version
2. Update `VERSION` file
3. Update `CHANGELOG.md` with changes
4. Commit with message: `chore: bump version to X.Y.Z`
5. Create git tag: `git tag vX.Y.Z`

---

## Questions?

If you have questions or need help:

1. **Check existing documentation:**
   - README.md
   - API_REFERENCE.md
   - DEPLOYMENT.md

2. **Search existing issues:**
   - https://github.com/ArlynGajilanTR/ShiftSmart/issues

3. **Open a new issue:**
   - Use issue templates
   - Provide detailed description
   - Include relevant code/logs

---

## License

By contributing to ShiftSmart, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to ShiftSmart!** 🚀

*Last Updated: November 13, 2025*
*Version: 1.1.0*

