# ShiftSmart Engineering Build Rules

> Opinionated, portable guardrails for safe, surgical changes across ShiftSmart services and apps.

---

## Core Principle: **SURGICAL CHANGES ONLY**

- Targeted, minimal fixes (**1–3 files** preferred; justify if more).
- No opportunistic refactors inside bug‑fix PRs.
- **No hacks, no tech debt, no hardcoded values.**

## Production Data Protection

- **Use test data only.**
- Required env vars (set in repo or shared CI):
  - `TEST_TENANT_ID` (or `SHIFTSMART_TEST_TENANT_ID`)
  - `TEST_ACCOUNT_ID` (for end‑to‑end fixtures)
  - `TEST_USER_ID` (for user-related tests)
  - `TEST_SHIFT_ID` (for shift-related tests)

- **Never** read/write production identifiers or PII in local/dev/test workflows.
- Any tool or script that can touch prod **must** prompt for explicit confirmation and require a `--prod` flag.

## Mandatory Pre‑Work Verification

Before any code change:

1. **Review schema** — path via `DB_SCHEMA_PATH` (e.g., `supabase/schema.sql`).
2. **Read project gotchas** — path via `GOTCHAS_PATH` (e.g., `docs/PROJECT_FIELD_GOTCHAS.md`).
3. **Check API contract** — path via `API_REF_PATH` (e.g., `API_REFERENCE.md`), confirm request/response shapes.
4. **Follow existing patterns** — reuse established modules, helpers, and error semantics.
5. **Assess risk** — confirm migrations, feature flag strategy, and rollback plan.

> **Repo config** (already set in `.env.example`):

```env
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
TEST_ACCOUNT_ID=11111111-1111-1111-1111-111111111111
TEST_USER_ID=11111111-1111-1111-1111-111111111111
TEST_SHIFT_ID=22222222-2222-2222-2222-222222222222
DB_SCHEMA_PATH=supabase/schema.sql
GOTCHAS_PATH=docs/PROJECT_FIELD_GOTCHAS.md
API_REF_PATH=API_REFERENCE.md
```

## Schema & Naming Guarantees

- Code **must** match the database schema and API contracts.
- If a mismatch is discovered, **pause the change** and open a schema/contract PR first (separate from the bug fix), or update the docs/contracts. Link that PR in your fix.
- **Always consult** `docs/PROJECT_FIELD_GOTCHAS.md` before using field names - some deviations are intentional.

## Testing Requirements

- Use `TEST_TENANT_ID`/`TEST_ACCOUNT_ID`/`TEST_USER_ID` or approved fixtures.
- You may modify **test code** and **test data** as needed.
- **Do not** alter application code solely to appease tests.
- All linters, type checks, and tests must pass locally and in CI.

## Workflow for Any Change

1. **Understand** — Read schema/docs/gotchas; verify desired behavior.
2. **Plan** — Identify **1–3 files** max; avoid breaking changes.
3. **Implement** — Surgical edits only; prefer configuration/flags over refactors.
4. **Verify** — Run unit/integration tests, type checks, linters; verify against test tenant.

## Success Criteria (all must be true)

- ✅ Surgical scope (≈1–3 files, or explicit justification).
- ✅ No hardcoded values / temporary workarounds.
- ✅ Field names & types verified against `${DB_SCHEMA_PATH}`.
- ✅ No breaking changes or contract drift.
- ✅ CI green: tests + linters + types.
- ✅ Reviewer approval.

---

## ShiftSmart-Specific Guidelines

### Database Schema

- **Primary schema:** `supabase/schema.sql`
- **Tables:** bureaus, users, shifts, shift_assignments, shift_preferences, schedule_periods, scheduling_conflicts
- **Key gotchas:** `role` vs `shift_role` in users table (see `docs/PROJECT_FIELD_GOTCHAS.md`)

### API Contracts

- **Reference:** `API_REFERENCE.md`
- **24 endpoints** across authentication, employees, shifts, conflicts, dashboard, and AI
- **Authentication:** Bearer token in `Authorization` header
- **Response format:** JSON with consistent error handling

### Test Data

**Seeded users:**

- Password: `changeme`
- 15 Breaking News team members (8 Milan, 7 Rome)

**Dev admin:**

- Email: `arlyn.gajilan@thomsonreuters.com`
- Password: `testtest`

### Common Pitfalls

1. **Using production emails** - Always use test fixtures
2. **Confusing `role` and `shift_role`** - Read gotchas doc first
3. **Skipping schema verification** - Field names matter!
4. **Breaking API contracts** - Check `API_REFERENCE.md` before changes
5. **More than 3 files** - Justify or split the PR

---

## Pull Request Process

1. **Create PR** using the template (`.github/pull_request_template.md`)
2. **Surgical scope check** runs automatically (CI warns if >3 files)
3. **Pre-commit hooks** catch common issues before push
4. **Code review** ensures compliance with build rules
5. **All checks pass** before merge

### Required PR Checklist Items

- [ ] ≤ 3 files changed (or justification provided)
- [ ] No hardcoded values / temporary workarounds
- [ ] Field names/types verified against `supabase/schema.sql`
- [ ] Read `docs/PROJECT_FIELD_GOTCHAS.md` and `API_REFERENCE.md`
- [ ] Tests & linters pass locally and in CI
- [ ] Uses `TEST_TENANT_ID` / `TEST_ACCOUNT_ID` (no prod IDs)

