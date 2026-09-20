-- 011_audit_events.sql
-- Create audit_events table

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    action TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user audit trail
CREATE INDEX idx_audit_events_user_created ON audit_events(user_id, created_at DESC);

-- Index for entity history (polymorphic reference)
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id, created_at);