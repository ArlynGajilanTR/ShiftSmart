-- Setup Breaking News Team Bureaus for ShiftSmart MVP
-- Run this in Supabase SQL Editor

-- Create Milan Bureau
INSERT INTO bureaus (name, code, timezone, settings)
VALUES (
  'Milan',
  'MILAN',
  'Europe/Rome',
  '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": true,
    "shift_duration_hours": 8
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Create Rome Bureau
INSERT INTO bureaus (name, code, timezone, settings)
VALUES (
  'Rome',
  'ROME',
  'Europe/Rome',
  '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": true,
    "shift_duration_hours": 8
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Verify bureaus were created
SELECT id, name, code, timezone 
FROM bureaus 
ORDER BY name;

-- Now you can sign up users and they'll see Milan and Rome as bureau options
-- All users will automatically be assigned to "Breaking News" team

