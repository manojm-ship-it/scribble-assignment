---

description: "Task list for feature 001 — Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included. The constitution (Principle V) requires a vitest test for every game rule
and its edge cases.

**Organization**: Tasks are grouped by user story. US3 (lobby polling, P2) is placed before
US4 (start, P1) because US4 scenario 3 — non-hosts reaching the game screen — depends on
polling.

**Commits**: one commit per task or tightly related pair, message
`feat(001): Txxx <summary>` (or `test(001)` / `fix(001)`); `npm run build && npm test` must
pass in both apps before each commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5 from spec.md)

## Path Conventions

Web app: `backend/src/`, `frontend/src/` (plan.md, Project Structure)

---

## Phase 1: Setup

**Purpose**: Make the app reach the backend with default settings (gap 1, FR-001)

- [x] T001 Change the default `API_BASE_URL` from `http://localhost:3001/bug` to `http://localhost:3001` in frontend/src/services/api.ts (FR-001)
- [x] T002 [P] Add a test asserting `api.createRoom` calls exactly `http://localhost:3001/rooms` when `VITE_API_URL` is unset in frontend/src/services/api.test.ts

**Checkpoint**: `cd frontend && npm test` passes; creating a room in the browser reaches the lobby.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Shared types, validation and error plumbing used by every story

- [x] T003 Update types in backend/src/models/game.ts: `RoomStatus = "lobby" | "playing"`; add `hostId: string` and `lastActiveAt: number` (epoch ms) to `Room`; add `hostId: string` to `RoomSnapshot` (data-model.md)
- [x] T004 Make `errorHandler` respond with the first Zod issue's `message` (instead of "Invalid request payload") in backend/src/api/router.ts (research R2, FR-015)
- [x] T005 Redefine `roomCodeParamsSchema` in backend/src/api/schemas.ts: `code` trimmed; empty → "Enter a room code."; must match `/^[A-Za-z0-9]{4}$/` → "Room codes are 4 letters or numbers."; then upper-cased. Remove the now-redundant `.toUpperCase()` calls in backend/src/api/rooms.ts (research R1, FR-005, FR-006)
- [x] T006 [P] Add schema tests in backend/src/api/schemas.test.ts: `" abcd "` → `"ABCD"`; `"  "` rejected with "Enter a room code."; `"AB"`, `"ABCDE"`, `"AB!D"` rejected with "Room codes are 4 letters or numbers."
- [x] T007 [P] In frontend/src/services/api.ts add `ApiError extends Error` with a numeric `status`, throw it from `request` on non-OK responses, and update `RoomSnapshot` to `status: "lobby" | "playing"` and `hostId: string` (research R7)

**Checkpoint**: both apps build; schema tests pass.

---

## Phase 3: User Story 1 — Host creates a room (P1) 🎯 MVP

**Goal**: The creator is recorded and shown as host.

**Independent test**: Create a room; the lobby shows the code and marks the creator as host (quickstart §3 row 1).

- [x] T008 [US1] In backend/src/services/roomStore.ts set `hostId` to the creator's id and `lastActiveAt` to `Date.now()` in `createRoom`, and include `hostId` in `toRoomSnapshot` (FR-002, FR-003)
- [x] T009 [P] [US1] Add tests in backend/src/services/roomStore.test.ts: new room's `hostId` equals the returned `participantId`; snapshot exposes `hostId`; status is `"lobby"`; 50 created rooms have 50 distinct codes
- [x] T010 [US1] In frontend/src/pages/LobbyPage.tsx show participants in join order, label the host "host" and the viewer's own entry "(you)" using `room.hostId` and `participantId` (FR-004; duplicate names allowed)

**Checkpoint**: US1 independently testable.

---

## Phase 4: User Story 2 — Player joins a room by code (P1)

**Goal**: Valid codes join; empty, malformed, unknown and started rooms are refused with their messages.

**Independent test**: quickstart §2 join calls and §3 rows 3 and 5.

- [x] T011 [US2] In backend/src/services/roomStore.ts make `joinRoom` throw `HttpError(404, "Room not found. Check the code and try again.")` for unknown codes and `HttpError(409, "This game has already started.")` when `status !== "lobby"`, and update `lastActiveAt`; simplify the join route in backend/src/api/rooms.ts accordingly (FR-006, research R3)
- [x] T012 [P] [US2] Add tests in backend/src/services/roomStore.test.ts: join adds a non-host participant; unknown code → 404 message; started room → 409 message
- [x] T013 [US2] In frontend/src/pages/JoinRoomPage.tsx trim the code and show "Enter a room code." without calling the API when it is empty (research R1)

**Checkpoint**: US2 independently testable.

---

## Phase 5: User Story 3 — Lobby updates automatically (P2)

**Goal**: Lobbies refresh every 2 s, survive errors, and handle a vanished room.

**Independent test**: quickstart §3 rows 3 and 9.

