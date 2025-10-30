## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Changes Made
- Change 1
- Change 2
- Change 3

## API Changes (if applicable)
### New Endpoints
```
POST /api/new-endpoint
GET /api/new-endpoint/:id
```

### Modified Endpoints
```
PUT /api/existing-endpoint - Added new field 'xyz'
```

### Breaking Changes
List any breaking changes and migration steps.

## Testing
Describe how you tested these changes.

### Manual Testing
```bash
# Example API calls used for testing
curl -X POST http://localhost:3000/api/endpoint \
  -H "Authorization: Bearer TOKEN" \
  -d '{"test": "data"}'
```

### Test Results
- ✅ Happy path works as expected
- ✅ Error handling works correctly
- ✅ Authentication/authorization enforced
- ✅ Database queries optimized

## Documentation
- [ ] API_REFERENCE.md updated
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] Code comments added for complex logic
- [ ] .env.local.example updated (if new env vars)

## Version Impact
- [ ] Patch (bug fix) - increment 0.0.X
- [ ] Minor (new feature) - increment 0.X.0
- [ ] Major (breaking change) - increment X.0.0

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No new linter warnings
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables documented
- [ ] No hardcoded secrets or credentials

## Screenshots / Logs (if applicable)
Add any relevant logs or output.

## Related Issues
Closes #(issue_number)
Relates to #(issue_number)

## Additional Notes
Any additional context for reviewers.

