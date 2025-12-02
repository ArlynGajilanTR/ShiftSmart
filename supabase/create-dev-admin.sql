-- Create dev admin user for testing/demo
-- Email: arlyn.gajilan@thomsonreuters.com
-- Password: testtest
-- Role: admin (full access to all parts of the app)

DO $$
DECLARE
  milan_bureau_id UUID;
BEGIN
  -- Get Milan bureau ID (or any bureau if Milan doesn't exist)
  SELECT id INTO milan_bureau_id FROM bureaus WHERE code = 'ITA-MILAN' LIMIT 1;

  IF milan_bureau_id IS NULL THEN
    SELECT id INTO milan_bureau_id FROM bureaus LIMIT 1;
  END IF;

  -- Delete old user with incorrect email format (without .com)
  DELETE FROM users WHERE email = 'arlyn.gajilan@thomsonreuters';

  -- Insert or update dev user with admin access
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
    'arlyn.gajilan@thomsonreuters.com',
    'Arlyn Gajilan (Dev Admin)',
    'Development Administrator',
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

  RAISE NOTICE '✓ Dev admin user created successfully!';
  RAISE NOTICE 'Email: arlyn.gajilan@thomsonreuters.com';
  RAISE NOTICE 'Password: testtest';
  RAISE NOTICE 'Role: admin (full access to all parts of app)';
  RAISE NOTICE 'Shift Role: editor (highest scheduling level)';
END $$;

-- Verify the user was created
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
WHERE u.email = 'arlyn.gajilan@thomsonreuters.com';
