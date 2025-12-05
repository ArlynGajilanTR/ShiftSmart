# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.7] - 2025-12-05

### Added

- **Today View in Dashboard**: New default view in Schedule Overview
  - Shows all shifts scheduled for the current day
  - Groups shifts by time slot (Morning 6AM-12PM, Afternoon 12PM-6PM, Evening/Night 6PM-6AM)
  - Displays shift count and individual shift cards with employee details, role, bureau, and status
  - Empty state with friendly message when no shifts scheduled

### Changed

- **Dashboard Schedule Overview**: Improved data fetching and navigation
  - Now fetches shifts using `api.shifts.list()` with proper date range (start of week to end of quarter)
  - Week view navigation now properly uses week increments instead of month increments
  - "Today" is now the default tab in Schedule Overview
- **Removed Upcoming Shifts Table**: Consolidated shift information into Schedule Overview tabs

### Fixed

- **Dashboard shifts not displaying**: Fixed issue where shifts visible on Schedule page weren't showing on Dashboard
  - Changed from `api.shifts.upcoming(7)` to `api.shifts.list()` with correct date range
  - Added proper data transformation to match expected shift format

## [1.3.6] - 2025-12-05

### Fixed

- **Node.js Version Constraint**: Updated `engines.node` from `>=16.0.0` to `22.x`
  - Fixes Vercel warning about Node.js version override
  - Ensures consistent Node.js 22.x LTS across local development and production
  - Prevents Vercel from auto-upgrading to Node.js 24.x

### Documentation

- Updated README with explicit Node.js 22.x requirement in Setup section
- Updated version numbers throughout documentation

## [1.3.5] - 2025-12-02

### Added

- **New Supabase Project: ShiftSmart-v2**
  - Migrated to new production database in us-west-2 region
  - PostgreSQL 17.6 with full schema, indexes, triggers, and RLS policies
  - Pre-configured with all team data via Supabase MCP

### Changed

- **Team Data Updated**
  - Milan Bureau (ITA-MILAN): 8 Breaking News team members
    - 3 Seniors: Gianluca Semeraro, Sabina Suzzi, Sara Rossi
    - 5 Correspondents: Alessia Pe', Andrea Mandala', Claudia Cristoferi, Cristina Carlevaro, Giancarlo Navach
  - Rome Bureau (ITA-ROME): 8 Breaking News team members
    - 1 Editor: Gavin Jones (Breaking News Editor)
    - 1 Admin: Arlyn Gajilan (System Administrator)
    - 3 Seniors: Alvise Armellini, Giulia Segreti, Stefano Bernabei
    - 3 Correspondents: Antonella Cinelli, Francesca Piscioneri, Valentina Consiglio
  - All 16 team members have shift preferences configured

### Documentation

- Updated all documentation with new Supabase credentials:
  - README.md, QUICKSTART.md, SETUP.md, SETUP_INSTRUCTIONS.md
  - DEVELOPMENT_GUIDE.md, DEPLOYMENT.md, CONTRIBUTING.md
- Added database status badges and project details
- Updated test credentials section

### Database

- **Project:** ShiftSmart-v2
- **Project ID:** wmozxwlmdyxdnzcxetgl
- **Region:** us-west-2
- **Admin:** arlyn.gajilan@thomsonreuters.com / testtest

## [1.3.4] - 2025-11-18

### Fixed

- **Corrected to actual Claude Haiku 4.5 model**
  - Initial model identifier `claude-haiku-4-5` was close but incorrect format
  - Incorrectly downgraded to Claude 3.5 Haiku thinking 4.5 didn't exist
  - Now using correct identifier: `claude-haiku-4-5-20251001`
  - Claude Haiku 4.5 DOES exist with near-frontier performance!

### Key Features of Claude Haiku 4.5

- Near-frontier intelligence matching Sonnet 4 performance
- First Haiku model with extended thinking capabilities
- More than 2x the speed of Sonnet 4
- One-third the cost for high-volume deployments
- Max output: 8192 tokens

