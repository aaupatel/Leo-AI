# Leo AI Database Design

> **Status: PLANNED.** This document defines the intended PostgreSQL schema for Leo AI. No database tables or migrations have been created. The existing `schema_migrations` table is infrastructure managed by the migration runner and is documented separately.

---

## 1. Purpose and Scope

This document describes the planned PostgreSQL schema for Leo AI's application entities. It covers all user-facing data: users, devices, conversations, messages, tasks, reminders, automations, memories, integrations, notifications, and audit events. Sessions/authentication is documented as a future design placeholder only.

Out of scope:
- Migration scripts (to be created in a later task)
- ORM selection (not yet decided)
- Operational concerns (backups, replication, scaling)

---

## 2. PostgreSQL Choice

**Decision:** PostgreSQL is the primary database.

**Rationale:**
- Free, open-source, mature relational database
- Strong support for JSON/JSONB (useful for flexible automation config, integration metadata)
- Native UUID support (`gen_random_uuid()`)
- Robust indexing, constraints, and transactional DDL
- Familiar SQL concepts for learning and maintenance
- No licensing costs; aligns with free/local-first strategy

---

## 3. UUID vs BIGINT Decision and Rationale

**Decision:** Use **UUID (uuid v4)** as primary keys for all application entities.

**Rationale:**
- Globally unique across distributed clients (Windows, Android, future web)
- No coordination needed for ID generation; clients can generate IDs offline
- Non-sequential, preventing enumeration attacks
- Compatible with merge/sync scenarios across devices
- Native PostgreSQL `uuid` type with `gen_random_uuid()` default

**Exceptions:** The infrastructure `schema_migrations` table uses `BIGSERIAL` (managed by the migration runner).

---

## 4. TIMESTAMPTZ Timestamp Strategy

**Decision:** Use `TIMESTAMPTZ` (timestamp with time zone) for all application timestamps.

**Rules:**
- Store all timestamps in UTC; PostgreSQL converts on write/read based on session time zone
- Use `now()` or `CURRENT_TIMESTAMP` for server-side defaults
- Columns: `created_at`, `updated_at` on all application tables
- No `deleted_at` on every table; deletion behavior is explicit per table (see Section 10)

---

## 5. User and Device Relationship

**Relationship:** One User → Many Devices

| Table | Key Columns |
|-------|-------------|
| `users` | `id` (PK, UUID), `email` (unique), `display_name`, `created_at`, `updated_at` |
| `devices` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `name`, `platform` (enum: windows, android, web), `device_token` (unique, nullable), `last_seen_at`, `created_at`, `updated_at` |

**Deletion behavior:** Deleting a user cascades to devices. Devices are bound to a single user.

---

## 6. Sessions / Authentication (Future Design Only)

**Status:** Placeholder for future implementation (Phase 4).