- [x] T014 [US3] In backend/src/services/roomStore.ts update `lastActiveAt` whenever `getRoom` finds a room; in backend/src/api/rooms.ts change the fetch 404 message to "This room is no longer available." (FR-014, contract GET)
- [x] T015 [US3] Add a `notice: string | null` field and `clearRoom(notice: string)` to `RoomStore` in frontend/src/state/roomStore.ts that sets `room` and `participantId` to `null` and stores the notice; `setRoomSession` clears it. (A separate field, not `error`, so stale create/join errors never show on the start screen.)
- [x] T016 [US3] In frontend/src/pages/LobbyPage.tsx poll `roomStore.fetchRoom()` every 2000 ms while mounted (clear the interval on unmount); on `ApiError` 404 call `clearRoom("This room is no longer available.")` and navigate to `/`; on other errors keep the last snapshot and show the message (FR-007, FR-008)
- [x] T017 [P] [US3] In frontend/src/pages/StartPage.tsx show the store's `notice` (if any) using the existing `form__error` class (US3 scenario 3)

**Checkpoint**: a join in window B appears in window A within ~2 s with no clicks.

---

## Phase 6: User Story 4 — Host starts the game (P1)

**Goal**: Only the host can start, only with ≥2 players; everyone reaches the game screen.

**Independent test**: quickstart §2 start calls and §3 rows 2, 4 and 6.

- [ ] T018 [US4] Add `startGame(code, participantId)` to backend/src/services/roomStore.ts checking, in order: room exists (404 "This room is no longer available."), requester is host (403 "Only the host can start the game."), status is `"lobby"` (409 "This game has already started."), `participants.length >= 2` (400 "At least 2 players are needed to start."); then set `status = "playing"` and update `lastActiveAt` (FR-009, FR-010, FR-011)
- [ ] T019 [US4] Add `startGameSchema` (`participantId`: non-empty string) to backend/src/api/schemas.ts and route `POST /:code/start` returning `{ room }` in backend/src/api/rooms.ts (contracts/rooms-api.md)
- [ ] T020 [P] [US4] Add tests in backend/src/services/roomStore.test.ts: non-host → 403; host alone → 400; host with 2 players → `status` `"playing"`; second start → 409; unknown participant id → 403
- [ ] T021 [P] [US4] Add `api.startGame(code, participantId)` (POST `/rooms/:code/start` with JSON body) in frontend/src/services/api.ts and a request-shape test in frontend/src/services/api.test.ts
- [ ] T022 [US4] Add `startGame()` to `RoomStore` in frontend/src/state/roomStore.ts that calls the API and stores the returned snapshot
- [ ] T023 [US4] In frontend/src/pages/LobbyPage.tsx show the start control only to the host, disabled with "Waiting for at least 2 players." while fewer than 2; show "Waiting for the host to start the game." to non-hosts; navigate to `/game` whenever the snapshot `status` is `"playing"`; show start errors without crashing (FR-012)

**Checkpoint**: full create → join → start flow works in two browsers.

---

## Phase 7: User Story 5 — Rooms are isolated and cleaned up (P2)

**Goal**: Rooms never affect each other; rooms idle for 30 minutes are removed.

**Independent test**: unit tests plus quickstart §3 row 8.

- [ ] T024 [US5] Add `ROOM_IDLE_LIMIT_MS = 30 * 60 * 1000` and exported `removeInactiveRooms(now: number)` deleting rooms whose `lastActiveAt` is older than the limit, returning the number removed, in backend/src/services/roomStore.ts (FR-014, research R6)
- [ ] T025 [P] [US5] Add tests in backend/src/services/roomStore.test.ts: a room idle for 30 min + 1 ms is removed and then joining it gives the 404 message; a room active within the limit is kept; joining or starting room R1 leaves room R2's participants, host and status unchanged (FR-013, FR-014)
- [ ] T026 [US5] In backend/src/server.ts call `removeInactiveRooms(Date.now())` every 60 s with `setInterval(...).unref()`

**Checkpoint**: all backend rule tests pass.

---

## Phase 8: Polish & Validation

- [ ] T027 Run quickstart §1 and §2 (automated and `curl` checks) and record results below
- [ ] T028 Run quickstart §3 two-browser checks (rows 1–9) and record results below
- [ ] T029 Run `temp/run-pr-checks.sh`; record any implementation deviations in plan.md "Deviations"

## Validation Results

_Filled in during T027–T029._

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T007)** → user stories.
- **US1 (T008–T010)** depends on Foundational.
- **US2 (T011–T013)** depends on Foundational; independent of US1.
- **US3 (T014–T017)** depends on Foundational; T016 extends the LobbyPage changes from T010.
- **US4 (T018–T023)** depends on US1 (`hostId`) and US3 (polling for non-hosts); T023 extends LobbyPage after T016.
- **US5 (T024–T026)** depends on Foundational (`lastActiveAt`); T025's join assertion needs T011.
- **Polish (T027–T029)** after all stories.

## Parallel Opportunities

- T002 alongside T001's review; T006 and T007 alongside T004–T005 (different packages).
- Within each story, the `[P]` test task can be written alongside the service change
  (e.g. T009 with T008, T020 with T018–T019, T021 with T018).
- T017 (StartPage) alongside T015–T016.
- Backend story work (T008, T011, T014, T018, T024) and frontend story work (T010, T013,
  T016, T023) touch different packages and can be paired per story.

## Implementation Strategy

1. **MVP**: Phases 1–3 — the app reaches the backend and shows the host. Validate quickstart
   §3 row 1.
2. Add US2 (joining with refusals), then US3 (polling): validate rows 3, 5 and 9.
3. Add US4 (start): validate rows 2, 4, 6 and 7 — Scenario 1 is functionally complete here.
4. Add US5 (isolation tests and cleanup), then Polish.
5. Push after each phase; the pre-push hook runs all PR checks.