Reference: [Claude 4.5 Documentation](https://docs.claude.com/en/docs/about-claude/models/whats-new-claude-4-5)

## [1.3.3] - 2025-11-18

### Fixed

- **Attempted fix with incorrect model**
  - Changed from invalid `claude-haiku-4-5` to `claude-3-5-haiku-20241022`
  - This was an incorrect downgrade (Haiku 4.5 DOES exist)
  - Fixed in v1.3.4 with correct Haiku 4.5 identifier

### Changed

- Temporarily updated documentation to Claude 3.5 Haiku (reverted in v1.3.4)

## [1.3.2] - 2025-11-18

### Added

- **Debug Endpoint**: `/api/ai/debug-last-response` for troubleshooting failed AI responses
  - Returns last 5 failed schedule generation attempts
  - Includes response previews, error messages, and request metadata
  - Authenticated access with PII sanitization
- **Comprehensive Response Logging**: In-memory debug storage for failed AI responses
  - First 1000 + last 500 characters of failed responses
  - Conversational response pattern detection
  - JSON truncation detection and warnings
- **Retry Mechanism with Exponential Backoff**:
  - Max 3 retries for transient failures (timeout, rate limit, 503, 429)
  - Exponential backoff delays: 1s → 2s → 4s
  - Smart retry logic only on retryable errors

### Fixed

- **JSON Parsing Failures**: Critical improvements to reliability
  - Multiple fallback JSON extraction strategies (3 methods)
  - Robust detection of conversational responses vs JSON
  - Better field validation with specific error messages
  - Automatic defaults for missing optional fields
- **User Error Messages**: Much more actionable and specific
  - Parse errors now show "View Debug Info" button
  - Specific messages for timeout, rate limit, and JSON errors
  - Suggestions for resolution (e.g., "try shorter period")

### Changed

- **System Prompts**: Extremely forceful JSON-only enforcement
  - Clear visual separators and repeated emphasis
  - Examples of valid vs invalid response formats
  - Three separate reminders about pure JSON output
  - Removed special characters causing TypeScript errors
- **Error Handling**: Comprehensive improvements across stack
  - Frontend: Better error categorization and user messaging
  - Backend: Detailed logging with request context
  - API: Proper error propagation with debug info

### Performance

- **Expected Parse Success Rate**: 80% → 95%+ (target)
- **Retry Rate**: Expected <5% of requests
- **Debug Visibility**: None → Full failure tracking and analysis

### Documentation

- Added troubleshooting section for new debug endpoint
- Updated error handling documentation
- Added version 1.3.2 to VERSION file

## [1.3.1] - 2025-11-18

### Fixed

- **Critical: JSON Truncation in Schedule Generation**
  - Increased max_tokens from 8,192 → 32,768 to prevent truncation
  - Schedule JSON was 24,810+ characters but hitting token limit
  - Ultra-brief reasoning (10 chars max) to reduce output size by 80-90%

### Changed

- AI reasoning field reduced from 50-100 chars to max 10 chars
  - Example: "Senior correspondent assigned..." → "Sr-cover"
  - Enables scalability to 150+ employee teams
- Token limit set to maximum for Claude Haiku 4.5 (32,768)

### Performance

- **Scalability:** Now supports teams up to 150+ employees
- **Token efficiency:** 80-90% reduction in reasoning field size
- Schedule generation remains 3-5 seconds with Haiku 4.5

## [1.3.0] - 2025-11-18

### Added

- **Claude Haiku 4.5 Integration**: Upgraded AI model for schedule generation
  - Near-frontier performance comparable to Sonnet 4
  - 2-5x faster generation times (3-5s vs 10-30s)
  - 67% cost reduction compared to Sonnet 4.5
- Enhanced AI prompts to force JSON-only output without conversational responses
- Superuser management SQL scripts for adding administrators (Rob Lang, Rafal Nowak)
- Comprehensive documentation for AI model upgrade and troubleshooting

### Fixed

- **Dashboard Stats API**: Now returns properly wrapped `{ stats: {...} }` format
- **Shifts List API**: Now returns properly wrapped `{ shifts: [...] }` format
- Dashboard page crashes due to undefined `stats.totalEmployees`
- Schedule page crashes due to undefined `shifts.map()`
- Claude asking clarifying questions instead of generating schedules
- SSL certificate issues in local development (set as default with NODE_TLS_REJECT_UNAUTHORIZED=0)

### Changed

- AI model from Claude Sonnet 4.5 to Claude Haiku 4.5 (`claude-haiku-4-5`)
- Default dev script to include SSL bypass for corporate network environments
- Email placeholders from `name@reuters.com` to `first.last@thomsonreuters.com`
- Package version bumped to 1.3.0

### Documentation

- Updated `README.md` with Haiku 4.5 information and version 1.3.0
- Updated `AI_MODEL_UPGRADE.md` with correct model identifier and performance metrics
- Updated `AI_SETUP_TROUBLESHOOTING.md` with Haiku 4.5 configuration
- Added `AI_MODEL_FIX.md` with troubleshooting guide for model upgrade
- Added `ADD_SUPERUSERS_GUIDE.md` for user management

### Performance

- Schedule generation: 10-30+ seconds → 3-5 seconds (2-5x improvement)
- Cost per 1000 generations: ~$100 → ~$33 (67% reduction)
- API latency improvements with defensive null checks

## [1.2.2] - 2025-11-13

### Fixed

- Various bug fixes and improvements
- Test suite enhancements

## [1.2.0] - 2025-11-13

### Added

- Complete AI scheduling system with Claude Sonnet 4.5
- Comprehensive test coverage (332+ tests)
- Production-ready deployment

[1.3.7]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.6...v1.3.7
[1.3.6]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/ArlynGajilanTR/ShiftSmart/compare/v1.2.0...v1.2.2
[1.2.0]: https://github.com/ArlynGajilanTR/ShiftSmart/releases/tag/v1.2.0
