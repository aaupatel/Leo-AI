# Leo AI Architecture

> **Status: PLANNED.** This document defines the intended architecture for Leo AI. No application code has been implemented yet. Only the repository structure and documentation exist.

---

## 1. Project Overview

Leo AI is a personal AI Assistant Automation Platform designed to provide a single personal assistant that works across:

- **Windows** laptops (primary platform)
- **Android** phones (secondary platform)

The platform will eventually support text interaction, voice interaction, task management, reminders, email assistance, web search, notifications, memory, automation, and controlled system operations.

**Current phase:** Phase 1 — Application Workspace Architecture (repository structure and architectural documentation only).

---

## 2. Long-Term System Architecture

The system is organized as a layered, modular architecture:

```
Client Applications (Windows, Android, Web)
        ↓
Core API (REST/gRPC/gRPC-web/WebSocket)
        ↓
Assistant / Orchestration Layer
        ↓
Tools / Services
        ↓
Database / External Integrations
```

### Layers

| Layer | Responsibility |
|-------|---------------|
| **Client Applications** | User interface, user interaction, local platform capabilities, backend communication. |
| **Core API** | Standardizes how clients communicate with the backend. Exposes endpoints for all assistant features. |
| **Assistant / Orchestration Layer** | Coordinates user requests, conversation flow, and tool invocation. Acts as the central decision-making hub. |
| **Tools / Services** | Encapsulates discrete actions (file operations, system commands, email, web search, etc.). Each tool exposes a single well-defined capability. |
| **Database / External Integrations** | Persistent storage (PostgreSQL) and connections to external services. |

Business logic lives in the backend layers, never inside client applications.

---

## 3. Client Architecture

### 3.1 Windows Client (`apps/windows`)

- Displays the assistant interface.
- Receives user commands (text and eventually voice).
- Interacts with the local Windows system through controlled tools exposed via the backend.
- Communicates with the Leo AI backend API.

**Technology decision:** Pending. Will prefer Electron-compatible or alternative desktop shell technologies aligned with the JavaScript/TypeScript/React/Node.js skill set. Electron and Tauri will NOT be installed until a later task.

### 3.2 Android Client (`apps/android`)

- Displays the assistant interface.
- Receives text and voice commands.
- Shows notifications.
- Communicates with the Leo AI backend API.

**Technology decision:** Pending. Will be selected based on free tooling, compatibility with the Windows development environment, ability to reuse TypeScript/React knowledge, and ability to communicate with the core backend.

### 3.3 Web Client (`apps/web`)

- Browser-based read-only or lightweight interaction interface.
- Communicates with the Leo AI backend API.

**Technology decision:** Pending.

### 3.4 Architectural Rule

> **No business logic lives inside any client application.**

Clients handle only:

- User interface
- User interaction
- Local platform capabilities
- Communication with the backend

All shared business logic resides in the backend or in the `shared/` module as types/contracts only.

---

## 4. Backend Architecture

### 4.1 Technology

- **Runtime:** Node.js
- **Language:** TypeScript

### 4.2 Planned Modules

| Module | Description |
|--------|-------------|
| authentication | User identity and session management. |
| assistant | Conversation orchestration and AI coordination. |
| conversations | Message history and conversation management. |
| tasks | Task and to-do management. |
| reminders | Reminder scheduling and delivery. |
| memory | Long-term and short-term memory storage and retrieval. |
| automation | Rule-based and event-driven automation. |
| notifications | Cross-platform notification delivery. |
| integrations | Third-party service connectors (email, calendar, etc.). |
| tools | Tool registration, discovery, and dispatch. |
| permissions | Fine-grained access control and capability management. |
| audit logs | Immutable record of important system events. |

> These modules are **PLANNED** only. None have been implemented.

---

## 5. Database Architecture

### 5.1 Primary Database

- **Planned:** PostgreSQL
- **Rationale:** Free, open-source, relational, suitable for structured assistant data, familiar SQL concepts, useful for learning and maintenance.

### 5.2 Rules

- PostgreSQL packages will NOT be installed in this task.
- No database tables or migrations have been created.
- No ORM has been selected.

---

## 6. AI Provider Abstraction

### 6.1 Principle

Leo AI must prioritize free and locally runnable AI solutions. The project should NOT become dependent on a paid AI API.

### 6.2 Strategy

