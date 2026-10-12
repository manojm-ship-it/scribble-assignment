---

description: "Task list for feature 003 — Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included (constitution, Principle V).

**Organization**: By user story. US2 (guess rules) comes before US3 (sync) because the history
needs guesses to show; US1 (canvas) is independent and placed last among stories because it
touches only the frontend.

**Commits**: `feat(003): Txxx <summary>`; build and tests passing in both apps before each commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

No setup tasks.

---

## Phase 2: Foundational

- [x] T001 In backend/src/models/game.ts add `score: number` to `Participant`; add `Guess` (`id`, `participantId`, `text`, `correct`, `createdAt`) and `guesses: Guess[]` on `Room`; widen `RoomStatus` to `"lobby" | "playing" | "ended"`; add `GuessView` (`id`, `participantId`, `text: string | null`, `correct`) and `guesses: GuessView[]` on `RoomSnapshot`. In backend/src/services/roomStore.ts set `score: 0` in `createParticipant`, `guesses: []` in `createRoom`, and map `guesses` in `toRoomSnapshot` (data-model.md)
- [x] T002 [P] Mirror the type changes (`score`, `GuessView`, `guesses`, `"ended"`) in frontend/src/services/api.ts

**Checkpoint**: both apps build; existing tests pass.

---

## Phase 3: User Story 2 — Guesses are checked fairly (P1)

**Goal**: Guess rules and scoring enforced by the game service.

**Independent test**: quickstart §2.

- [x] T003 [US2] Add `submitGuessSchema` to backend/src/api/schemas.ts: `participantId` required ("A participant id is required to guess."), `text` required ("Enter a guess."), `.trim()`, `.min(1, "Enter a guess.")` (FR-004, FR-005)
- [x] T004 [P] [US2] Add tests in backend/src/api/schemas.test.ts: missing, `""` and `"   "` text → "Enter a guess."; `"  Pizza "` → `"Pizza"`; missing `participantId` refused
- [x] T005 [US2] In backend/src/services/roomStore.ts make `startGame` reset every participant's `score` to 0 and set `guesses = []`; add `submitGuess(code, participantId, text)` with the checks in order from data-model.md (404, 409 not in progress, 403 not a player, 403 drawer, 409 already correct), case-insensitive comparison, +100 on correct, and `status = "ended"` when every non-drawer participant has a correct guess (FR-006–FR-009, FR-013, FR-014)
- [x] T006 [P] [US2] Add tests in backend/src/services/roomStore.test.ts: wrong guess recorded, score 0; `"  PiZZa "`-style variant of the word correct, +100; `"pi zza"` style internal space incorrect; drawer refused; repeat after correct refused; guess in lobby refused; unknown player refused; one guesser correct → `ended`; with two guessers the first correct keeps `playing`, the second ends it; guess after `ended` refused; `startGame` resets scores and guesses
- [x] T007 [US2] Add route `POST /:code/guesses` (params schema, `submitGuessSchema`, `submitGuess`, respond `{ room: toRoomSnapshot(room, participantId) }`) in backend/src/api/rooms.ts (contracts/rooms-api.md)
- [x] T008 [P] [US2] Add `api.submitGuess(code, participantId, text)` in frontend/src/services/api.ts and a request-shape test in frontend/src/services/api.test.ts
- [x] T009 [US2] Add `submitGuess(text)` to `RoomStore` in frontend/src/state/roomStore.ts storing the returned snapshot
- [x] T010 [US2] In frontend/src/components/GuessForm.tsx add an `onSubmit(text: string): Promise<void>` prop; on submit call it, clear the input on success, and show the refusal message (using `form__error`) on failure; keep the `disabled` prop

**Checkpoint**: guesses can be submitted from the API and the form.

---

## Phase 4: User Story 3 — History and scores for everyone (P1)

**Goal**: Every game screen refreshes history and scores every 2 s; correct text hidden while playing.

**Independent test**: quickstart §3 rows 4, 6, 7, 9.

