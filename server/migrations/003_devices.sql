-- 003_devices.sql
-- Create devices table

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('windows', 'android', 'web')),
    device_token VARCHAR(255) UNIQUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user-scoped device queries
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Index for device token lookups (already unique, but explicit for clarity)
CREATE INDEX idx_devices_device_token ON devices(device_token);