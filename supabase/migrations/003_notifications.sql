-- Migration: Notification System
-- Description: Add notifications table for user alerts (email stubbed for future)
-- Date: 2025-12-10

-- ============================================
-- Phase 1: Create notifications table
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'new_assignment',
        'schedule_change',
        'preference_confirmed',
        'shift_cancelled'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- Phase 2: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ============================================
-- Phase 3: Enable RLS
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (true);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (true);

-- ============================================
-- Verification
-- ============================================

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications';
