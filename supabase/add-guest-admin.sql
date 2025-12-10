-- Add Guest Admin user for testing/demo access
-- Email: test.test@thomsonreuters.com
-- Password: changeme (standard password for non-primary admin)
-- Role: admin (full access)
-- Updated: December 10, 2025

DO $$
DECLARE
  milan_bureau_id UUID;
BEGIN
  -- Get Milan bureau ID (or any bureau if Milan doesn't exist)
  SELECT id INTO milan_bureau_id FROM bureaus WHERE code = 'ITA-MILAN' LIMIT 1;

  IF milan_bureau_id IS NULL THEN
    SELECT id INTO milan_bureau_id FROM bureaus LIMIT 1;
  END IF;

  -- ========================================
  -- Add Guest Admin
  -- ========================================
  INSERT INTO users (
    email,
    full_name,
    title,
    shift_role,
    bureau_id,
    team,
    status,
    role,
    password_hash
  ) VALUES (
    'test.test@thomsonreuters.com',
    'Guest Admin',
    'Guest Administrator',
    'editor',
    milan_bureau_id,
    'Breaking News',
    'active',
    'admin',
    '$2a$10$uXoJ.lZEy7GquXNml8sW0O9xUNlPCBF0eqrEA0/FLJepOYzWCEhB.'
  ) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    shift_role = 'editor',
    full_name = EXCLUDED.full_name,
    title = EXCLUDED.title,
    status = 'active',
    updated_at = NOW();

  RAISE NOTICE '✓ Guest Admin created successfully!';
  RAISE NOTICE 'Email: test.test@thomsonreuters.com';
  RAISE NOTICE 'Password: changeme';
  RAISE NOTICE 'Role: admin (full access)';

END $$;

-- ========================================
-- Verify Guest Admin
-- ========================================
SELECT
    u.email,
    u.full_name,
    u.role,
    u.shift_role,
    u.status,
    b.name AS bureau,
    u.team
FROM users AS u
LEFT JOIN bureaus AS b ON u.bureau_id = b.id
WHERE u.email = 'test.test@thomsonreuters.com';
