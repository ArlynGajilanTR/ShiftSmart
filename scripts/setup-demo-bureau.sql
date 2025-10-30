-- Quick setup script for ShiftSmart demo bureau
-- Run this in Supabase SQL Editor

-- 1. Create a demo bureau
INSERT INTO bureaus (name, code, timezone, settings)
VALUES (
  'Main Editorial',
  'MAIN',
  'America/New_York',
  '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": true,
    "shift_duration_hours": 8
  }'::jsonb
)
RETURNING id;

-- 2. After getting the bureau ID from above, update your user
-- Replace 'YOUR_EMAIL@example.com' with your actual email
-- Replace 'BUREAU_ID_FROM_ABOVE' with the ID returned above

-- UPDATE users 
-- SET bureau_id = 'BUREAU_ID_FROM_ABOVE'
-- WHERE email = 'YOUR_EMAIL@example.com';

-- 3. Verify it worked
SELECT u.email, u.full_name, b.name as bureau_name, b.code as bureau_code
FROM users u
LEFT JOIN bureaus b ON u.bureau_id = b.id
WHERE u.email = 'YOUR_EMAIL@example.com';

