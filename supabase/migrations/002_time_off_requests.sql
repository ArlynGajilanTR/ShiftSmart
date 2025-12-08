-- Migration: Time Off Requests System
-- Description: Add time_off_requests table for employees to enter pre-approved vacation/personal time off
-- Date: 2025-12-08

-- ============================================
-- Phase 1: Create time_off_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'personal', 'sick', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================
-- Phase 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_time_off_requests_user ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

-- ============================================
-- Phase 3: Add auto-update trigger
-- ============================================

CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Phase 4: Enable RLS and create policies
-- ============================================

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view time off" ON time_off_requests
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage time off" ON time_off_requests
FOR ALL USING (true);

-- ============================================
-- Verification queries (run manually to verify)
-- ============================================

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'time_off_requests';
-- SELECT * FROM time_off_requests ORDER BY start_date DESC LIMIT 10;