- [x] T011 [US3] In `toRoomSnapshot` in backend/src/services/roomStore.ts send `text: null` for correct guesses while `status === "playing"` and the real text otherwise (FR-011, research R5)
- [x] T012 [P] [US3] Add tests in backend/src/services/roomStore.test.ts: while playing, a correct guess's view text is `null` for every viewer (including the guesser and drawer) and wrong guesses keep their text; after `ended`, correct text is present; history order equals submission order
- [x] T013 [US3] Extract the lobby's 2000 ms polling, `ApiError` 404 handling (`clearRoom("This room is no longer available.")`) and refresh-error state into `useRoomPolling()` in frontend/src/state/useRoomPolling.ts, and switch frontend/src/pages/LobbyPage.tsx to it with no behaviour change (research R6)
- [x] T014 [US3] In frontend/src/components/Scoreboard.tsx accept `participants` and `participantId` props and list each player's name (with "(you)") and score (FR-012)
- [x] T015 [US3] In frontend/src/components/ResultPanel.tsx accept `guesses` and `participants` props and render the history in order: "<name>: <text>" for wrong guesses, "<name> guessed the word!" when `text` is `null`, and "<name>: <text> ✓" for revealed correct guesses; show "No guesses yet." when empty (FR-009, FR-011)
- [x] T016 [US3] In frontend/src/pages/GamePage.tsx call `useRoomPolling()`, pass data to Scoreboard and ResultPanel, wire GuessForm to `roomStore.submitGuess` (disabled for the drawer, for a guesser who already guessed correctly, and when `status === "ended"`), show "Round over! Everyone guessed the word." when ended, and show refresh errors (FR-010, FR-014)
- [x] T017 [P] [US3] Add history and scoreboard list styles to frontend/src/styles/app.css

**Checkpoint**: guesses and scores appear in every tab within ~2 s.

---

## Phase 5: User Story 1 — Drawer draws and clears (P1)

**Goal**: The drawer has a working canvas; guessers do not.

**Independent test**: quickstart §3 rows 1–3.

- [x] T018 [US1] Create frontend/src/components/DrawingCanvas.tsx: an 800×500 `<canvas>` scaled to its container, drawing lines with pointer events (pointer capture; coordinates scaled by `canvas.width / rect.width`), plus a "Clear canvas" button that clears the whole surface (FR-001, FR-002, research R1)
- [x] T019 [US1] In frontend/src/pages/GamePage.tsx render `DrawingCanvas` for the drawer and the existing `canvas-placeholder` reading "<drawer name> is drawing" for guessers (FR-003)
- [x] T020 [P] [US1] Add canvas styles (`touch-action: none`, full width, border) to frontend/src/styles/app.css

**Checkpoint**: drawer can draw and clear; guessers see the placeholder.

---

## Phase 6: Polish & Validation

- [ ] T021 Run quickstart §1–§2 and record results below
- [ ] T022 Run quickstart §3 three-tab checks, plus feature 001 lobby polling rows 3 and 9 (regression for T013), and record results below
- [ ] T023 Run `temp/run-pr-checks.sh`; record deviations in plan.md

## Validation Results

_Filled in during T021–T023._

---

## Dependencies & Execution Order

- T001 → all; T002 alongside T001.
- US2: T003 → T005 → T007 → T008 → T009 → T010 (T004, T006 alongside their targets).
- US3: T011 after T005; T013 independent of backend; T014–T016 after T009/T013; T016 after T010.
- US1: T018 independent; T019 after T016 (same file).
- Polish last.

## Parallel Opportunities

- `[P]` tests alongside their implementation tasks.
- Frontend T013 (hook) and T018 (canvas) can be built while backend US2 work is in progress.
- CSS tasks T017 and T020 alongside their components.

## Implementation Strategy

1. US2 backend first: rules and scoring fully tested through the API.
2. US3: the game screen comes alive (history, scores, round end).
3. US1: drawing for the drawer.
4. Validate (including feature 001 regression rows), push.
