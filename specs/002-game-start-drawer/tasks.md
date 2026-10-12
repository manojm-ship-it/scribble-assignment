---

description: "Task list for feature 002 — Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included (constitution, Principle V).

**Organization**: By user story. US4 (word rule, P2) is implemented with US3 because the drawer
cannot be shown a word until one is chosen; it is listed before US3 for that reason.

**Commits**: `feat(002): Txxx <summary>` (or `test`/`fix`/`docs`), build and tests passing in
both apps before each commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

No setup tasks: feature 001 established the structure and tooling.

---

## Phase 2: Foundational

- [x] T001 Add `drawerId: string | null`, `secretWord: string | null` and `gamesStarted: number` to `Room`, and `drawerId: string | null` plus optional `secretWord?: string` to `RoomSnapshot`, in backend/src/models/game.ts; initialise them to `null`, `null`, `0` in `createRoom` and expose `drawerId` in `toRoomSnapshot` in backend/src/services/roomStore.ts (data-model.md)
- [x] T002 [P] Update the frontend `RoomSnapshot` type with `drawerId: string | null` and `secretWord?: string` in frontend/src/services/api.ts

**Checkpoint**: both apps build; existing tests pass.

---

## Phase 3: User Story 1 — Players enter a valid name (P1)

**Goal**: Names are trimmed, required, and at most 20 characters, on create and join.

**Independent test**: quickstart §2 name calls; §3 rows 1–4.

- [x] T003 [US1] Add `playerNameSchema` to backend/src/api/schemas.ts: required with "Enter your name.", `.trim()`, `.min(1, "Enter your name.")`, `.max(20, "Names can be at most 20 characters.")`; use it for `playerName` in `createRoomSchema` and `joinRoomSchema` (FR-001–FR-003a)
- [x] T004 [P] [US1] Add tests in backend/src/api/schemas.test.ts: missing, `""` and `"   "` → "Enter your name."; `"  Ann  "` → `"Ann"`; 20 characters accepted; 21 → "Names can be at most 20 characters."; same for `joinRoomSchema`
- [x] T005 [US1] Remove the `displayName` "Player" fallback in backend/src/services/roomStore.ts and make `playerName` a required `string` in `createParticipant`, `createRoom` and `joinRoom` (research R2)
- [x] T006 [P] [US1] Update the unknown-room and late-join `curl` lines in specs/001-room-lobby/quickstart.md to send `{"playerName":"Guest"}` (research R7)

**Checkpoint**: blank and long names refused from the API and both forms.

---

## Phase 4: User Story 4 — Deterministic word (P2, needed by US2/US3)

**Goal**: The word comes from the clarified rule.

- [x] T007 [US4] Add exported pure `selectSecretWord(code: string, gamesStarted: number)` returning `STARTER_WORDS[(Σ char codes of code + gamesStarted) % STARTER_WORDS.length]` in backend/src/services/roomStore.ts (FR-006)
- [x] T008 [P] [US4] Add tests in backend/src/services/roomStore.test.ts: `("ABCD", 0)` → `pizza`; `("ABCD", 1)` → `castle`; `("AAAA", 0)` → `rocket`; same inputs twice → same word; result always one of the five starter words

---

## Phase 5: User Story 2 — Host becomes the drawer (P1)

**Goal**: Starting records the host as drawer and picks the word; every screen shows the drawer.

**Independent test**: quickstart §3 rows 5–7 (drawer labels).

- [x] T009 [US2] In `startGame` in backend/src/services/roomStore.ts, after the feature 001 checks set `drawerId = hostId`, `secretWord = selectSecretWord(code, gamesStarted)`, then `gamesStarted += 1` (FR-004, FR-006)
- [x] T010 [P] [US2] Add tests in backend/src/services/roomStore.test.ts: after start `drawerId` equals `hostId` and `secretWord` equals `selectSecretWord(code, 0)`; a room in the lobby has `drawerId` and `secretWord` `null` (FR-008)
- [ ] T011 [US2] In frontend/src/pages/GamePage.tsx show "<drawer name> is drawing" and "You are the drawer" / "You are guessing" for the viewer, using `room.drawerId`, `room.participants` and `participantId` (FR-005)

---

## Phase 6: User Story 3 — Only the drawer sees the word (P1)

**Goal**: The word appears only in the drawer's view; word and role lists are never sent.

**Independent test**: quickstart §2 visibility loop; §3 rows 6–7.

- [ ] T012 [US3] In `toRoomSnapshot` in backend/src/services/roomStore.ts include `secretWord` only when `viewerParticipantId === room.drawerId` and a word is set; remove `availableWords`, `roles`, the `listWords` helper and the `STARTER_ROLES` import; remove `availableWords`/`roles` from `RoomSnapshot` in backend/src/models/game.ts (FR-007, FR-009, research R4–R5)
- [ ] T013 [P] [US3] Add tests in backend/src/services/roomStore.test.ts: drawer view has the word; guesser, unknown-id and no-id views do not; lobby view for the host has no word; no view has `availableWords` or `roles` keys
- [ ] T014 [P] [US3] Remove `availableWords`, `roles` and the unused `ParticipantRole` type from frontend/src/services/api.ts
- [ ] T015 [US3] In frontend/src/pages/GamePage.tsx show "Your word: <word>" to the drawer and "The word is hidden. Watch the drawing and guess!" to guessers (US3.1–3.2)

---

## Phase 7: Polish & Validation

- [ ] T016 Run quickstart §1–§2 and record results below
- [ ] T017 Run quickstart §3 two-tab checks and record results below
- [ ] T018 Run `temp/run-pr-checks.sh`; record deviations in plan.md

## Validation Results

_Filled in during T016–T018._

---

## Dependencies & Execution Order

- T001 → everything; T002 alongside T001.
- US1 (T003–T006) depends only on T001.
- US4 (T007–T008) → US2 (T009–T011) → US3 (T012–T015).
- T011 and T015 both edit GamePage.tsx: T015 after T011.
- Polish after all stories.

## Parallel Opportunities

- `[P]` test tasks alongside their service changes (T004 with T003, T008 with T007, T010 with
  T009, T013 with T012).
- Frontend type tasks (T002, T014) alongside backend work.
- T006 (doc fix) any time after T003.

## Implementation Strategy

1. US1 alone is shippable: valid names everywhere.
2. US4 + US2: the round has a drawer and a word.
3. US3: visibility rules and the game screen word card complete Scenario 2.
4. Validate, push (pre-push hook runs all PR checks).