**Planned tables:**
- `sessions`: `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `device_id` (FK → devices.id, ON DELETE SET NULL), `token_hash`, `expires_at`, `created_at`
- `refresh_tokens`: `id` (PK, UUID), `session_id` (FK → sessions.id, ON DELETE CASCADE), `token_hash`, `expires_at`, `created_at`

**Notes:**
- Authentication design is not finalized
- Token storage uses hashes (bcrypt/argon2), never plaintext
- Session cleanup via scheduled job on `expires_at`

---

## 7. Conversations and Messages

**Relationship:** One User → Many Conversations → Many Messages

| Table | Key Columns |
|-------|-------------|
| `conversations` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `title`, `model_provider`, `model_name`, `system_prompt`, `created_at`, `updated_at` |
| `messages` | `id` (PK, UUID), `conversation_id` (FK → conversations.id, ON DELETE CASCADE), `role` (enum: user, assistant, system, tool), `content` (TEXT), `tool_calls` (JSONB, nullable), `tool_call_id` (UUID, nullable), `metadata` (JSONB, nullable), `created_at` |

**Indexes:**
- `conversations(user_id, updated_at DESC)` for listing recent conversations
- `messages(conversation_id, created_at)` for chronological fetch

**Deletion behavior:** Deleting a conversation cascades to its messages.

---

## 8. Tasks and Reminders

**Relationship:** One User → Many Tasks; One Task → Many Reminders

| Table | Key Columns |
|-------|-------------|
| `tasks` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `title`, `description`, `status` (enum: pending, in_progress, completed, cancelled), `priority` (smallint), `due_at` (TIMESTAMPTZ, nullable), `completed_at` (TIMESTAMPTZ, nullable), `created_at`, `updated_at` |
| `reminders` | `id` (PK, UUID), `task_id` (FK → tasks.id, ON DELETE CASCADE), `user_id` (FK → users.id, ON DELETE CASCADE), `trigger_at` (TIMESTAMPTZ), `delivery_method` (enum: push, email, in_app), `payload` (JSONB, nullable), `sent_at` (TIMESTAMPTZ, nullable), `created_at` |

**Notes:**
- `reminders.user_id` denormalized for efficient user-scoped queries without joining tasks
- `sent_at` tracks delivery; `NULL` = pending
- Recurring reminders: store recurrence rule in `payload` (RRULE or custom JSON)

**Indexes:**
- `tasks(user_id, status, due_at)` for active task lists
- `reminders(user_id, trigger_at)` for scheduler queries
- `reminders(trigger_at) WHERE sent_at IS NULL` (partial index) for due reminders

---

## 9. Automations Using Configuration Data, Never Executable Code

**Relationship:** One User → Many Automations

| Table | Key Columns |
|-------|-------------|
| `automations` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `name`, `description`, `trigger_config` (JSONB), `action_config` (JSONB), `conditions` (JSONB, nullable), `enabled` (boolean, default true), `last_run_at` (TIMESTAMPTZ, nullable), `next_run_at` (TIMESTAMPTZ, nullable), `created_at`, `updated_at` |

**Design principle:** `trigger_config`, `action_config`, and `conditions` are **pure JSON configuration** — no executable code, no serialized functions, no eval. The automation engine interprets these configs at runtime.

**Example trigger_config:**
```json
{ "type": "schedule", "cron": "0 9 * * 1-5", "timezone": "America/Los_Angeles" }
```

**Example action_config:**
```json
{ "type": "notification", "title": "Daily Briefing", "body": "Good morning! Here's your schedule." }
```

**Indexes:**
- `automations(user_id, enabled, next_run_at)` for scheduler

---

## 10. Basic Relational Memory

**Relationship:** One User → Many Memories

| Table | Key Columns |
|-------|-------------|
| `memories` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `type` (enum: fact, preference, context, summary), `key` (TEXT), `value` (TEXT), `embedding` (vector, nullable), `source_conversation_id` (FK → conversations.id, ON DELETE SET NULL, nullable), `confidence` (real, default 1.0), `created_at`, `updated_at` |

**Notes:**
- `embedding` column reserved for future pgvector integration (not installed yet)
- `key` + `user_id` + `type` should be unique for fact/preference types (enforced by partial unique index)
- `source_conversation_id` links memory to origin conversation

**Indexes:**
- `memories(user_id, type, key)` unique partial for fact/preference
- `memories(user_id, created_at DESC)` for recent memories

**Deletion behavior:** Hard delete. No soft delete columns.

---

## 11. External Integrations and Secret-Storage Approach

**Relationship:** One User → Many Integrations

| Table | Key Columns |
|-------|-------------|
| `integrations` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `provider` (TEXT, e.g., 'gmail', 'outlook', 'google_calendar'), `display_name`, `config` (JSONB), `credentials_ref` (TEXT, nullable), `status` (enum: connected, disconnected, error), `last_sync_at` (TIMESTAMPTZ, nullable), `created_at`, `updated_at` |

**Secret storage approach:**
- `credentials_ref` stores a **reference** (key ID, vault path, or environment variable name), NOT the secret itself
- Actual secrets stored in OS keyring (Windows Credential Manager, Android Keystore) or external secret manager (e.g., HashiCorp Vault, AWS Secrets Manager) — never in the database
- `config` holds non-sensitive configuration (scopes, sync intervals, folder mappings)

**Indexes:**
- `integrations(user_id, provider)` unique (one integration per provider per user)

---

## 12. Notifications

**Relationship:** One User → Many Notifications

| Table | Key Columns |
|-------|-------------|
| `notifications` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `type` (enum: reminder, automation, system, integration), `title`, `body`, `data` (JSONB, nullable), `priority` (smallint, default 0), `read_at` (TIMESTAMPTZ, nullable), `delivered_at` (TIMESTAMPTZ, nullable), `created_at` |

**Indexes:**
- `notifications(user_id, read_at, created_at DESC)` for inbox queries
- Partial index: `notifications(user_id, created_at DESC) WHERE read_at IS NULL` for unread count

**Deletion behavior:** Hard delete. Old notifications purged by retention policy (future job).

---

## 13. Audit Events

**Relationship:** One User → Many Audit Events

| Table | Key Columns |
|-------|-------------|
| `audit_events` | `id` (PK, UUID), `user_id` (FK → users.id, ON DELETE CASCADE), `event_type` (TEXT), `entity_type` (TEXT, nullable), `entity_id` (UUID, nullable), `action` (TEXT), `metadata` (JSONB, nullable), `ip_address` (INET, nullable), `user_agent` (TEXT, nullable), `created_at` |

**Design:**
- Immutable append-only log; no UPDATE or DELETE allowed on this table
- `entity_type` + `entity_id` provide polymorphic reference (no FK)
- `metadata` captures before/after snapshots for important changes
- Partition by `created_at` (monthly) in production

**Indexes:**
- `audit_events(user_id, created_at DESC)` for user audit trail
- `audit_events(entity_type, entity_id, created_at)` for entity history

---

## 14. User-Data Isolation

All application tables include `user_id` as a foreign key to `users.id` with `ON DELETE CASCADE`.

**Enforcement:**
- Application layer MUST filter every query by `user_id`
- Row-Level Security (RLS) policies planned for PostgreSQL 15+ to enforce at database level
- No cross-user queries permitted in application code

---

## 15. Foreign Keys and ON DELETE Behavior

| Child Table | Parent Table | FK Column | ON DELETE |
|-------------|--------------|-----------|-----------|
| devices | users | user_id | CASCADE |
| sessions | users | user_id | CASCADE |
| sessions | devices | device_id | SET NULL |
| refresh_tokens | sessions | session_id | CASCADE |
| conversations | users | user_id | CASCADE |
| messages | conversations | conversation_id | CASCADE |
| tasks | users | user_id | CASCADE |
| reminders | tasks | task_id | CASCADE |
| reminders | users | user_id | CASCADE |
| automations | users | user_id | CASCADE |
| memories | users | user_id | CASCADE |
| memories | conversations | source_conversation_id | SET NULL |
| integrations | users | user_id | CASCADE |
| notifications | users | user_id | CASCADE |
| audit_events | users | user_id | CASCADE |

**Rationale:** Cascade for owned data; SET NULL only for optional references (device on session, conversation on memory).

---

## 16. Index Strategy

**Principles:**
- Every FK column indexed (automatic in PostgreSQL for PK, explicit for FK)
- Composite indexes match query patterns (user_id + sort column)
- Partial indexes for common filters (unread, unsent, enabled)
- No speculative indexes; add when query plans show need

**Planned indexes (beyond FKs):**

```sql
-- Conversations
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Tasks
CREATE INDEX idx_tasks_user_status_due ON tasks(user_id, status, due_at);

