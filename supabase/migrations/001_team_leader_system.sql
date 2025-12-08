-- Migration: Team Leader System
-- Description: Add team leader designation and preference confirmation workflow
-- Date: 2025-12-08

-- ============================================
-- Phase 1: Add team leader flag to users table
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT false;

-- ============================================
-- Phase 2: Add confirmation tracking to shift_preferences
-- ============================================

ALTER TABLE shift_preferences
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Phase 3: Set initial team leaders
-- ============================================

-- Admin and designated team leaders
UPDATE users SET is_team_leader = true
WHERE email IN (
  'arlyn.gajilan@thomsonreuters.com',
  'sabina.suzzi@thomsonreuters.com',
  'gianluca.semeraro@thomsonreuters.com'
);

-- ============================================
-- Phase 4: Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_is_team_leader ON users(is_team_leader) WHERE is_team_leader = true;
CREATE INDEX IF NOT EXISTS idx_shift_preferences_confirmed ON shift_preferences(confirmed);

-- ============================================
-- Verification queries (run manually to verify)
-- ============================================

-- SELECT email, full_name, is_team_leader FROM users WHERE is_team_leader = true;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shift_preferences';
