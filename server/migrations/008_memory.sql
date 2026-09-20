-- 008_memory.sql
-- Create memories table

CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fact', 'preference', 'context', 'summary')),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    -- embedding column reserved for future pgvector integration (not installed yet)
    -- using BYTEA as placeholder; alter to vector when pgvector is installed
    embedding BYTEA,
    source_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    confidence REAL NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique partial index for fact/preference types per user
CREATE UNIQUE INDEX idx_memories_user_type_key ON memories(user_id, type, key)
    WHERE type IN ('fact', 'preference');

-- Index for recent memories by user
CREATE INDEX idx_memories_user_created ON memories(user_id, created_at DESC);