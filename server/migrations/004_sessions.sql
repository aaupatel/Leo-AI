-- 004_sessions.sql
-- Create sessions and refresh_tokens tables

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user-scoped session queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Index for device-scoped session queries
CREATE INDEX idx_sessions_device_id ON sessions(device_id);

-- Index for session expiry cleanup
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session-scoped refresh token queries
CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(session_id);

-- Index for refresh token expiry cleanup
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);