# Security Backlog

Items identified during code audit, deferred for future hardening.

## Deferred Items

### LOW: Chatbot API Authentication

**File:** `app/api/ai/chatbot/route.ts`
**Status:** Deferred (UI protected)
**Risk:** Low

The chatbot API endpoint does not verify authentication directly. However:

- The chatbot UI is only accessible within the authenticated dashboard
- The chatbot only returns help text (no sensitive data)
- This is an internal tool for 16 Reuters employees

**Mitigation:** UI-layer authentication guard in `app/dashboard/layout.tsx`

**Future Action:** Add `verifyAuth()` call when implementing public API access

---

_Last updated: December 8, 2025_