-- Reminders
CREATE INDEX idx_reminders_user_trigger ON reminders(user_id, trigger_at);
CREATE INDEX idx_reminders_due_pending ON reminders(trigger_at) WHERE sent_at IS NULL;

-- Automations
CREATE INDEX idx_automations_user_enabled_next ON automations(user_id, enabled, next_run_at);

-- Memories
CREATE UNIQUE INDEX idx_memories_user_type_key ON memories(user_id, type, key)
  WHERE type IN ('fact', 'preference');
CREATE INDEX idx_memories_user_created ON memories(user_id, created_at DESC);

-- Integrations
CREATE UNIQUE INDEX idx_integrations_user_provider ON integrations(user_id, provider);

-- Notifications
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Audit Events
CREATE INDEX idx_audit_events_user_created ON audit_events(user_id, created_at DESC);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id, created_at);
```

---

## 17. ASCII/Markdown Relationship Diagram

```
┌─────────────┐
│    users    │◄──────────────────────────────────────┐
└──────┬──────┘                                       │
       │                                              │
       ▼                                              │
┌─────────────┐     ┌─────────────┐                   │
│  devices    │     │  sessions   │                   │
└─────────────┘     └──────┬──────┘                   │
                           │                          │
                           ▼                          │
                    ┌─────────────┐                   │
                    │refresh_tkns │                   │
                    └─────────────┘                   │
                                                     │
       ┌─────────────────────────────────────────────┼───────────────┐
       │                                             │               │
       ▼                                             ▼               ▼
