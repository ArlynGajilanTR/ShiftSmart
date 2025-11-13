# Pull Request

## Description

<!-- Provide a clear and concise description of what this PR does -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Surgical Change Checklist

<!-- All items must be checked before merging -->

- [ ] **≤ 3 files changed** (or justification provided below)
- [ ] **No hardcoded values** or temporary workarounds
- [ ] **Field names/types verified** against `supabase/schema.sql`
- [ ] **Read project gotchas** in `docs/PROJECT_FIELD_GOTCHAS.md`
- [ ] **Read API reference** in `API_REFERENCE.md`
- [ ] **Uses test data only** (`TEST_TENANT_ID` / `TEST_ACCOUNT_ID` - no prod IDs)
- [ ] **Tests pass locally** (unit, integration, e2e)
- [ ] **Linters pass** (`npm run lint` and TypeScript check)
- [ ] **No breaking changes** to public APIs or database schema

## Files Changed

<!-- If more than 3 files changed, provide justification -->

**Number of files changed:** <!-- e.g., 2 -->

**Justification (if > 3 files):**
<!-- Explain why this change requires more than 3 files -->

## Testing

<!-- Describe the testing you've done -->

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Tested with `TEST_TENANT_ID` and `TEST_ACCOUNT_ID`

**Test Results:**
```bash
# Paste relevant test output here
```

## Database Changes

<!-- Mark if applicable -->

- [ ] No database changes
- [ ] Schema changes (migration provided)
- [ ] Seed data changes
- [ ] Index changes

**Migration Path:** <!-- If database changes, describe migration steps -->

## Risk Assessment & Rollback

**Risk Level:** <!-- Low / Medium / High -->

**Affected Areas:** <!-- e.g., Authentication, Scheduling, Reporting -->

**Feature Flags Used:** <!-- If any, list them -->

**Rollback Plan:**
<!-- Describe how to revert this change if something goes wrong -->

## Pre-Work Verification

<!-- Confirm you've reviewed these before making changes -->

- [ ] Reviewed database schema (`supabase/schema.sql`)
- [ ] Reviewed API contracts (`API_REFERENCE.md`)
- [ ] Reviewed field naming gotchas (`docs/PROJECT_FIELD_GOTCHAS.md`)
- [ ] Followed existing code patterns
- [ ] Assessed migration risk

## Dependencies

<!-- List any dependent PRs, tickets, or external dependencies -->

- Related Issue: <!-- #issue_number or N/A -->
- Depends on: <!-- Other PRs or tickets, or N/A -->
- Blocks: <!-- Other PRs or tickets, or N/A -->

## Breaking Changes

<!-- If this introduces breaking changes, describe them and provide migration guide -->

- [ ] No breaking changes
- [ ] Breaking changes documented below

**Breaking Change Details:** <!-- If applicable -->

**Migration Guide:** <!-- If applicable -->

## Screenshots / Demo

<!-- If UI changes, add screenshots or a demo video -->

## Additional Notes

<!-- Any additional context, considerations, or notes for reviewers -->

## Checklist for Reviewers

- [ ] Code follows project conventions
- [ ] Changes are surgical and minimal
- [ ] No hardcoded values or tech debt introduced
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated (if needed)
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable

---

**By submitting this PR, I confirm that:**
- I have followed the [Engineering Build Rules](./ENGINEERING_BUILD_RULES.md)
- I have used test data only (no production IDs or PII)
- I have verified field names against the database schema
- I am ready for code review and deployment
