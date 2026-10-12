# Implementation Plan: Room Setup & Lobby

**Branch**: `scribble-lab` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-lobby/spec.md`

## Summary

Make the starter's room flow correct and multiplayer-ready: point the frontend at the real
backend, record the room creator as host, validate room codes with clear messages, refuse
joins to started games, add a host-only start endpoint with a 2-player minimum, poll the lobby
every 2 seconds so joins and the start reach every player, and remove rooms idle for 30
minutes. All rules live in the backend service layer and are unit tested; the frontend only
renders snapshots (constitution, Principle II). Decisions are recorded in
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24.13.0 (`.nvmrc`), ES modules

**Primary Dependencies**: Express 4, Zod (backend); React 18, React Router 6, Vite (frontend).
No new dependencies.

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` only

**Testing**: vitest (backend `node` env, frontend `jsdom` env); manual two-browser validation

**Target Platform**: Local development: backend `localhost:3001`, frontend `localhost:5173`

**Project Type**: Web application (separate `backend/` and `frontend/` packages)

**Performance Goals**: Lobby reflects joins and start within ~2 s (one poll interval)

**Constraints**: HTTP polling only; no database; no authentication (constitution, Technical
Constraints)

**Scale/Scope**: Small lab rooms (a handful of players); several rooms at once

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Evidence |
|---|---|---|
| I. Brownfield discipline | ✅ Pass | Extends existing files only; no new packages; no unrelated refactors (R3 keeps `HttpError` where it is) |
| II. Server-authoritative rules | ✅ Pass | Host, 2-player minimum, started-game refusal and isolation enforced in `roomStore.ts`; UI only hides controls |
| III. Scope boundaries | ✅ Pass | One start into `playing`; no timers, rounds, kick, passwords or invite links |
| IV. Typed, validated, layered | ✅ Pass | Zod for code params and start body; routes thin; errors via central handler; `RoomStore` pattern extended |
| V. Verified before committed | ✅ Pass | Unit tests per rule (R8); quickstart two-browser checks; build/test gate via pre-push hook |
| VI. Reviewed AI assistance | ✅ Pass | Every task traces to an FR; deviations recorded below |
| Polling / in-memory / no auth | ✅ Pass | 2 s polling (R5); `Map` + idle sweep (R6); `participantId` as only identity (R4) |

**Post-design re-check (after Phase 1)**: ✅ Pass. The data model, contract and quickstart
introduce no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby/
├── spec.md              # Feature specification (with Clarifications)
├── plan.md              # This file
├── research.md          # Phase 0 decisions R1–R8
├── data-model.md        # Room/Participant/RoomSnapshot changes, state machine, validation
├── quickstart.md        # Automated, API and two-browser validation
├── contracts/
│   └── rooms-api.md     # HTTP contract for /rooms endpoints
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (files touched by this feature)

```text
backend/src/
├── models/game.ts               # Room: hostId, lastActiveAt, status "lobby" | "playing"; snapshot hostId
├── api/schemas.ts               # roomCodeParamsSchema validation + upper-case; startGameSchema
├── api/router.ts                # errorHandler returns the Zod issue message
├── api/rooms.ts                 # join/fetch messages; POST /:code/start
├── services/roomStore.ts        # host, join refusal, startGame, activity, removeInactiveRooms
├── server.ts                    # 60 s cleanup interval (unref'd)
├── services/roomStore.test.ts   # rule tests
└── api/schemas.test.ts          # code validation tests

frontend/src/
├── services/api.ts              # default base URL fix, ApiError(status), hostId/status types, startGame
├── services/api.test.ts         # default URL + start request tests
├── state/roomStore.ts           # startGame(), clearRoom()
└── pages/
    ├── LobbyPage.tsx            # 2 s polling, host/you markers, host-only start, navigate on playing/404
    ├── JoinRoomPage.tsx         # empty-code check before submit
    └── StartPage.tsx            # shows the store's notice (e.g. "This room is no longer available.")
```

**Structure Decision**: Keep the starter's two-package layout and layering
(`api` → `services` → `models` on the backend; `pages` → `state` → `services` on the
frontend). No new folders.

## Data Flow

1. **Create**: CreateRoomPage → `RoomStore.createRoom` → `POST /rooms` → `createRoom` records
   `hostId` → snapshot with `hostId` → store → `/lobby`.
2. **Join**: JoinRoomPage (empty check) → `POST /rooms/:code/join` → schema validates code →
   `joinRoom` refuses unknown (404) or started (409) rooms → snapshot → `/lobby`.
3. **Poll**: LobbyPage `setInterval(2000)` → `RoomStore.fetchRoom` → `GET /rooms/:code` →
   `getRoom` touches `lastActiveAt` → snapshot. `status === "playing"` → navigate `/game`;
   `ApiError` 404 → `clearRoom(message)` and go to `/`, where StartPage shows "This room is no longer
   available.";
   other errors → keep the last snapshot and show the message.
4. **Start**: host clicks Start → `RoomStore.startGame` → `POST /rooms/:code/start` →
   `startGame` checks host, status, count → snapshot `playing` → host navigates at once;
   others navigate on their next poll.
5. **Cleanup**: `server.ts` every 60 s → `removeInactiveRooms(Date.now())` deletes rooms with
   `lastActiveAt` older than 30 minutes.

## Implementation Sequence

1. Backend model and schema changes, with schema tests (code validation, error message).
2. Service rules with tests: host on create, join refusals, `startGame`, activity, cleanup,
   isolation.
3. Routes: start endpoint, messages; cleanup timer in `server.ts`.
4. Frontend API: base URL fix, `ApiError`, types, `startGame`, with tests.
5. Frontend store and pages: polling, markers, host-only start, empty-code check.
6. Validation: quickstart sections 1–3; record results in `tasks.md`.

## Testing Strategy

- **Backend unit (vitest)**: each FR with a rule — FR-002/003 (host, unique code), FR-005/006
  (code validation, refusals), FR-009/010 (start permissions), FR-011 (status change), FR-013
  (isolation between two rooms), FR-014 (idle removal with an injected `now`).
- **Frontend unit (vitest)**: FR-001 (default URL has no `/bug`), start request shape.
- **Manual**: quickstart two-browser table for FR-004, FR-007, FR-008, FR-012 (UI behaviour).
- **Gate**: `temp/run-pr-checks.sh` before every push (pre-push hook).

## Risks

| Risk | Mitigation |
|---|---|
| "Exit Game" on the game screen returns to the lobby, which immediately navigates back to `/game` because the room is `playing` | Accepted for this feature; the game screen and restart are reworked in features 002–004. Recorded as a known limitation. |
| Changing `errorHandler` alters messages for every Zod failure | Only replaces a generic message with a more specific one; existing tests assert throws, not text |
| Module-level `Map` is shared between backend tests | Each test creates its own rooms; cleanup tests use an injected `now` and only assert on rooms they created |
| Polling keeps idle-but-open lobbies alive forever | Intended (US5.3); rooms expire only when no browser is polling |

## Complexity Tracking

No constitution violations to justify.

## Deviations

Any difference found during implementation is recorded here and in `REFLECTION.md`.

- **T015/T017: separate `notice` field.** The plan first reused the store's `error` for the
  "room no longer available" message. Implementation showed that `error` also holds failed
  create/join messages, which would then reappear on the start screen. A dedicated `notice`
  field (cleared on the next create/join) is used instead. Behaviour matches the spec.
- **T003 + T008 committed together.** The new required `hostId` field does not compile until
  `createRoom` sets it, so both changes share one commit.
