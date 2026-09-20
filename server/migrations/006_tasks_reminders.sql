-- 006_tasks_reminders.sql
-- Create tasks and reminders tables

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority SMALLINT NOT NULL DEFAULT 0,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for active task lists by user, status, and due date
CREATE INDEX idx_tasks_user_status_due ON tasks(user_id, status, due_at);

CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trigger_at TIMESTAMPTZ NOT NULL,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('push', 'email', 'in_app')),
    payload JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user-scoped reminder scheduling queries
CREATE INDEX idx_reminders_user_trigger ON reminders(user_id, trigger_at);

-- Partial index for pending reminders due for delivery
CREATE INDEX idx_reminders_due_pending ON reminders(trigger_at) WHERE sent_at IS NULL;