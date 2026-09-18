# Leo AI

Leo AI is a personal AI Assistant Automation Platform. It is being developed for Windows first, with Android support planned for a later phase.

## Project Status

Active development — Phase 2 (Backend Foundation).

No application functionality has been implemented yet. The backend foundation (Tasks 03–05) is established with a Node.js + TypeScript + Express server, code quality tooling (ESLint + Prettier), and environment configuration (dotenv).

## Target Platforms

- Windows
- Android

iOS is not part of the project scope.

## Planned Capabilities

The following capabilities are **planned** and **NOT currently implemented**:

- AI conversation
- Voice interaction
- Tasks and reminders
- Email assistance
- Web research
- Notifications
- Memory
- Automation
- Windows integration
- Android integration

## Architecture

The system follows a layered, modular architecture where business logic lives in the backend and clients handle only the user interface and local platform interaction.

```
Client Applications (Windows, Android, Web)
        ↓
Core API
        ↓
Assistant / Orchestration Layer
        ↓
Tools / Services
        ↓
Database / External Integrations
```

See [docs/architecture.md](docs/architecture.md) for the full architecture specification.

### Repository Structure

```
Leo-AI/
│
├── apps/
│   ├── web/       → Future browser/web interface
│   ├── windows/   → Future Windows desktop client
│   └── android/   → Future Android client
│
├── server/        → Backend runtime (Express + TypeScript)
├── shared/        → Future shared types, contracts, and utilities
├── docs/          → Architecture and technical documentation
├── scripts/       → Future development/maintenance scripts
│
├── README.md
├── LICENSE
└── .gitignore
```

## Development Philosophy

- **Local-first** where practical — keep user data on the user's own machine.
- **Free / open-source tools** where practical — avoid unnecessary licensing costs.
- **No mandatory paid services** — all core features should work without paid tiers.
- **Modular architecture** — keep components loosely coupled so they can be built, tested, and replaced independently.
- **Security and user confirmation** for sensitive actions — never perform destructive or privacy-sensitive operations without explicit user approval.
- **Incremental development** — build the smallest useful piece, then expand.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `dev`  | Active development |
| `test` | Code undergoing integration / manual testing before production |
| `main` | Production-ready code only |

Development flow: `dev` → `test` → `main`

## Current Phase

Phase 2 — Backend Foundation

See the [development roadmap](docs/architecture.md#13-future-development-phases).

## Repository

https://github.com/aaupatel/Leo-AI