The AI provider must be **abstracted** so that the specific model or service can be replaced at any time without affecting the rest of the system. The abstraction layer will allow:

- Locally running models
- Free model providers (where appropriate)
- Configurable provider selection

### 6.3 Rules

- No AI SDK has been installed.
- No connection has been made to any AI provider.
- No final AI model has been chosen.

---

## 7. Tool Architecture Concept

Tools encapsulate discrete actions (file operations, system commands, email sending, web search, etc.).

### 7.1 Principles

- Each tool exposes a single, well-defined capability.
- Tools have **defined capabilities** — the AI does not receive arbitrary system access.
- The AI **requests** tools rather than directly controlling the operating system.
- Dangerous or destructive operations require **explicit user confirmation** before execution.

### 7.2 Future Development

The tool/permission system will be defined in Phase 9 of the roadmap.

---

## 8. Security Principles

Leo AI will eventually perform actions on behalf of the user. The following principles will govern all sensitive operations:

- **Least privilege** — Tools and services operate with the minimum permissions necessary.
- **Explicit permission** — Each sensitive operation requires explicit user approval.
- **User confirmation** — High-impact actions require manual confirmation before execution.
- **Audit logging** — All important actions are recorded immutably.
- **Secure secret storage** — Secrets are never stored in source code or environment files committed to the repository.
- **No arbitrary command execution** — The AI never receives direct shell or OS command access. Actions are mediated through defined tools with bounded capabilities.
- **Tool capability declaration** — Tools must declare their exact capabilities so the system can enforce and audit them.

> No security system has been implemented yet.

---

## 9. Windows Strategy

- The Windows client is the primary target platform.
- The desktop shell technology (Electron, Tauri, or alternative) will be selected in a later task after requirements are evaluated.
- System operations on Windows will be performed through the backend's controlled tool interfaces only.
- No desktop application code has been created.

---

## 10. Android Strategy

- The Android client is the secondary target platform.
- Implementation will be decided in a future task based on tooling cost, environment compatibility, code reuse, and backend integration.
- Android-specific functionality will be isolated behind controlled interfaces.
- No Android application code has been created.

---

## 11. Shared Code Strategy

- The `shared/` directory will contain TypeScript types, contracts (interfaces, schemas, DTOs), and utility functions that are used by both clients and the server.
- Business logic will NOT be placed in `shared/` — only types and contracts.
- Clients will not duplicate backend logic; they will consume the Core API.

---

## 12. Free / Local-First Strategy

The project prioritizes:

- Open-source software
- Free software
- Local execution (keeping user data on the user's own machine)
- Free APIs where practical
- Self-hosted services where practical

The architecture avoids:

- Paid cloud hosting (as a mandatory dependency)
- Paid databases (PostgreSQL is free)
- Paid AI APIs (abstraction allows free/local options)
- Paid automation services

> No paid service should become a mandatory dependency without explicit approval.

---

## 13. Future Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Repository Foundation | Complete |
| Phase 1 | Application Workspace Architecture | In Progress |
| Phase 2 | Backend Foundation | Planned |
| Phase 3 | Database Foundation | Planned |
| Phase 4 | Authentication / User Identity | Planned |
| Phase 5 | Basic Assistant Interface | Planned |
| Phase 6 | AI Provider Abstraction | Planned |
| Phase 7 | Conversation System | Planned |
| Phase 8 | Task and Reminder System | Planned |
| Phase 9 | Tool/Permission System | Planned |
| Phase 10 | Web Search | Planned |
| Phase 11 | Email Integration | Planned |
| Phase 12 | Windows Client | Planned |
| Phase 13 | Windows Automation | Planned |
| Phase 14 | Android Client | Planned |
| Phase 15 | Notifications and Mobile Integration | Planned |
| Phase 16 | Memory | Planned |
| Phase 17 | Advanced Automation | Planned |

---

## 14. Repository Structure

```
Leo-AI/
│
├── apps/
│   ├── web/       → Future browser/web interface
│   ├── windows/   → Future Windows desktop client
│   └── android/   → Future Android client
│
├── server/        → Future core backend/API and business logic
├── shared/        → Future shared types, contracts, and utilities
├── docs/          → Architecture and technical documentation
├── scripts/       → Future development/maintenance scripts
│
├── README.md
├── LICENSE
└── .gitignore
```

Each directory currently contains only a placeholder `README.md` describing its future responsibility. No application code has been created.
