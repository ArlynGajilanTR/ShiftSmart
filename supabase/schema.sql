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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    worker_id VARCHAR(50),
    -- System role for permissions
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (
        role IN ('admin', 'manager', 'scheduler', 'staff')
    ),
    -- Editorial role (from CSV "Position" field)
    title VARCHAR(255) NOT NULL, -- e.g., "Senior Breaking News Correspondent"
    -- Normalized shift role for scheduling
    shift_role VARCHAR(50) NOT NULL CHECK (
        shift_role IN ('editor', 'senior', 'correspondent')
    ),
    bureau_id UUID REFERENCES bureaus (id) ON DELETE CASCADE,
    team VARCHAR(100) DEFAULT 'Breaking News',
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('active', 'on-leave', 'inactive')
    ),
    -- Minimal auth (no Supabase Auth dependency)
    password_hash VARCHAR(255),
    session_token VARCHAR(255),
    session_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Schedule Periods
CREATE TABLE schedule_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bureau_id UUID REFERENCES bureaus (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (
        type IN ('week', 'month', 'quarter', 'special_event')
    ),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'published', 'archived')
    ),
    created_by UUID REFERENCES users (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Shifts
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bureau_id UUID REFERENCES bureaus (id) ON DELETE CASCADE,
    schedule_period_id UUID REFERENCES schedule_periods (id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    required_staff INTEGER DEFAULT 1,
    required_roles JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'published', 'completed', 'cancelled')
    ),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_shift_time CHECK (end_time > start_time)
);

-- Shift Assignments
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'confirmed', 'declined', 'completed')
    ),
    assigned_by UUID REFERENCES users (id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (shift_id, user_id)
);

-- Shift Preferences (employee availability and preferences)
CREATE TABLE shift_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE UNIQUE,
    -- Array of day names: ['Monday', 'Tuesday']
    preferred_days TEXT [] DEFAULT '{}',
    -- Array: ['Morning', 'Afternoon', 'Evening', 'Night']
    preferred_shifts TEXT [] DEFAULT '{}',
    max_shifts_per_week INTEGER DEFAULT 5,
    notes TEXT, -- Additional preferences/constraints
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conflicts (matches frontend expectations)
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'Double Booking',
        'Rest Period Violation',
        'Skill Gap',
        'Understaffed',
        'Overtime Warning',
        'Cross-Bureau Conflict',
        'Preference Violation'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    status VARCHAR(50) NOT NULL DEFAULT 'unresolved' CHECK (
        status IN ('unresolved', 'acknowledged', 'resolved')
    ),
    shift_id UUID REFERENCES shifts (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id) ON DELETE SET NULL, -- Optional employee
    description TEXT NOT NULL, -- Human-readable explanation
    date DATE NOT NULL, -- Date of the conflict
    details JSONB DEFAULT '{}', -- Additional context (affected shifts, etc.)
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users (id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users (id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_bureau ON users (bureau_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_session_token ON users (session_token);
CREATE INDEX idx_shifts_bureau ON shifts (bureau_id);
CREATE INDEX idx_shifts_time_range ON shifts (start_time, end_time);
CREATE INDEX idx_shifts_schedule_period ON shifts (schedule_period_id);
CREATE INDEX idx_shift_assignments_shift ON shift_assignments (shift_id);
CREATE INDEX idx_shift_assignments_user ON shift_assignments (user_id);
CREATE INDEX idx_shift_preferences_user ON shift_preferences (user_id);
CREATE INDEX idx_conflicts_shift ON conflicts (shift_id);
CREATE INDEX idx_conflicts_user ON conflicts (user_id);
CREATE INDEX idx_conflicts_status ON conflicts (status);
CREATE INDEX idx_conflicts_severity ON conflicts (severity);
CREATE INDEX idx_conflicts_date ON conflicts (date);
CREATE INDEX idx_schedule_periods_bureau ON schedule_periods (bureau_id);
CREATE INDEX idx_schedule_periods_dates ON schedule_periods (
    start_date, end_date
);

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

CREATE TRIGGER update_shift_preferences_updated_at BEFORE UPDATE ON shift_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies Configuration
-- Note: Using minimal auth (not Supabase Auth), so auth.uid() is not available
-- For internal app with trusted users, we use permissive policies
-- TODO: Implement proper RLS after custom auth is in place

-- Permissive policies for internal use (all authenticated users can access)
CREATE POLICY "Authenticated users can view all bureaus" ON bureaus
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view all users" ON users
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view all shifts" ON shifts
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage shifts" ON shifts
FOR ALL USING (true);

CREATE POLICY "Authenticated users can view shift assignments" ON shift_assignments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage shift assignments" ON shift_assignments
FOR ALL USING (true);

CREATE POLICY "Authenticated users can view preferences" ON shift_preferences
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage preferences" ON shift_preferences
FOR ALL USING (true);

CREATE POLICY "Authenticated users can view conflicts" ON conflicts
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage conflicts" ON conflicts
FOR ALL USING (true);
