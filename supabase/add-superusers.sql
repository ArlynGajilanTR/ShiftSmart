-- Add Rob Lang and Rafal Nowak as superusers
-- Both users have admin role with full access
-- Password: testtest (same hash as dev admin)

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
  -- Add Rob Lang as superuser
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
    'rob.lang@thomsonreuters.com',
    'Rob Lang',
    'Superuser Administrator',
    'editor',
    milan_bureau_id,
    'Breaking News',
    'active',
    'admin',
    '$2b$10$t17jXItvi.efFh/LvBn8MeRXPSDxQOPqVTLzLGgFM9s8DH2zPviIC'
  ) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    shift_role = 'editor',
    full_name = EXCLUDED.full_name,
    title = EXCLUDED.title,
    status = 'active',
    updated_at = NOW();

  RAISE NOTICE '✓ Rob Lang created successfully!';
  RAISE NOTICE 'Email: rob.lang@thomsonreuters.com';
  RAISE NOTICE 'Password: testtest';
  RAISE NOTICE 'Role: admin (full access)';

  -- ========================================
  -- Add Rafal Nowak as superuser
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
    'RafalWojciech.Nowak@thomsonreuters.com',
    'Rafal Wojciech Nowak',
    'Superuser Administrator',
    'editor',
    milan_bureau_id,
    'Breaking News',
    'active',
    'admin',
    '$2b$10$t17jXItvi.efFh/LvBn8MeRXPSDxQOPqVTLzLGgFM9s8DH2zPviIC'
  ) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    shift_role = 'editor',
    full_name = EXCLUDED.full_name,
    title = EXCLUDED.title,
    status = 'active',
    updated_at = NOW();

  RAISE NOTICE '✓ Rafal Wojciech Nowak created successfully!';
  RAISE NOTICE 'Email: RafalWojciech.Nowak@thomsonreuters.com';
  RAISE NOTICE 'Password: testtest';
  RAISE NOTICE 'Role: admin (full access)';

END $$;

-- ========================================
-- Verify all superusers
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
WHERE u.email IN (
    'arlyn.gajilan@thomsonreuters.com',
    'rob.lang@thomsonreuters.com',
    'RafalWojciech.Nowak@thomsonreuters.com'
)
ORDER BY u.email;
