# Leo AI Server

Core backend for Leo AI — a personal AI Assistant Automation Platform.

## Purpose

Exposes a simple Express + TypeScript HTTP server. This is the runtime foundation that future backend modules (authentication, assistant, conversations, tools, etc.) will build upon.

## Technology

- Node.js
- TypeScript
- Express

## Current Scope

Only the minimal Express runtime foundation exists at this stage:

- A single `GET /` endpoint that returns a startup verification message.
- Development, build, and typecheck scripts.

No API routes, database connections, authentication, AI, or business logic have been implemented. Only what is necessary to prove that **Node.js → TypeScript → Express → HTTP** works correctly.

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

| Variable   | Description                            | Default       |
| ---------- | -------------------------------------- | ------------- |
| `NODE_ENV` | Environment mode (e.g., `development`) | `development` |
| `PORT`     | HTTP server port                       | `3001`        |

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
