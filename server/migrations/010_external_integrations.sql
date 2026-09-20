-- 010_external_integrations.sql
-- Create integrations table

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    credentials_ref TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index: one integration per provider per user
CREATE UNIQUE INDEX idx_integrations_user_provider ON integrations(user_id, provider);