---

## Pre-Commit Hooks

**Setup:**

```bash
pip install pre-commit
pre-commit install
```

**What it checks:**

- Trailing whitespace, file endings
- YAML/JSON syntax
- JavaScript/TypeScript formatting (Prettier)
- ESLint for code quality
- SQL formatting (sqlfluff)
- Markdown linting
- TypeScript type checking
- Test data validation (no production IDs)

**Run manually:**

```bash
pre-commit run --all-files
```

---

## CI/CD Pipeline

### Automated Checks

1. **Surgical Scope Check** (`.github/workflows/surgical-scope.yml`)
   - Warns if >3 files changed
   - Posts advisory comment on PR
   - Non-blocking (advisory only)

2. **Tests** (existing workflows)
   - Unit tests (59 tests)
   - API tests (20 endpoints)
   - E2E tests (100+ tests)
   - TypeScript type checking

3. **Linting**
   - ESLint for JavaScript/TypeScript
   - Prettier for formatting
   - SQL linting for database scripts

---

## ADR Requirement for Breaking Changes

Any change that alters public contracts (DB schema, API fields, event payloads) requires an ADR (`/docs/adr/NNN-title.md`) with:

- Migration steps (forward and backward)
- Telemetry/monitoring strategy
- Rollback instructions
- Risk assessment
- Stakeholder approval

---

## Feature Flags

Use environment variables for feature toggles:

```env
FEATURE_AI_SCHEDULING=true
FEATURE_AI_CONFLICT_RESOLUTION=true
FEATURE_DRAG_DROP_SHIFTS=true
FEATURE_CSV_IMPORT=true
```

Benefits:

- Test features in production with limited rollout
- Quick rollback without code deploy
- A/B testing capabilities
- Gradual feature enablement

---

## Risk Levels & Rollback

### Risk Assessment

**Low Risk:**

- UI-only changes
- Documentation updates
- Test improvements
- Non-breaking feature additions

**Medium Risk:**

- API changes (non-breaking)
- New database columns (nullable)
- Feature flag-protected features
- Performance optimizations

**High Risk:**

- Database schema changes (breaking)
- API contract changes (breaking)
- Authentication/authorization changes
- Data migrations
- External integrations

### Rollback Plans

Every PR must include a rollback plan:

1. **Feature flags:** Toggle off in environment
2. **Git revert:** `git revert <commit>` and redeploy
3. **Database rollback:** Run backward migration script
4. **Cache clear:** If caching issues
5. **Hotfix:** Emergency fix in separate PR

---

## Tools & Commands

### Development

```bash
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npx prettier --write .
```

### Testing

```bash
# All tests
cd tests && ./run-comprehensive-tests.sh

# Specific suites
npm run test:unit              # Unit tests
npm run test:api               # API tests
npm test                       # E2E tests
npm run test:a11y              # Accessibility tests
```

### Database

```bash
# Run migrations
psql -h <host> -d <db> -f supabase/schema.sql

# Seed data
psql -h <host> -d <db> -f supabase/seed-breaking-news-team.sql
```

---

## Enforcement

### Soft Enforcement (Advisory)

- Surgical scope check (warns if >3 files)
- Pre-commit hooks (can be bypassed with `--no-verify`)
- PR template checklist

### Hard Enforcement (Blocking)

- Required code review approval
- All CI tests must pass
- No merge conflicts
- Branch must be up to date

---

## Examples

### ✅ Good PR Example

**Title:** Fix double booking validation in shift assignments

**Files Changed:** 2

- `app/api/shifts/route.ts` (added validation)
- `lib/validation/conflicts.ts` (updated logic)

**Checklist:**

- ✅ 2 files changed
- ✅ No hardcoded values
- ✅ Verified field names against schema
- ✅ Read gotchas doc
- ✅ All tests pass
- ✅ Uses TEST_TENANT_ID

**Risk:** Low
**Rollback:** Revert commit, no data migration needed

---

### ❌ Bad PR Example

**Title:** Fix bug and refactor authentication system

**Files Changed:** 12

- Authentication refactor (8 files)
- Bug fix (2 files)
- Formatting changes (2 files)

**Issues:**

- ❌ Too many files (not surgical)
- ❌ Mixing bug fix with refactor
- ❌ Opportunistic formatting changes
- ❌ No clear rollback plan

**Fix:** Split into 3 PRs:

1. Bug fix only (2 files)
2. Authentication refactor (separate PR with ADR)
3. Formatting (automated tool, separate PR)

---

## Related Documentation

- [Project Field Gotchas](./docs/PROJECT_FIELD_GOTCHAS.md) - Naming conventions
- [API Reference](./API_REFERENCE.md) - API contracts
- [Database Schema](./supabase/schema.sql) - Schema definition
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines
- [Testing Guide](./tests/TESTING_GUIDE.md) - Testing strategy

---

## Questions?

If you're unsure about whether your change follows these rules:

1. **Ask in PR** - Tag reviewers with questions
2. **Check examples** - Look at recent merged PRs
3. **Review docs** - Read gotchas and API reference
4. **When in doubt** - Prefer smaller, more surgical changes

---

**Last Updated:** November 13, 2025  
**Maintained by:** Reuters Breaking News Engineering Team  
**Version:** 1.0.0
