---
name: Bug Report
about: Report a bug or issue
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of the bug.

## Steps to Reproduce

1. Go to '...'
2. Call API endpoint '...'
3. With request body '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## API Request Example

```bash
curl -X POST https://your-api.vercel.app/api/endpoint \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Response

```json
{
  "error": "Error message here"
}
```

## Environment

- **API Version:** [e.g., 1.0.0]
- **Node Version:** [e.g., 18.17.0]
- **Database:** [e.g., Supabase PostgreSQL 15]
- **Deployment:** [e.g., Vercel Production]

## Additional Context

Any other context about the problem.

## Logs

Include relevant server logs if available.
