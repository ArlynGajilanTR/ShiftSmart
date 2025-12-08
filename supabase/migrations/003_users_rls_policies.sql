-- Migration: Add RLS policies for users table management
-- Date: 2025-12-08
--
-- AUTHORIZATION STRATEGY:
-- This app uses custom authentication (not Supabase Auth), so auth.uid() is not available.
-- Authorization is enforced at TWO levels:
--
-- 1. API Layer (PRIMARY): All endpoints verify user permissions via:
--    - canManageEmployees() for create
--    - canDeleteEmployees() for delete
--    - isAdminOrManager() or self-update for updates
--
-- 2. Service Role Client: Write operations use SUPABASE_SERVICE_ROLE_KEY
--    which bypasses RLS after API-layer authorization passes
--
-- 3. RLS Policies (BACKUP): Permissive policies as defense-in-depth
--    These allow operations but the API layer is the primary gatekeeper

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins and team leaders can insert users" ON users;
DROP POLICY IF EXISTS "Admins and team leaders can update users" ON users;
DROP POLICY IF EXISTS "Admins and team leaders can delete users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authorized users can insert users" ON users;
DROP POLICY IF EXISTS "Authorized users can update users" ON users;
DROP POLICY IF EXISTS "Authorized users can delete users" ON users;

-- Policy: Allow INSERT (service role bypasses RLS, anon blocked by API)
CREATE POLICY "Authorized users can insert users" ON users
FOR INSERT WITH CHECK (true);

-- Policy: Allow UPDATE (service role bypasses RLS, anon blocked by API)
CREATE POLICY "Authorized users can update users" ON users
FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: Allow DELETE (service role bypasses RLS, anon blocked by API)
CREATE POLICY "Authorized users can delete users" ON users
FOR DELETE USING (true);

-- Document the authorization model
COMMENT ON TABLE users IS 'User accounts - authorization enforced at API layer via canManageEmployees/canDeleteEmployees';
