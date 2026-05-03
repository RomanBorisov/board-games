# Mentor Progress

Last updated: 2026-05-03

## Collaboration Rules

- The user is the student and should implement most tasks independently.
- The mentor gives medium-sized tasks, breaks them into smaller steps, explains why the task matters, then reviews the user's implementation.
- Reviews should use guiding questions first, not full solutions, unless the user explicitly asks the mentor to implement something.
- The mentor should keep this file updated after meaningful progress so another LLM can continue the mentorship smoothly.

## Project Context

- Project: `Durak Online`, a board games platform. MVP game: classic two-player Durak.
- Repository: Nx monorepo at `/Users/romanborisov/Documents/projects/personal/tabgam/board-games`.
- Apps/libs:
  - `frontend`: Angular app.
  - `backend`: NestJS app.
  - `shared`: shared TypeScript contracts imported as `@board-games/shared`.
  - `backend-e2e`: backend e2e tests.
- Important standards from docs:
  - Angular local state should use Signal API.
  - Frontend styles should follow BEM.
  - Shared contracts should avoid duplicated frontend/backend interfaces.

## Completed Task 1: Shared Domain Contracts

Goal: create the first real domain model in `shared` so frontend and backend speak the same language.

Main files introduced or changed:

- `shared/src/index.ts`
- `shared/src/lib/core/user.ts`
- `shared/src/lib/core/player.ts`
- `shared/src/lib/core/game.ts`
- `shared/src/lib/core/game-state.ts`
- `shared/src/lib/core/session.ts`
- `shared/src/lib/core/index.ts`
- `shared/src/lib/fool-game/card/card.ts`
- `shared/src/lib/fool-game/card/index.ts`
- `shared/src/lib/fool-game/player/player.ts`
- `shared/src/lib/fool-game/player/index.ts`
- `shared/src/lib/fool-game/game/game-action.ts`
- `shared/src/lib/fool-game/game/game-state.ts`
- `shared/src/lib/fool-game/game/index.ts`
- `shared/src/lib/fool-game/index.ts`

Removed old Nx demo shared files:

- `shared/src/lib/shared.ts`
- `shared/src/lib/shared.spec.ts`

## Key Modeling Decisions

- `IUser` is public and must not contain `password`.
- `IPlayer` is a public/base player model.
- `IGameState<PlayerType>` is generic so different states can use different player shapes.
- Durak server state uses `IFoolGamePlayer`, which includes `hand`.
- Durak client state uses `IFoolGameClientPlayer`, which omits `hand` and adds `cardCount`.
- The current player's own hand is exposed separately in `IFoolGameClientState.hand`.
- Opponent hands should not be sent to the client.
- Durak table is modeled as pairs:
  - `attackerCard`
  - `defenderCard | null`
- Durak actions are modeled as a union:
  - `Attack`: requires `payload.card`.
  - `Defend`: requires `payload.card` and `payload.cardToBeat`.
  - `TakeCard`: no payload.
  - `Pass`: no payload.
- Internal imports inside `shared` should be relative. External projects should import from `@board-games/shared`.
- The temporary `@board-games/core` alias was removed from `tsconfig.base.json`.

## Checks Passed

Latest checks for `shared`:

```bash
npx nx build shared
npx nx lint shared
```

Both passed.

Tests were intentionally deferred at the user's request. `shared` currently has no meaningful tests after removing the demo test.

## Remaining Small Follow-Ups

- Add tests for shared contracts later:
  - valid `Attack` action shape;
  - valid `Pass` action shape with no payload;
  - server state can contain private hands;
  - client state exposes only current player's hand and public opponent info.
- Optional cleanup:
  - add missing semicolons in export barrel files;
  - clean small formatting issues such as extra spaces in imports.

## Next Planned Big Task

Next big task: continue backend game engine foundation.

Why: backend should use the shared domain model instead of ad hoc strings and objects. This prepares the later Durak engine, session handling, and WebSocket game actions.

## In Progress Task 2: Backend Game Engine Skeleton

Goal: create the backend-side architecture for game engines before implementing real Durak rules.

Implemented so far:

- `backend/src/app/game/game.module.ts`
- `backend/src/app/game/engine/game-engine.interface.ts`
- `backend/src/app/game/engine/durak.engine.ts`
- `backend/src/app/game/registry/registry.service.ts`
- `backend/src/app/app.module.ts` imports `GameModule`.

Current design:

- `IGameEngine<TServerState, TClientState, TAction>` defines the engine contract:
  - `initGame(playerIds)`
  - `processAction(state, action, playerId)`
  - `getStateForPlayer(state, playerId)`
  - `isGameOver(state)`
- `DurakEngine` implements `IGameEngine<IFoolGameServerState, IFoolGameClientState, IFoolGameAction>`.
- `DurakEngine` is a Nest provider via `@Injectable()`.
- `GameRegistryService` receives `DurakEngine` via constructor injection and registers it internally.
- `GameRegistryService.getEngine(AvailableGameEngines.DURAK)` can return the Durak engine.
- `GameModule` provides both `DurakEngine` and `GameRegistryService`.

Latest checks for backend:

```bash
npx nx build backend
npx nx lint backend
```

Both passed.

Remaining follow-ups for Task 2:

- Review whether `getEngine` should return `null` or throw a Nest exception for unsupported game engines.
- Consider renaming `AvailableGameEngines` to a more domain-oriented type later, especially when `GameType` is added to shared contracts.
- Add focused tests later for `GameRegistryService.getEngine(DURAK)`.

Likely breakdown:

1. Decide where game engine contracts should live:
   - shared interface if frontend also needs to know the contract;
   - backend-only interface if it is purely server implementation detail.
2. Start replacing `throw new Error('Not implemented')` skeleton methods with narrow, testable Durak helper logic when the user is ready.
3. Add minimal unit tests or build/lint checks, depending on the user's current preference.

Do not implement this automatically unless the user says something like "Выдай задачу" or explicitly asks the mentor to code it.
