# Leo AI Server

Core backend for Leo AI — a personal AI Assistant Automation Platform.

## Purpose

Exposes a simple Express + TypeScript HTTP server. This is the runtime foundation that future backend modules (authentication, assistant, conversations, tools, etc.) will build upon.

## Technology

- Node.js
- TypeScript
- Express

## Current Scope

Only the following exists at this stage:

- A single `GET /` endpoint that returns a startup verification message.
- Development, build, and typecheck scripts.
- Code quality tooling (ESLint + Prettier).
- Environment configuration via `dotenv`.
- PostgreSQL connection pool with a `SELECT 1` connectivity test.

No API routes, authentication, AI, or business logic have been implemented. Only what is necessary to prove that **Node.js → TypeScript → Express → PostgreSQL** works correctly.

## Prerequisites

- Node.js (v22 or later recommended)
- npm

## Install Dependencies

```bash
cd server
npm install
```

## Configuration

The backend uses `dotenv` to load environment variables from a `server/.env` file. A template is provided:

- `.env.example` — example configuration (committed, safe to share)
- `.env` — local configuration (ignored by Git, must never be committed)

### Environment Variables

| Variable       | Description                            | Default       |
| -------------- | -------------------------------------- | ------------- |
| `NODE_ENV`     | Environment mode (e.g., `development`) | `development` |
| `PORT`         | HTTP server port                       | `3001`        |
| `DATABASE_URL` | PostgreSQL connection string           | (none)        |

### Validation

- `PORT` must be a valid integer between 1 and 65535. An invalid value causes a clear startup error.
- If `PORT` is missing, it defaults to `3001`.
- If `NODE_ENV` is missing, it defaults to `development`.

### `.env`

Create a local `.env` file for development:

```bash
cp .env.example .env
```

> **Important:** The `.env` file contains local configuration and must not be committed. It is ignored by Git via `.gitignore`.

## Development Server

Runs the TypeScript server directly using `tsx` (no manual compilation required):

```bash
npm run dev
```

The server starts on port **3001** (or the port specified in `PORT` environment variable).

## Build

Compiles TypeScript into `dist/`:

```bash
npm run build
```

## Production Start

Runs the compiled JavaScript from `dist/`:

```bash
npm run start
```

## Typecheck

Checks TypeScript types without producing output:

```bash
npm run typecheck
```

## Code Quality

### Linting (ESLint)

ESLint checks source code for correctness issues. TypeScript-aware rules are enabled via `typescript-eslint`. ESLint configuration lives in `eslint.config.mjs`.

```bash
npm run lint        # check source code
npm run lint:fix    # automatically fix safe issues
```

### Formatting (Prettier)

Prettier handles code formatting. Formatting configuration lives in `.prettierrc`.

```bash
npm run format          # format source files
npm run format:check    # verify formatting without changing files
```

### Typecheck

```bash
npm run typecheck
```

## Port

Default development port: **3001**

## Database

PostgreSQL is the planned primary database for Leo AI. The `pg` Node.js driver is used for direct connection (no ORM).

### Connection

Configuration is centralized — the `DATABASE_URL` environment variable is read from the configuration module (`src/config/index.ts`), not directly from `process.env` in database code.

### Connection Pool

The database module (`src/database/index.ts`) creates a single reusable `Pool` instance with reasonable development defaults:

- `max`: 10 connections
- `idleTimeoutMillis`: 30 000 ms
- `connectionTimeoutMillis`: 5 000 ms

### Connectivity Test

On startup, the server runs `SELECT 1` to verify PostgreSQL is reachable. A successful connection logs `Database connection established.` A failure logs `Database connection failed.` with a sanitized error message (connection strings are redacted). The server still starts even if the database is unavailable.

### Shutdown

On `SIGINT` or `SIGTERM`, the connection pool closes gracefully before the process exits.

### `.env`

Add your PostgreSQL connection string to `server/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/leo_ai
```

> **No database schema or application tables have been implemented yet.**

## Database Migrations

Migrations are plain SQL files stored in `server/migrations/`. Files are numbered for ordering (e.g., `001_initial.sql`).

### Migration Tracking

A `schema_migrations` table records which migrations have been applied. This table is created automatically by the migration runner — it is **not** a migration file.

### Running Migrations

```bash
npm run db:migrate
```

Migrations do **not** run automatically when the server starts.

### How It Works

1. The runner ensures `schema_migrations` exists.
2. Migration files are discovered and sorted by filename.
3. Each pending migration runs inside a transaction (`BEGIN` → SQL → record → `COMMIT`).
4. Failed migrations are rolled back (`ROLLBACK`) and not recorded.
5. The same migration never runs twice.

### Current Migrations

No application tables have been created. The only database infrastructure is the `schema_migrations` tracking table.

## Planned Modules (Future)

The following modules are documented in the architecture but NOT yet implemented:

- authentication
- assistant
- conversations
- tasks
- reminders
- memory
- automation
- notifications
- integrations
- tools
- permissions
- audit logs
