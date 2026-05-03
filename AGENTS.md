# Agents Guide

This guide is for agents working in this repository. Keep it in sync with `README.md` and `docs/README.md`: the README covers quick local usage, the docs describe the target architecture, and this file captures practical working rules and verification steps.

# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in `PLANS.md`) from design to implementation.

## Project Purpose

`Board Games / Durak Online` is an Nx monorepo for an online board-games platform. The MVP game is `Durak`, played by two live players in real time.

Current state: the repository contains the monorepo foundation and smoke-test scaffolds for `frontend`, `backend`, `shared`, and `backend-e2e`. Most product logic described in the documentation is still roadmap material, not implemented code.

## Current Stack

- Monorepo: `Nx` integrated workspace.
- Frontend: `Angular` 21, standalone application, SCSS, Jest.
- Backend: `NestJS` 11, Express platform, Jest, webpack build.
- Shared: TypeScript library `@board-games/shared`.
- E2E: Jest + Axios for backend checks.
- Package manager: `npm`.

Target architecture stack, to be added as implementation progresses: `Socket.io`, `Prisma`, `PostgreSQL`, `Redis`, `Kafka`, `Docker Compose`, `Nginx`, `Angular Material`, `GSAP`, `NgRx`, `TailwindCSS`.

## Repository Structure

- `frontend` - Angular app, development port `8700`.
- `backend` - NestJS app, default port `8600`, global prefix `api`.
- `shared` - shared types and contracts for frontend/backend.
- `backend-e2e` - backend e2e tests.
- `docs` - architecture docs and implementation roadmap.
- `dist` - build output, do not commit.

## Core Commands

Install dependencies:

```bash
npm install
```

Show Nx projects:

```bash
npx nx show projects
```

Run backend:

```bash
npx nx serve backend
```

Check backend:

```bash
curl http://localhost:8600/api
curl http://localhost:8600/api/health
```

Run frontend:

```bash
npx nx serve frontend
```

Frontend is available at `http://localhost:8700`.

Run frontend and backend together:

```bash
npx nx run-many --target=serve --projects=backend,frontend
```

Run unit tests:

```bash
npx nx run-many --target=test --projects=frontend,backend,shared
```

Run backend e2e:

```bash
npx nx e2e backend-e2e
```

Run lint:

```bash
npx nx run-many --target=lint --projects=frontend,backend,shared
```

Build projects:

```bash
npx nx build frontend
npx nx build backend
npx nx build shared
```

## Code Rules

### General

- Follow the existing Nx project structure; do not introduce new top-level folders without a clear reason.
- Put shared domain types, DTOs, and event contracts in `shared`, then export them through `shared/src/index.ts`.
- Do not duplicate interfaces between frontend and backend when they represent the same contract.
- Do not commit `dist`, `coverage`, `.nx/cache`, `.angular`, or `node_modules`.
- Check `git status --short` before editing. Never revert user or unrelated changes unless explicitly asked.

### Frontend

- Use Angular Signal API for local component state: `signal`, `computed`, and `effect`.
- Read signals in templates by calling them: `value()`.
- Do not use `BehaviorSubject` or `Subject` for local UI state when signals can express it.
- Write styles with BEM class names: `block`, `block__element`, `block--modifier`.
- Use one main BEM block per component.
- Avoid inline styles in templates except for temporary smoke-code.
- Do not hardcode backend URLs in production-facing components. Move API base URLs into config, services, or a proxy setup.

### Backend

- Backend listens on `8600` by default and uses the `/api` prefix.
- Do not put game-specific rules in transport or gateway layers.
- Target game architecture: `GameGateway` routes events, `GameRegistry` selects an engine, and concrete engines like `DurakEngine` contain game rules.
- For new REST/WS contracts, define shared types first, then consume them from backend and frontend.
- Add input validation through DTOs and Nest pipes when real endpoints are introduced.

### Shared

- Keep `shared` platform-neutral: types, contracts, and pure functions only.
- Do not add Angular- or Nest-specific dependencies to `shared`.
- Changes to public contracts should be covered by tests or at least by updates to all affected consumers.

## Self-Check Instructions

Minimum checks before handing off changes:

```bash
npx nx run-many --target=lint --projects=frontend,backend,shared
npx nx run-many --target=test --projects=frontend,backend,shared
git diff --check
```

If backend startup, routing, e2e setup, or REST contracts changed:

```bash
npx nx e2e backend-e2e
```

If frontend changed:

```bash
npx nx build frontend
```

If backend changed:

```bash
npx nx build backend
```

If `shared` changed:

```bash
npx nx build shared
```

Before committing:

```bash
git status --short
git diff --check
```

After committing or pushing, confirm the working tree is clean:

```bash
git status --short
```

## Current Project Notes

- `shared` is still nearly empty and should become the first home for domain contracts.
- `frontend/src/app/nx-welcome.ts` is Nx scaffold code. It can trigger a production build warning for component style budget even if it is not used directly.
- `backend-e2e` defaults to port `8600`, matching the backend default.
- `gh auth status` may report invalid tokens while `git push` still works through git credentials. Trust the actual `git push` result.
- In the Codex sandbox, commands that open localhost ports or Nx IPC sockets may fail with `EPERM`. Re-run important checks with elevated permissions instead of treating that as an application failure.

## Documentation

- `README.md` - quick local setup and common commands.
- `docs/README.md` - architecture and target requirements.
- `docs/IMPLEMENTATION_ROADMAP.md` - MVP implementation phases.
- `base_description.md` - original expanded target-system description.

