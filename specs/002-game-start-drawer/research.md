# Research: Game Start & Drawer Flow

All clarifications were resolved in `spec.md` (session 2026-10-12). These decisions settle the
design questions left to planning. No dependencies are added (constitution, Principle I).

## R1. Where name rules are enforced

- **Decision**: One Zod schema, `playerNameSchema`, used by both `createRoomSchema` and
  `joinRoomSchema`: required (`"Enter your name."` when missing), trimmed, `min(1)` with
  "Enter your name.", `max(20)` with "Names can be at most 20 characters.".
- **Rationale**: Server-side enforcement satisfies FR-003a; the readable messages flow through
  the feature 001 error handler (first Zod issue message) straight to the forms, which already
  show API errors. Trimming in the schema means the stored name is already trimmed (FR-001).
- **Alternatives considered**: Duplicating checks in both forms (two copies of the rules, still
  needing the server check); trimming in the service (validation would then live in two places).

## R2. Remove the "Player" fallback

- **Decision**: Delete `displayName()` in `roomStore.ts`; `createRoom` and `joinRoom` take a
  required `playerName: string`.
- **Rationale**: With names required by the schema, the fallback is unreachable and would hide a
  bug if a caller skipped validation (discovery gap 5).

## R3. Word selection

- **Decision**: Pure exported function `selectSecretWord(code, gamesStarted)` returning
  `STARTER_WORDS[(sum of code char codes + gamesStarted) % STARTER_WORDS.length]`. `Room` gains
  `gamesStarted` (0 at creation); `startGame` picks the word with the current count, then
  increments it.
- **Rationale**: Matches the clarified rule exactly, is unit-testable without a running game, and
  gives feature 004's restart the "next word" behaviour for free.
- **Alternatives considered**: Hashing the code (harder to explain and verify by hand).

## R4. Drawer-only visibility

- **Decision**: `Room` gains `drawerId: string | null` and `secretWord: string | null` (both
  `null` in the lobby). `toRoomSnapshot(room, viewerParticipantId)` — whose viewer argument was
  ignored in the starter — adds `secretWord` only when `viewerParticipantId === room.drawerId`.
  Every route already passes the viewer's id (create, join, start, fetch).
- **Rationale**: One function decides visibility, so FR-007 is enforced in a single tested place.
  Unknown or missing viewer ids can never equal `drawerId`.
- **Alternatives considered**: A separate "word" endpoint for the drawer (more surface, same
  rule).

## R5. Stop sending the word and role lists

- **Decision**: Remove `availableWords` and `roles` from `RoomSnapshot` (backend and frontend
  types). Remove the now-unused `listWords()` helper and the frontend `ParticipantRole` type.
  The backend `ParticipantRole` type and `STARTER_ROLES` seed stay (pre-existing seed data).
- **Rationale**: FR-009; no screen reads either field. Only code orphaned by this change is
  removed (constitution, Principle I: no unrelated refactors).

## R6. How the game screen learns the drawer and word

- **Decision**: The host's start response already carries the host's own view (drawer → with
  word). Other players reach `/game` from a lobby poll whose snapshot includes `drawerId` (no
  word). The game screen renders from the store; no new polling is added in this feature.
- **Rationale**: The round state does not change after start until feature 003 adds guesses,
  which will introduce game-screen polling.

## R7. Effect on feature 001 checks

- **Decision**: Body validation now runs before the room lookup, so a join with a valid code
  but no name returns "Enter your name." instead of 404/409. Feature 001's quickstart `curl`
  lines for unknown-room and late-join checks are updated to send a name.
- **Rationale**: Validating input before acting is the existing route pattern; the spec's edge
  case (code message before name message) still holds because params are parsed first.

## R8. Testing approach

- **Decision**: vitest for name schema cases (blank, spaces, trim, 20 vs 21 characters), word
  rule (`ABCD` → `pizza`, count progression, always a starter word), drawer assignment, and
  snapshot visibility for drawer / guesser / unknown / anonymous viewers and lobby rooms.
  Game-screen labels are checked manually in two tabs.
- **Rationale**: Constitution Principle V; no component-test library (feature 001, R8).
