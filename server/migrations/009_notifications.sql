-- 009_notifications.sql
-- Create notifications table

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'automation', 'system', 'integration')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    priority SMALLINT NOT NULL DEFAULT 0,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for inbox queries
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, read_at, created_at DESC);

-- Partial index for unread count
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;