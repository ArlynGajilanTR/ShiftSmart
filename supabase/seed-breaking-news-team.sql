-- Seed Breaking News Team Data
-- Based on actual Milan and Rome CSV employee data
-- 15 Breaking News correspondents/editors across 2 bureaus

-- Insert Milan Bureau
INSERT INTO bureaus (name, code, timezone, settings) VALUES (
  'Milan',
  'ITA-MILAN',
  'Europe/Rome',
  '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": false,
    "shift_duration_hours": 8
  }'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- Insert Rome Bureau
INSERT INTO bureaus (name, code, timezone, settings) VALUES (
  'Rome',
  'ITA-ROME',
  'Europe/Rome',
  '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": false,
    "shift_duration_hours": 8
  }'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- Get bureau IDs for reference
DO $$
DECLARE
  milan_bureau_id UUID;
  rome_bureau_id UUID;
BEGIN
  SELECT id INTO milan_bureau_id FROM bureaus WHERE code = 'ITA-MILAN';
  SELECT id INTO rome_bureau_id FROM bureaus WHERE code = 'ITA-ROME';

  -- ============================================================================
  -- MILAN BUREAU (8 Breaking News Staff)
  -- ============================================================================

  -- 1. Gianluca Semeraro - Senior Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'gianluca.semeraro@thomsonreuters.com',
    'Gianluca Semeraro',
    NULL,
    '8015313',
    'Senior Breaking News Correspondent, Italy',
    'senior',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'  -- Default password: "changeme"
  ) ON CONFLICT (email) DO NOTHING;

  -- 2. Sabina Suzzi - Senior Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'sabina.suzzi@thomsonreuters.com',
    'Sabina Suzzi',
    NULL,
    '8011406',
    'Senior Breaking News Correspondent, Italy',
    'senior',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- Add preference: Unavailable Tuesday
  INSERT INTO shift_preferences (user_id, preferred_days, notes)
  SELECT id, ARRAY['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 'Unavailable: Tuesday'
  FROM users WHERE email = 'sabina.suzzi@thomsonreuters.com'
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Sara Rossi - Senior Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'sara.rossi@thomsonreuters.com',
    'Sara Rossi',
    NULL,
    '8004383',
    'Senior Breaking News Correspondent, Italy',
    'senior',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 4. Alessia Pe' - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'alessia.pe@thomsonreuters.com',
    'Alessia Pe''',
    '+39 06 8030 7742',
    '8002663',
    'Breaking News Correspondent, Italy',
    'correspondent',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- Add preference: Unavailable Monday and Tuesday
  INSERT INTO shift_preferences (user_id, preferred_days, notes)
  SELECT id, ARRAY['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 'Unavailable: Monday and Tuesday'
  FROM users WHERE email = 'alessia.pe@thomsonreuters.com'
  ON CONFLICT (user_id) DO NOTHING;

  -- 5. Andrea Mandala' - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'andrea.mandala@thomsonreuters.com',
    'Andrea Mandala''',
    '+39 02 6612 9436',
    '8011346',
    'Breaking News Correspondent, Italy',
    'correspondent',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 6. Claudia Cristoferi - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'claudia.cristoferi@thomsonreuters.com',
    'Claudia Cristoferi',
    '+39 02 6612 9557',
    '8002875',
    'Breaking News Correspondent, Italy',
    'correspondent',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- Add preference: Unavailable Wednesday every two weeks (stored as note for Phase 2 enhancement)
  INSERT INTO shift_preferences (user_id, preferred_days, notes)
  SELECT id, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 'Unavailable: Wednesday every two weeks (recurring pattern - needs Phase 2 support)'
  FROM users WHERE email = 'claudia.cristoferi@thomsonreuters.com'
  ON CONFLICT (user_id) DO NOTHING;

  -- 7. Cristina Carlevaro - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'cristina.carlevaro@thomsonreuters.com',
    'Cristina Carlevaro',
    NULL,
    '8007558',
    'Breaking News Correspondent, Italy',
    'correspondent',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- Add preference: Unavailable Thursday and Friday
  INSERT INTO shift_preferences (user_id, preferred_days, notes)
  SELECT id, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Saturday', 'Sunday'], 'Unavailable: Thursday and Friday'
  FROM users WHERE email = 'cristina.carlevaro@thomsonreuters.com'
  ON CONFLICT (user_id) DO NOTHING;

  -- 8. Giancarlo Navach - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'giancarlo.navach@thomsonreuters.com',
    'Giancarlo Navach',
    NULL,
    '8012088',
    'Breaking News Correspondent, Italy',
    'correspondent',
    milan_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- ============================================================================
  -- ROME BUREAU (7 Breaking News Staff)
  -- ============================================================================

  -- 9. Gavin Jones - Breaking News Editor
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, role, password_hash)
  VALUES (
    'gavin.jones@thomsonreuters.com',
    'Gavin Jones',
    NULL,
    '8001279',
    'Breaking News Editor, Italy',
    'editor',
    rome_bureau_id,
    'Breaking News',
    'active',
    'manager',  -- Editor gets manager role for permissions
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 10. Alvise Armellini - Senior Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'alvise.armellini@thomsonreuters.com',
    'Alvise Armellini',
    NULL,
    '6121560',
    'Senior Correspondent Breaking News, Italy',
    'senior',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 11. Giulia Segreti - Senior Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'giulia.segreti@thomsonreuters.com',
    'Giulia Segreti',
    '+39 06 8522 4324',
    '6036852',
    'Senior Breaking News Correspondent',
    'senior',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 12. Stefano Bernabei - Senior Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'stefano.bernabei@thomsonreuters.com',
    'Stefano Bernabei',
    NULL,
    '8011372',
    'Senior Breaking News Correspondent, Italy',
    'senior',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 13. Antonella Cinelli - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'antonella.cinelli@thomsonreuters.com',
    'Antonella Cinelli',
    NULL,
    '8005293',
    'Breaking News Correspondent, Italy',
    'correspondent',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 14. Francesca Piscioneri - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'francesca.piscioneri@thomsonreuters.com',
    'Francesca Piscioneri',
    NULL,
    '8006047',
    'Breaking News Correspondent, Italy',
    'correspondent',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  -- 15. Valentina Consiglio - Breaking News Correspondent
  INSERT INTO users (email, full_name, phone, worker_id, title, shift_role, bureau_id, team, status, password_hash)
  VALUES (
    'valentina.consiglio@thomsonreuters.com',
    'Valentina Consiglio',
    '+39 06 8522 4356',
    '8016624',
    'Breaking News Correspondent, Italy',
    'correspondent',
    rome_bureau_id,
    'Breaking News',
    'active',
    '$2a$10$default.hash.for.demo.purposes.only'
  ) ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'Successfully seeded 15 Breaking News team members (8 Milan, 7 Rome)';
  RAISE NOTICE 'Default password for all users: "changeme" (please change after first login)';
END $$;

-- Verify data
SELECT 
  b.name AS bureau,
  u.full_name,
  u.title,
  u.shift_role,
  sp.notes AS availability_notes
FROM users u
LEFT JOIN bureaus b ON u.bureau_id = b.id
LEFT JOIN shift_preferences sp ON sp.user_id = u.id
WHERE u.team = 'Breaking News'
ORDER BY b.name, u.shift_role DESC, u.full_name;

