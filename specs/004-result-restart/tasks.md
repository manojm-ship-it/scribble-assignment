---

description: "Task list for feature 004 — Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included (constitution, Principle V).

**Organization**: By user story, in priority order (US1, US2, US3).

**Commits**: `feat(004): Txxx <summary>`; build and tests passing in both apps before each commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1–2: Setup & Foundational

No setup or foundational tasks: features 001–003 provide the model, polling and screens.

---

## Phase 3: User Story 1 — Everyone sees the result (P1) 🎯

**Goal**: The word, final scores and full history are visible to every player after the round.

**Independent test**: quickstart §2 (ended view) and §3 row 1.

- [ ] T001 [US1] In `toRoomSnapshot` in backend/src/services/roomStore.ts include `secretWord` when the viewer is the drawer **or** `room.status === "ended"` (FR-001, research R1)
- [ ] T002 [P] [US1] Add tests in backend/src/services/roomStore.test.ts: after the round ends, guesser, unknown-id and anonymous views include the word; while playing the guesser's view still does not
- [ ] T003 [US1] Create frontend/src/components/RoundResult.tsx: a card showing "The word was <word>" and final scores sorted by score descending (stable, so ties keep join order), plus an `action` slot for the host control or waiting text (FR-002, research R4)
- [ ] T004 [US1] In frontend/src/pages/GamePage.tsx render `RoundResult` when `room.status === "ended"` (the Activity panel already shows the revealed history) (FR-002, FR-003)

**Checkpoint**: a finished round shows the same result in every tab.

---

## Phase 4: User Story 2 — Host restarts; everyone returns to the lobby (P1)

**Goal**: Host-only restart from an active or ended round; full reset; everyone back in the lobby.

**Independent test**: quickstart §2 restart calls; §3 rows 2, 3, 5, 6, 7.

- [ ] T005 [US2] Add `restartGameSchema` (`participantId` required, "A participant id is required to restart the game.") to backend/src/api/schemas.ts and a test in backend/src/api/schemas.test.ts
- [ ] T006 [US2] Add `restartGame(code, participantId)` to backend/src/services/roomStore.ts checking, in order, room exists (404), `status !== "lobby"` (409 "The game has not started yet."), requester is host (403 "Only the host can restart the game."); then set `status = "lobby"`, `drawerId = null`, `secretWord = null`, `guesses = []`, every `score = 0`, keeping `participants`, `hostId` and `gamesStarted` (FR-004–FR-006, FR-008, research R2)
- [ ] T007 [P] [US2] Add tests in backend/src/services/roomStore.test.ts: non-host refused; lobby refused; host restart from `ended` resets status, drawer, word, guesses and scores while participants (ids, names, order) and host are unchanged; duplicate restart refused; host restart from `playing` allowed; next start after restart uses `selectSecretWord(code, 1)`
- [ ] T008 [US2] Add route `POST /:code/restart` returning `{ room: toRoomSnapshot(room, participantId) }` in backend/src/api/rooms.ts (contracts/rooms-api.md)
- [ ] T009 [P] [US2] Add `api.restartGame(code, participantId)` in frontend/src/services/api.ts with a request-shape test in frontend/src/services/api.test.ts, and `restartGame()` on `RoomStore` in frontend/src/state/roomStore.ts storing the returned snapshot
- [ ] T010 [US2] In frontend/src/pages/GamePage.tsx navigate to `/lobby` whenever `room.status === "lobby"`; in RoundResult's action slot show "Play again" (host) or "Waiting for the host to start a new game." (others); during an active round give the host an "End game and return to lobby" button calling the same restart; show restart errors without crashing (FR-007, FR-009)

**Checkpoint**: full create → play → result → restart → play again cycle works.

---

## Phase 5: User Story 3 — No exit bounce (P3)

- [ ] T011 [US3] Remove the "Exit Game" button from frontend/src/pages/GamePage.tsx (FR-010, research R5)

---

## Phase 6: Polish & Validation

- [ ] T012 Run quickstart §1–§2 and record results below
- [ ] T013 Run quickstart §3 two-tab checks (including the full play-again cycle, SC-005) and record results below
- [ ] T014 Run `temp/run-pr-checks.sh` (expect pre-evaluation to report 4/4 feature folders); record deviations in plan.md

## Validation Results

_Filled in during T012–T014._

---

## Dependencies & Execution Order

- US1: T001 → T002; T003 → T004.
- US2: T005 → T006 → T008; T007 alongside T006; T009 after T008; T010 after T004 and T009.
- US3: T011 any time after T010 (same file).
- Polish last.

## Parallel Opportunities

- Backend (T001, T005–T008) and frontend component work (T003) in parallel.
- `[P]` test tasks alongside their implementation.

## Implementation Strategy

1. US1: the result is visible — Scenario 4's first half.
2. US2: restart closes the loop — the README's full working-game flow.
3. US3: remove the bounce.
4. Validate, push; pre-evaluation should report all four feature folders complete.
