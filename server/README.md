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
