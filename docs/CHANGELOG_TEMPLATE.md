# Changelog

All notable changes to ShiftSmart will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

<!-- Phase 2 additions go here -->

- User profile update API (`PUT /api/users/me`)
- Password change API (`PUT /api/users/me/password`)
- Settings page now functional with real API integration

### Changed

<!-- Phase 3 documentation updates go here -->

- Updated README with correct framework versions (Next.js 15, React 18)
- Updated API_REFERENCE.md with new user endpoints

### Fixed

<!-- Phase 1 and Phase 3 fixes go here -->

- **BUG-001:** Fixed signup API parameter mismatch - frontend now correctly sends `bureau_id` which backend looks up by bureau code
- **BUG-003:** Added authentication to chatbot API endpoint - now requires valid session token

### Security

- All AI endpoints now require authentication
- Comprehensive security audit completed

---

## Template Instructions

When completing each phase, update this changelog:

### Phase 1: Signup Fix

Add under `### Fixed`:

```markdown
- **BUG-001:** Fixed signup API parameter mismatch - frontend now correctly sends `bureau_id` which backend looks up by bureau code
```

### Phase 2: Settings Page

Add under `### Added`:

```markdown
- User profile update API (`PUT /api/users/me`)
- Password change API (`PUT /api/users/me/password`)
- Settings page now functional with real API integration
```

### Phase 3: Security & Docs

Add under `### Fixed`:

```markdown
- **BUG-003:** Added authentication to chatbot API endpoint
```

Add under `### Changed`:

```markdown
- Updated README with correct framework versions (Next.js 15, React 18)
- Updated API_REFERENCE.md with new user endpoints
```

Add under `### Security`:

```markdown
- All AI endpoints now require authentication
- Comprehensive security audit completed
```

---

## Version History

### [1.0.0] - Initial Release

- Core scheduling functionality
- AI-powered schedule generation
- Conflict detection and resolution
- Employee management
- Multi-bureau support (Milan, Rome)
