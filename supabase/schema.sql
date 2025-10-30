-- ShiftSmart Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bureaus (Organizations/Departments)
CREATE TABLE bureaus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  settings JSONB DEFAULT '{
    "min_senior_per_shift": 1,
    "max_junior_per_shift": 3,
    "require_lead": true,
    "shift_duration_hours": 8
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'scheduler', 'staff')),
  shift_role VARCHAR(50) NOT NULL CHECK (shift_role IN ('senior', 'junior', 'lead', 'support')),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule Periods
CREATE TABLE schedule_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('week', 'month', 'quarter', 'special_event')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  schedule_period_id UUID REFERENCES schedule_periods(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  required_staff INTEGER DEFAULT 1,
  required_roles JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_shift_time CHECK (end_time > start_time)
);

-- Shift Assignments
CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'declined', 'completed')),
  assigned_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shift_id, user_id)
);

-- Conflicts
CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'double_booking',
    'preference_violation',
    'role_imbalance',
    'overtime_risk',
    'insufficient_coverage',
    'rest_period_violation',
    'skill_gap'
  )),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('soft', 'hard')),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_bureau ON users(bureau_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_shifts_bureau ON shifts(bureau_id);
CREATE INDEX idx_shifts_time_range ON shifts(start_time, end_time);
CREATE INDEX idx_shifts_schedule_period ON shifts(schedule_period_id);
CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX idx_shift_assignments_user ON shift_assignments(user_id);
CREATE INDEX idx_conflicts_shift ON conflicts(shift_id);
CREATE INDEX idx_conflicts_user ON conflicts(user_id);
CREATE INDEX idx_conflicts_resolved ON conflicts(resolved);
CREATE INDEX idx_schedule_periods_bureau ON schedule_periods(bureau_id);
CREATE INDEX idx_schedule_periods_dates ON schedule_periods(start_date, end_date);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_bureaus_updated_at BEFORE UPDATE ON bureaus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_periods_updated_at BEFORE UPDATE ON schedule_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at BEFORE UPDATE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
-- Users can read their own bureau
CREATE POLICY "Users can view their bureau" ON bureaus
  FOR SELECT USING (
    id IN (SELECT bureau_id FROM users WHERE id = auth.uid())
  );

-- Users can view users in their bureau
CREATE POLICY "Users can view bureau members" ON users
  FOR SELECT USING (
    bureau_id IN (SELECT bureau_id FROM users WHERE id = auth.uid())
  );

-- Users can view shifts in their bureau
CREATE POLICY "Users can view bureau shifts" ON shifts
  FOR SELECT USING (
    bureau_id IN (SELECT bureau_id FROM users WHERE id = auth.uid())
  );

-- Managers and schedulers can insert/update shifts
CREATE POLICY "Managers can manage shifts" ON shifts
  FOR ALL USING (
    bureau_id IN (
      SELECT bureau_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager', 'scheduler')
    )
  );