┌──────────────┐                            ┌──────────────┐ ┌──────────────┐
│conversations │                            │    tasks     │ │  automations │
└──────┬───────┘                            └──────┬───────┘ └──────┬───────┘
       │                                           │              │
       ▼                                           ▼              │
┌──────────────┐                            ┌──────────────┐      │
│   messages   │                            │  reminders   │      │
└──────────────┘                            └──────────────┘      │
                                                                 │
       ┌─────────────────────────────────────────────────────────┘
       │                              │                    │
       ▼                              ▼                    ▼
┌──────────────┐              ┌──────────────┐    ┌──────────────┐
│   memories   │              │ integrations │    │ notifications│
└──────────────┘              └──────────────┘    └──────────────┘
       │
       │ (optional ref)
       ▼
┌──────────────┐
│conversations │ (source_conversation_id SET NULL)
└──────────────┘

┌──────────────┐
│audit_events  │ (polymorphic entity_type/entity_id, no FK)
└──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   schema_migrations                          │
│  (Infrastructure table — managed by migration runner)       │
│  Columns: version (BIGSERIAL PK), name, applied_at, checksum │
└─────────────────────────────────────────────────────────────┘
```

---

## 18. Proposed Future Migration Order

| Order | Migration | Description |
|-------|-----------|-------------|
| 001 | `create_users` | Users table (foundation) |
| 002 | `create_devices` | Devices (depends on users) |
| 003 | `create_sessions` | Sessions & refresh_tokens (depends on users, devices) |
| 004 | `create_conversations` | Conversations (depends on users) |
| 005 | `create_messages` | Messages (depends on conversations) |
| 006 | `create_tasks` | Tasks (depends on users) |
| 007 | `create_reminders` | Reminders (depends on tasks, users) |
| 008 | `create_automations` | Automations (depends on users) |
| 009 | `create_memories` | Memories (depends on users, conversations) |
| 010 | `create_integrations` | Integrations (depends on users) |
| 011 | `create_notifications` | Notifications (depends on users) |
| 012 | `create_audit_events` | Audit events (depends on users) |
| 013 | `add_indexes` | All composite/partial indexes |
| 014 | `enable_rls` | Row-Level Security policies |

**Notes:**
- `schema_migrations` table is created by the migration runner before migration 001
- Each migration is a single `.sql` file with `UP` and `DOWN` sections
- Migrations run in a transaction; failure rolls back

---

## 19. Existing `schema_migrations` Infrastructure Table

The `schema_migrations` table is **existing infrastructure** created and managed by the migration runner (e.g., golang-migrate, node-pg-migrate, or similar). It is **not** part of this design's application entities.

**Schema (managed by runner):**
```sql
CREATE TABLE schema_migrations (
    version BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    checksum TEXT NOT NULL
);
```

**Purpose:** Tracks which migration scripts have been applied. Do not modify manually. Do not add application columns. The migration runner owns this table entirely.

---

## Summary of Planned Application Tables

| Table | Primary Key | User FK | Cascade Delete | Soft Delete? |
|-------|-------------|---------|----------------|--------------|
| users | UUID | — | — | No |
| devices | UUID | Yes | Yes | No |
| sessions | UUID | Yes | Yes | No (expires_at) |
| refresh_tokens | UUID | via session | Yes | No |
| conversations | UUID | Yes | Yes | No |
| messages | UUID | via conversation | Yes | No |
| tasks | UUID | Yes | Yes | No |
| reminders | UUID | Yes | Yes | No |
| automations | UUID | Yes | Yes | No |
| memories | UUID | Yes | Yes | No |
| integrations | UUID | Yes | Yes | No |
| notifications | UUID | Yes | Yes | No |
| audit_events | UUID | Yes | Yes | No (immutable) |

All tables use UUID PKs, TIMESTAMPTZ timestamps, and explicit FK constraints with documented ON DELETE behavior.